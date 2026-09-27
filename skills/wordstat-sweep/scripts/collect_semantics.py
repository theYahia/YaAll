#!/usr/bin/env python3
"""
collect_semantics.py - Semantic core collection for gosmax.ru
Algorithm: SERP-overlap clustering (RU SEO standard, aggregator Precision=3-4)

Usage:
    python research/scripts/collect_semantics.py [--depth N] [--min-expand V]

Output:
    research/semantic_core.csv  - 7 columns: phrase|volume|intent|cluster|depth|source_seed|target_page
"""

import csv
import json
import os
import re
import sys
import time
import urllib.error
import urllib.request
from collections import defaultdict, deque
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

# ── Config ─────────────────────────────────────────────────────────────────
SERP_OVERLAP_THRESHOLD = 1   # min shared seeds to merge clusters
# NOTE: In true SERP-overlap, threshold=3-4 uses shared SERP URLs.
# Here we use Wordstat topRequests as proxy: threshold=1 means "appeared in same seed's
# related list" - equivalent in signal quality for this data density (30 seeds, ~100-600 phrases).
# 2026-07-25: было 20 с комментарием «topRequests returns ≤20» — это неверно. Живая проверка
# на «max каналы»: num_phrases=50 вернул ровно 50 фраз, num_phrases=100 — ровно 100 (суммарный
# объём 52 917 → 59 934). Лимит был наш собственный и резал сбор в 5 раз.
# 24.09: num_phrases=2000 на «мессенджер макс» вернул ровно 2000 фраз, хвост — до count 15.
# Один вызов даёт в 20 раз больше, чем прежние 100, а квота считает вызовы, не фразы.
MAX_RELATED = 2000
# Насыщение снежного кома: последние N раскрытий вместе принесли новых фраз меньше чем на
# SHARE от уже собранного объёма → дальше копать дороже, чем находить.
SATURATION_WINDOW = 50
SATURATION_SHARE = 0.01
# Шум омонимов «max/макс»: iPhone Pro Max, Max Payne, цены и торренты. Такие фразы остаются в ядре
# (их режут intent_map и build_content_plan), но не раскрываются: иначе квота уходит на чужие ядра.
NOISE = re.compile(r"pro\s*max|про\s*макс|promax|промакс|\bцена|\bкупить|\bотзыв|чехл|чехол|\d+\s*gb|ультра|характеристик|\bдрифт|\bmad\b|\bбош|\bпорно|payne|пейн|торрент|\b3ds|\b3д\b|станци|airpods", re.I)
# «Также ищут» (associations) приходят в том же ответе topRequests и квоты не стоят. Но у «макс»
# в ассоциациях и «телеграм», и «госуслуги» — берём только фразы про сам мессенджер.
MAX_TOKEN = re.compile(r"\b(макс|max|мах)(е|а|у|ом|ик|ике)?\b", re.I)
CACHE_PATH = Path(__file__).resolve().parents[1] / "_raw_data" / "wordstat_cache" / f"topRequests_{MAX_RELATED}.jsonl"
RATE_DELAY = 0.35            # пауза между вызовами; от ЧАСОВОЙ квоты не спасает — см. _pace()
API_TIMEOUT = 15
# Квота ключа, снята живьём 05.09: «wordstatRequestsPerHour.rate ... allowed 100 requests».
# Держим 95, чтобы оставить запас на ручные проверки тем же ключом.
QUOTA_PER_HOUR = int(os.environ.get("WORDSTAT_QUOTA_PER_HOUR", "95"))
QUOTA_WINDOW_S = 3600
_CALLS: deque[float] = deque()

# ── Intent classification (Q2 research: RU SEO tier taxonomy) ──────────────
# Order matters: first match wins. T4/T5 checked before T3 to avoid misclassification.
_INTENT_RULES = [
    ("T1", re.compile(r"купить|заказать|стоимость|цена|тариф|скачать|установить|подключить", re.I)),
    ("T2", re.compile(r"лучш|рейтинг|топ[\s-]|сравнить|отзывы|выбрать|какой лучше|обзор", re.I)),
    # T4: MAX Messenger branded/navigational queries
    ("T4", re.compile(r"\bmax\b|\bмакс\b|\bмах\b|gosmax", re.I)),
    ("T5", re.compile(r"москв|спб|санкт.петербург|питер|краснодар|новосибирск|рядом|в городе|регион", re.I)),
    # T3: informational — anchored start OR mid-phrase patterns (Q9: conversational 6+ word queries)
    ("T3", re.compile(
        r"^(как|что такое|зачем|почему|когда|кто такой|для чего|чем отличается|безопасн)\b"
        r"|что умеет|как работает|как найти|как удалить|как установить|для чего нужен"
        r"|бесплатн|официальн",
        re.I,
    )),
]


def classify_intent(phrase: str) -> str:
    for tier, pat in _INTENT_RULES:
        if pat.search(phrase):
            return tier
    return "T3"  # default: informational


# ── Target page mapping for gosmax.ru ──────────────────────────────────────
_HOW_TO_RE = re.compile(
    r"как (добавить|создать|пользоваться|использовать|подключить|настроить|найти|установить|удалить|работает|включить)",
    re.I,
)
_CATALOG_RE = re.compile(r"каталог|список ботов|все боты", re.I)
_CATEGORY_MAP = {
    "category_commercial": "business",
    "category_admin":       "admin",
    "category_entertainment": "entertainment",
    "category_channels":    "channels",
    "category_ai":          "ai",
    "category_gov":         "gov",
    "category_education":   "education",
    "category_tools":       "tools",
    "category_general":     "",
    "category_navigational": "",
}


def map_target_page(phrase: str, seed_intent: str) -> str:
    if _HOW_TO_RE.search(phrase):
        return "/blog/how-to-use-bots-max"
    if _CATALOG_RE.search(phrase):
        return "/catalog/"
    if seed_intent.startswith("brand_bot"):
        # Derive slug from first word of seed phrase
        slug = phrase.split()[0].lower()
        return f"/catalog/{slug}"
    if seed_intent in _CATEGORY_MAP:
        cat = _CATEGORY_MAP[seed_intent]
        return f"/catalog/{cat}" if cat else "/catalog/"
    if seed_intent == "how_to":
        return "/blog/how-to-use-bots-max"
    return "/catalog/"


# ── API helpers ─────────────────────────────────────────────────────────────

def _load_env():
    env = Path(__file__).resolve().parents[2] / ".env.local"
    if not env.exists():
        return
    for line in env.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, _, v = line.partition("=")
        os.environ.setdefault(k.strip(), v.strip())


def _pace() -> None:
    """Держит темп под часовой квотой Wordstat, вместо того чтобы упираться в неё и ретраить.

    05.09.2026: прогон на 138 сидах повис. Ключ отдавал `search-api.wordstatRequestsPerHour.rate
    rate quota limit exceed: allowed 100 requests`, а ретрай ждал 30/90/240 с — то есть после
    сотого запроса каждый сид сгорал за шесть минут и терялся молча (`return []`), и ядро
    выглядело собранным. Реактивный ретрай под ЧАСОВУЮ квоту не работает в принципе: ждать надо
    до сдвига окна, а это до часа.

    Здесь окно считается явно: помним время последних вызовов и, упершись в лимит, спим ровно до
    того момента, когда самый старый вызов выпадет из часа. Прогон становится предсказуемым —
    138 сидов это ~1,5 часа, — и ни один сид не теряется.
    """
    now = time.monotonic()
    while _CALLS and now - _CALLS[0] >= QUOTA_WINDOW_S:
        _CALLS.popleft()
    if len(_CALLS) >= QUOTA_PER_HOUR:
        wait = QUOTA_WINDOW_S - (now - _CALLS[0]) + 1
        print(f"  [quota] {len(_CALLS)}/{QUOTA_PER_HOUR} за час — ждём {wait / 60:.1f} мин", flush=True)
        time.sleep(wait)
        _pace()
        return
    _CALLS.append(now)


def _post(path: str, body: dict, api_key: str, folder_id: str) -> dict:
    _pace()
    url = f"https://searchapi.api.cloud.yandex.net/{path}"
    data = json.dumps(body, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(
        url, data=data,
        headers={
            "Authorization": f"Api-Key {api_key}",
            "Content-Type": "application/json; charset=utf-8",
            "x-folder-id": folder_id,
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=API_TIMEOUT) as r:
        return json.loads(r.read().decode("utf-8"))


def top_requests(phrase: str, api_key: str, folder_id: str, num_phrases: int = MAX_RELATED) -> list[dict]:
    # Ретрай на 429/таймаут. 2026-07-25: раньше любая ошибка (включая упор в квоту
    # freemium ~100 req/час) молча возвращала [], сид терялся, а ядро выглядело собранным —
    # тихий отказ ровно того сорта, что уже ловили в verify_core. Теперь ждём и повторяем.
    for attempt in range(4):
        try:
            data = _post("v2/wordstat/topRequests",
                         {"phrase": phrase, "num_phrases": num_phrases}, api_key, folder_id)
            break
        except Exception as e:
            if isinstance(e, urllib.error.HTTPError) and e.code in (401, 403):
                # Пустой баланс Yandex Cloud или отозванный ключ. Раньше сид молча терялся
                # (return []), а ядро выглядело собранным. Кэш на диске — перезапуск продолжит.
                print(f"STOP: Wordstat {e.code} на {phrase!r} — баланс Yandex Cloud или ключ. "
                      f"Кэш сохранён, перезапуск той же командой продолжит с места.", file=sys.stderr, flush=True)
                sys.exit(2)
            msg = str(e).lower()
            quota = "429" in msg or "quota" in msg
            transient = quota or "timed out" in msg or "timeout" in msg or "503" in msg
            if transient and attempt < 3:
                # 429 от ЧАСОВОЙ квоты не рассасывается за полминуты. Такое бывает, когда окно
                # выбрано до старта прогона — _pace() про это не знает, его счётчик пуст. Ждём
                # десятками минут, а не секундами; сетевые же заминки лечатся коротко.
                wait = (600, 900, 1200)[attempt] if quota else (30, 90, 240)[attempt]
                print(f"  [{'quota' if quota else 'retry'}] {phrase!r} → пауза {wait // 60} мин "
                      f"(попытка {attempt + 2}/4)", flush=True)
                time.sleep(wait)
                continue
            print(f"  WARN topRequests({phrase!r}): {e}", file=sys.stderr, flush=True)
            return []
    try:
        # API returns {"results": [...], "associations": [...]} with count as string
        _ASSOC[phrase] = _parse_items(data.get("associations"))
        return _parse_items(data.get("results") or data.get("topRequests"))
    except Exception as e:
        print(f"  WARN topRequests({phrase!r}): {e}", file=sys.stderr)
        return []


def _parse_items(items) -> list[dict]:
    result = []
    for item in items or []:
        p = item.get("phrase") or item.get("request") or ""
        raw_count = item.get("count") or item.get("shows") or 0
        try:
            count = int(raw_count)
        except (ValueError, TypeError):
            count = 0
        if p:
            result.append({"phrase": p, "count": count})
    return result


_ASSOC: dict[str, list[dict]] = {}


def assoc_items(phrase: str) -> list[dict]:
    """«Также ищут» для уже запрошенной фразы — только про мессенджер и без шума."""
    return [a for a in _ASSOC.get(phrase, []) if MAX_TOKEN.search(a["phrase"]) and not NOISE.search(a["phrase"])]


_CACHE: dict[str, list[dict]] | None = None


def cached_top_requests(phrase: str, api_key: str, folder_id: str, cache_path: Path = CACHE_PATH) -> list[dict]:
    """top_requests() с кэшем на диске (JSONL, дописывается по строке).

    Полный свип — это часы под часовой квотой; обрыв на пятом часу без кэша сжигал квоту
    заново. Пустой ответ не кэшируется: почти всегда это WARN (квота, сеть), а не пустой спрос.
    """
    global _CACHE
    if _CACHE is None:
        _CACHE = {}
        if cache_path.exists():
            for line in cache_path.read_text(encoding="utf-8").splitlines():
                rec = json.loads(line)
                _CACHE[rec["phrase"]] = rec["items"]
                _ASSOC[rec["phrase"]] = rec.get("assoc", [])  # записи до 27.09 без assoc не перезапрашиваем
    if phrase in _CACHE:
        return _CACHE[phrase]
    items = top_requests(phrase, api_key, folder_id)
    if items:
        _CACHE[phrase] = items
        cache_path.parent.mkdir(parents=True, exist_ok=True)
        with cache_path.open("a", encoding="utf-8") as f:
            f.write(json.dumps({"phrase": phrase, "items": items, "assoc": _ASSOC.get(phrase, [])},
                               ensure_ascii=False) + "\n")
    return items


def snowball(frontier, phrase_to_seeds, phrase_volume, source_seed_map, fetch,
             depth: int, min_expand: int, saturation: bool = True) -> int:
    """Раскрывает найденные фразы уровень за уровнем, крупные первыми, до насыщения.

    Правит три словаря на месте, возвращает число раскрытий. Раньше глубина 2 раскрывала
    КАЖДУЮ фразу без порога — на ядре в тысячи фраз это сутки квоты без возможности остановиться.
    saturation=False (27.09): насыщение 24.09 остановило ком через 50 раскрытий из 2 292 — долю
    считали от объёма, где ~20 % дают «мессенджер макс» и «max ru», и хвосты тем не раскрылись.
    """
    expanded = set()
    total = sum(phrase_volume.values()) or 1
    calls = 0
    for level in range(2, depth + 1):
        frontier = sorted({p for p in frontier if p not in expanded and phrase_volume.get(p, 0) >= min_expand
                           and not NOISE.search(p)},
                          key=lambda p: -phrase_volume.get(p, 0))
        print(f"\n[semantics] уровень {level}: раскрываем {len(frontier)} фраз (объём >= {min_expand})", flush=True)
        found: list[str] = []
        recent: deque[int] = deque(maxlen=SATURATION_WINDOW)
        for i, phrase in enumerate(frontier, 1):
            expanded.add(phrase)
            calls += 1
            gain = 0
            for item in fetch(phrase)[:MAX_RELATED] + assoc_items(phrase):
                child, count = item["phrase"], item["count"]
                if child not in phrase_to_seeds:
                    found.append(child)
                    gain += count
                phrase_to_seeds[child] |= phrase_to_seeds[phrase]
                source_seed_map.setdefault(child, source_seed_map.get(phrase, phrase))
                if count > phrase_volume.get(child, 0):
                    phrase_volume[child] = count
            total += gain
            recent.append(gain)
            if i % 50 == 0:
                print(f"  [{i}/{len(frontier)}] фраз {len(phrase_to_seeds)}, объём {total}", flush=True)
            if saturation and len(recent) == SATURATION_WINDOW and sum(recent) < SATURATION_SHARE * total:
                print(f"  насыщение: последние {SATURATION_WINDOW} раскрытий дали {sum(recent)} "
                      f"из {total} ({sum(recent) / total:.2%}) — стоп", flush=True)
                return calls
        frontier = found
    return calls


# ── Wordstat regions + dynamics (C-2 enrichment) ─────────────────────────────
# Mapping топ-30 region IDs → читаемые имена (Geo-tree Yandex). Если region ID
# не в словаре — записываем сырой ID. Полный список можно подгрузить через
# `/v2/wordstat/regionsList` endpoint и закэшировать (Phase D).
REGION_NAMES: dict[int, str] = {
    225: "Россия",
    1: "Москва и Московская область",
    2: "Санкт-Петербург и Ленобласть",
    3: "Северо-Запад",
    4: "Юг России",
    5: "Урал",
    6: "Поволжье",
    7: "Дальний Восток",
    8: "Сибирь",
    9: "Северный Кавказ",
    10174: "Санкт-Петербург",
    11316: "Москва",
    10645: "Краснодарский край",
    11119: "Татарстан",
    11131: "Свердловская область",
    11192: "Новосибирская область",
    10987: "Башкортостан",
    11012: "Челябинская область",
    11108: "Самарская область",
    10995: "Нижегородская область",
    10231: "Ростовская область",
    11079: "Пермский край",
    11225: "Воронежская область",
    11079: "Пермский край",
}


def wordstat_regions(phrase: str, api_key: str, folder_id: str) -> list[dict]:
    """POST v2/wordstat/regions. Returns [{region_id, region_name, count, affinity_index}]."""
    try:
        data = _post("v2/wordstat/regions", {"phrase": phrase}, api_key, folder_id)
        items = data.get("results") or []
        result = []
        for item in items:
            try:
                rid = int(item.get("region", 0))
            except (ValueError, TypeError):
                rid = 0
            try:
                count = int(item.get("count", 0))
            except (ValueError, TypeError):
                count = 0
            try:
                affinity = float(item.get("affinityIndex", 100))
            except (ValueError, TypeError):
                affinity = 100.0
            result.append({
                "region_id": rid,
                "region_name": REGION_NAMES.get(rid, f"region_{rid}"),
                "count": count,
                "affinity_index": affinity,
            })
        return result
    except Exception as e:
        print(f"  WARN regions({phrase!r}): {e}", file=sys.stderr)
        return []


def wordstat_dynamics(phrase: str, api_key: str, folder_id: str) -> str:
    """POST v2/wordstat/dynamics. Returns seasonality: 'high'/'medium'/'flat'/'low_volume'/'error'.

    Yandex API требует volume >10K/мес иначе error. Считаем coefficient of variation
    от месячных значений: high → выраженная сезонность, flat → ровный спрос.
    """
    try:
        data = _post("v2/wordstat/dynamics", {
            "phrase": phrase,
            "period": "monthly",
        }, api_key, folder_id)
        items = data.get("results") or []
        if len(items) < 6:
            return "low_volume"
        counts: list[int] = []
        for item in items:
            try:
                counts.append(int(item.get("count", 0)))
            except (ValueError, TypeError):
                pass
        if not counts or max(counts) == 0:
            return "low_volume"
        avg = sum(counts) / len(counts)
        if avg == 0:
            return "low_volume"
        spread = (max(counts) - min(counts)) / avg
        if spread > 0.7:
            return "high"
        if spread > 0.3:
            return "medium"
        return "flat"
    except Exception as e:
        msg = str(e).lower()
        if "10000" in msg or "low" in msg or "insufficient" in msg:
            return "low_volume"
        print(f"  WARN dynamics({phrase!r}): {e}", file=sys.stderr)
        return "error"


def enrich_with_regions(rows: list[dict], api_key: str, folder_id: str) -> None:
    """Добавляет top_region, affinity_index, regions_top3 к каждому row."""
    print(f"  [regions] enriching {len(rows)} phrases…")
    for i, r in enumerate(rows, 1):
        if i % 25 == 0 or i == 1:
            print(f"    [{i}/{len(rows)}]", flush=True)
        regs = wordstat_regions(r["phrase"], api_key, folder_id)
        time.sleep(RATE_DELAY)
        if regs:
            top = max(regs, key=lambda x: x["count"])
            top3 = sorted(regs, key=lambda x: -x["count"])[:3]
            r["top_region"] = top["region_name"]
            r["affinity_index"] = round(top["affinity_index"], 1)
            r["regions_top3"] = "; ".join(f"{x['region_name']}:{x['count']}" for x in top3)
        else:
            r["top_region"] = ""
            r["affinity_index"] = ""
            r["regions_top3"] = ""


def enrich_with_dynamics(rows: list[dict], api_key: str, folder_id: str, threshold: int = 10000) -> None:
    """Добавляет seasonality колонку. Запрашивает dynamics только для phrases с volume>=threshold."""
    high_vol = [r for r in rows if r["volume"] >= threshold]
    print(f"  [dynamics] {len(high_vol)} phrases with volume >= {threshold}")
    for i, r in enumerate(high_vol, 1):
        if i % 5 == 0 or i == 1:
            print(f"    [{i}/{len(high_vol)}]", flush=True)
        r["seasonality"] = wordstat_dynamics(r["phrase"], api_key, folder_id)
        time.sleep(RATE_DELAY)
    # Низковолюмные — пустое значение (API их не вернёт, экономим quota)
    for r in rows:
        if "seasonality" not in r:
            r["seasonality"] = ""


# ── Seed loading ─────────────────────────────────────────────────────────────

def load_seeds(path: Path) -> list[tuple[str, str]]:
    """Returns [(phrase, intent_hint), ...]."""
    seeds: list[tuple[str, str]] = []
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        phrase, _, hint = line.partition("#")
        seeds.append((phrase.strip(), hint.strip() or "general"))
    return seeds


# ── Union-Find ───────────────────────────────────────────────────────────────

def build_clusters(phrases: list[str], edges: list[tuple[str, str]]) -> dict[str, int]:
    parent = {p: p for p in phrases}

    def find(x: str) -> str:
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    def union(a: str, b: str):
        ra, rb = find(a), find(b)
        if ra != rb:
            parent[ra] = rb

    for a, b in edges:
        union(a, b)

    root_to_id: dict[str, int] = {}
    result: dict[str, int] = {}
    for p in phrases:
        root = find(p)
        if root not in root_to_id:
            root_to_id[root] = len(root_to_id) + 1
        result[p] = root_to_id[root]
    return result


# ── Main ─────────────────────────────────────────────────────────────────────

def main():
    import argparse
    parser = argparse.ArgumentParser(description="Yandex Wordstat semantic core builder")
    parser.add_argument("--depth", type=int, default=1, help="сколько уровней раскрывать: 1 — только сиды")
    parser.add_argument("--min-expand", type=int, default=0, help="раскрывать только фразы с объёмом >= V")
    parser.add_argument("--no-saturation", action="store_true", help="раскрыть весь фронтир, без стопа по насыщению")
    parser.add_argument("--regions", action="store_true", help="enrich rows with top_region + affinity_index (extra Yandex Cloud quota)")
    parser.add_argument("--dynamics", action="store_true", help="enrich high-volume rows with seasonality (extra quota, only volume>=10K)")
    parser.add_argument("--seeds", default=None, help="path to seed_keywords.txt (default: <project>/research/seed_keywords.txt)")
    parser.add_argument("--output", default=None, help="output CSV path (default: <project>/research/semantic_core.csv)")
    args = parser.parse_args()

    _load_env()
    api_key = os.environ.get("YANDEX_SEARCH_API_KEY", "")
    folder_id = os.environ.get("YANDEX_FOLDER_ID", "")
    if not api_key:
        sys.exit("ERROR: YANDEX_SEARCH_API_KEY not found in .env.local")

    base = Path(__file__).resolve().parents[1]
    seeds_path = Path(args.seeds) if args.seeds else (base / "seed_keywords.txt")
    output_path = Path(args.output) if args.output else (base / "semantic_core.csv")

    seeds = load_seeds(seeds_path)
    seed_intent: dict[str, str] = {ph: hint for ph, hint in seeds}
    print(f"[semantics] {len(seeds)} seeds loaded from {seeds_path.name}")
    print(f"[semantics] depth={args.depth}, min_expand={args.min_expand}, threshold={SERP_OVERLAP_THRESHOLD}")

    # Phase 1 - Expansion: topRequests for each seed
    # phrase_to_seeds[phrase] = set of seeds that listed this phrase in their topRequests
    phrase_to_seeds: defaultdict[str, set[str]] = defaultdict(set)
    phrase_volume: dict[str, int] = {}
    source_seed_map: dict[str, str] = {}

    for i, (seed, hint) in enumerate(seeds, 1):
        print(f"  [{i:02d}/{len(seeds)}] {seed!r}...", end=" ", flush=True)
        items = cached_top_requests(seed, api_key, folder_id)
        time.sleep(RATE_DELAY)

        collected = 0
        for item in items[:MAX_RELATED] + assoc_items(seed):
            phrase = item.get("phrase") or item.get("request") or ""
            count = item.get("count") or item.get("shows") or 0
            if not phrase:
                continue
            phrase_to_seeds[phrase].add(seed)
            if phrase not in source_seed_map:
                source_seed_map[phrase] = seed
            if count > phrase_volume.get(phrase, 0):
                phrase_volume[phrase] = count
            collected += 1

        # seed itself always present
        phrase_to_seeds[seed].add(seed)
        if seed not in source_seed_map:
            source_seed_map[seed] = seed

        print(f"{collected} related")

    # Phase 1b - снежный ком (--depth >= 2)
    if args.depth >= 2:
        snowball([p for p in phrase_to_seeds if p not in seed_intent], phrase_to_seeds, phrase_volume,
                 source_seed_map, lambda p: cached_top_requests(p, api_key, folder_id),
                 args.depth, args.min_expand, saturation=not args.no_saturation)

    all_phrases = list(phrase_to_seeds.keys())
    print(f"\n[semantics] {len(all_phrases)} unique phrases after expansion")

    # Phase 2 - SERP-overlap clustering
    print(f"[semantics] SERP-overlap clustering (threshold >= {SERP_OVERLAP_THRESHOLD})...")
    assert SERP_OVERLAP_THRESHOLD == 1, "цепочка ниже верна только для порога 1"
    # threshold=1: общий сид = ребро. Цепочка внутри группы сида даёт ту же связность, что и
    # все пары, но за O(n), а не O(n²) — на снежном коме в десятки тысяч фраз пары не досчитать.
    by_seed: defaultdict[str, list[str]] = defaultdict(list)
    for p in all_phrases:
        for sd in phrase_to_seeds[p]:
            by_seed[sd].append(p)
    edges = [(g[i], g[i + 1]) for g in by_seed.values() for i in range(len(g) - 1)]

    print(f"  {len(edges)} edges found")
    clusters = build_clusters(all_phrases, edges)
    n_clusters = len(set(clusters.values()))
    print(f"  {n_clusters} clusters formed")

    # Phase 3 - Assemble rows
    rows = []
    for phrase in all_phrases:
        src = source_seed_map.get(phrase, "")
        src_intent = seed_intent.get(src, "general")
        rows.append({
            "phrase":      phrase,
            "volume":      phrase_volume.get(phrase, 0),
            "intent":      classify_intent(phrase),
            "cluster":     clusters[phrase],
            "depth":       1 if phrase in seed_intent else 2,
            "source_seed": src,
            "target_page": map_target_page(phrase, src_intent),
        })

    # Q6/Q9 research: 6+ word phrases = AI-search priority, target ≥30% of core
    for r in rows:
        r["longtail"] = "1" if len(r["phrase"].split()) >= 6 else "0"

    rows.sort(key=lambda r: -r["volume"])

    # Phase 3.5 - Optional enrichments (extra quota cost)
    if args.regions:
        print(f"\n[semantics] --regions: enriching with regional affinity")
        enrich_with_regions(rows, api_key, folder_id)
    if args.dynamics:
        print(f"\n[semantics] --dynamics: enriching with seasonality (high-volume only)")
        enrich_with_dynamics(rows, api_key, folder_id)

    # Phase 4 - Write CSV
    fieldnames = ["phrase", "volume", "intent", "cluster", "depth", "longtail", "source_seed", "target_page"]
    if args.regions:
        fieldnames += ["top_region", "affinity_index", "regions_top3"]
    if args.dynamics:
        fieldnames += ["seasonality"]
    # CSV writer should ignore extra keys to be safe (extrasaction='ignore')
    with open(output_path, "w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)

    longtail_count = sum(1 for r in rows if r["longtail"] == "1")
    longtail_pct = longtail_count / len(rows) * 100 if rows else 0
    print(f"\n[semantics] OK {len(rows)} rows -> {output_path}")
    print(f"  Long-tail (6+ words): {longtail_count}/{len(rows)} = {longtail_pct:.0f}%  (target: >=30% per Q6/Q9 research)")
    print(f"\nTop 10 by volume:")
    print(f"  {'volume':>8}  {'phrase':<45}  {'intent'}  cluster  target_page")
    print(f"  {'-'*8}  {'-'*45}  {'-'*6}  {'-'*7}  {'-'*20}")
    for r in rows[:10]:
        print(f"  {r['volume']:>8}  {r['phrase']:<45}  {r['intent']}  {r['cluster']:>7}  {r['target_page']}")

    print(f"\nCluster summary:")
    from collections import Counter
    cluster_sizes = Counter(r["cluster"] for r in rows)
    for cid, size in sorted(cluster_sizes.items(), key=lambda x: -x[1])[:10]:
        top = next(r for r in rows if r["cluster"] == cid)
        print(f"  cluster {cid:>3}: {size:>3} phrases  - top: {top['phrase']!r}")


if __name__ == "__main__":
    main()
