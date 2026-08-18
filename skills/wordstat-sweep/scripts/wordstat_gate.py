#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""wordstat_gate.py — demand-валидация ниши через Yandex Wordstat (топ-запросы).

Считает combined-объём top-3 seeds на нишу и выдаёт вердикт GO / MAYBE-PILOT / RED-PIVOT
по порогам CLAUDE.md Wordstat-gate (≥5000 / 2000-5000 / <2000 показов/мес).

Метод объёма per seed (дефолт `by_seed_max`, memory wordstat-gate-max-per-seed):
    MAX count в раскрытии topRequests — избегает false-RED от склонений/порядка слов.
    combined = верхняя граница (broad-head inflation).
`--exact`: берёт count фразы, ТОЧНО равной seed (метод scan.py:wordstat_volume) — консервативнее.

Standalone (pure stdlib): http/cache/backoff инлайнены из github-stars/scan.py, чтобы скилл
не зависел от того монолита. НЕ путать с collect_semantics.py (тот собирает SEO-ядро).

Это demand-валидация, НЕ вердикт. GO/PARK — за пользователем (user-gate). Слой narrative
(false-GO downgrade по top-фразе) пишет Claude поверх чисел — см. SKILL.md.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

# Windows-консоль по умолчанию cp1251 → кириллица/эмодзи в print() кидают UnicodeEncodeError.
try:
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
except Exception:
    pass

WORDSTAT_URL = "https://searchapi.api.cloud.yandex.net/v2/wordstat/topRequests"
NUM_PHRASES = 15          # раскрытие topRequests (как канон-эталон gate)
API_TIMEOUT = 25
CACHE_TTL_DAYS = 30
BACKOFF = (6, 18, 35)     # сек на транзиентную ошибку/rate-limit (~100 req/час у Yandex)

# Пороги Wordstat-gate — единый источник (CLAUDE.md + scan.py demand-ось).
GO_MIN = 5000
MAYBE_MIN = 2000


def verdict(combined: int) -> str:
    return "GO" if combined >= GO_MIN else ("MAYBE-PILOT" if combined >= MAYBE_MIN else "RED/PIVOT")


# ── env + http + cache (инлайн из scan.py) ───────────────────────────────────

def load_env(start: Path | None = None) -> None:
    """Walk-up от cwd (и от скрипта) ища .env.local — кладёт YANDEX_* в environ."""
    seen = set()
    roots = [start or Path.cwd(), Path(__file__).resolve().parent]
    for root in roots:
        for d in [root, *root.parents]:
            envp = d / ".env.local"
            if envp in seen or not envp.exists():
                continue
            seen.add(envp)
            for line in envp.read_text(encoding="utf-8").splitlines():
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                k, _, v = line.partition("=")
                os.environ.setdefault(k.strip(), v.strip())


def http_json(url, headers=None, data=None, timeout=API_TIMEOUT):
    headers = dict(headers or {})
    body = None
    if data is not None:
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        headers.setdefault("Content-Type", "application/json; charset=utf-8")
    req = urllib.request.Request(url, data=body, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return json.loads(r.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        detail = e.read().decode("utf-8", "ignore")[:300]
        raise RuntimeError(f"HTTP {e.code} {url.split('?')[0]} :: {detail}") from None


def _cache_dir() -> Path:
    d = Path(os.environ.get("WORDSTAT_GATE_CACHE", Path.cwd() / ".wordstat-cache"))
    d.mkdir(parents=True, exist_ok=True)
    return d


def _cache_path(kind: str, key: str) -> Path:
    # md5-суффикс обязателен: re.sub схлопывает pure-кириллицу в одинаковое имя → коллизия кэша.
    safe = (re.sub(r"[^A-Za-z0-9._-]+", "_", key)[:80].strip("_") or "k")
    h = hashlib.md5(key.encode("utf-8")).hexdigest()[:10]
    sub = _cache_dir() / kind
    sub.mkdir(parents=True, exist_ok=True)
    return sub / f"{safe}-{h}.json"


def cache_get(kind, key, ttl_days=CACHE_TTL_DAYS, no_cache=False):
    if no_cache:
        return None
    p = _cache_path(kind, key)
    if not p.exists() or (time.time() - p.stat().st_mtime) > ttl_days * 86400:
        return None
    try:
        return json.loads(p.read_text(encoding="utf-8")).get("data")
    except Exception:
        return None


def cache_put(kind, key, data):
    _cache_path(kind, key).write_text(
        json.dumps({"ts": int(time.time()), "data": data}, ensure_ascii=False, indent=2),
        encoding="utf-8")
    return data


# ── seed volume ──────────────────────────────────────────────────────────────

def seed_volume(seed, headers, exact=False, no_cache=False):
    """Объём seed. exact=False → MAX в раскрытии; exact=True → count точной фразы (fallback: первый).
    Возвращает (volume, top_phrase). volume=None → API не ответил (≠ настоящий 0-спрос: не кэшируется,
    не считается в combined — иначе отказ доступа маскируется под мёртвую нишу = false-RED)."""
    kind = "wordstat_exact" if exact else "wordstat_max"
    cached = cache_get(kind, seed, no_cache=no_cache)
    if cached is not None:
        return cached.get("volume", 0), cached.get("top", "")
    resp = None
    for att in range(3):
        try:
            resp = http_json(WORDSTAT_URL, headers=headers,
                             data={"phrase": seed, "num_phrases": NUM_PHRASES})
            break
        except Exception as e:
            msg = str(e).lower()
            if ("429" in msg or "timeout" in msg or "timed out" in msg) and att < 2:
                time.sleep(BACKOFF[att])
                continue
            print(f"   [wordstat error] {seed!r}: {e}", file=sys.stderr)
            break
    if resp is None:
        return None, "(no response)"
    results = resp.get("results") or resp.get("topRequests") or []

    def _count(r):
        try:
            return int(str(r.get("count") or r.get("shows") or 0) or 0)
        except (ValueError, TypeError):
            return 0

    if exact:
        norm = seed.strip().lower()
        v = next((_count(r) for r in results if str(r.get("phrase", "")).strip().lower() == norm), None)
        if v is None:                              # точной формы нет → первый (как scan.py)
            v, top = (_count(results[0]), results[0].get("phrase", "")) if results else (0, "(no exact)")
        else:
            top = seed
    else:
        v, top = 0, ""
        for r in results:
            c = _count(r)
            if c > v:
                v, top = c, r.get("phrase", "")
    cache_put(kind, seed, {"volume": v, "top": top})
    return v, top


# ── gate ─────────────────────────────────────────────────────────────────────

def run_gate(niches: dict, exact=False, no_cache=False) -> list[dict]:
    api_key = os.environ.get("YANDEX_SEARCH_API_KEY")
    folder = os.environ.get("YANDEX_FOLDER_ID")
    if not (api_key and folder):
        print("NO YANDEX CREDS (YANDEX_SEARCH_API_KEY + YANDEX_FOLDER_ID) — "
              "положи в <project>/.env.local. Gate не запущен.", file=sys.stderr)
        sys.exit(2)
    headers = {"Authorization": f"Api-Key {api_key}", "x-folder-id": folder}
    method = "exact-phrase" if exact else "max-per-seed"

    summary = []
    for name, seeds in niches.items():
        print(f"\n### {name}")
        vols = []
        for s in seeds:
            v, top = seed_volume(s, headers, exact=exact, no_cache=no_cache)
            vols.append({"seed": s, "volume": v, "top": top})
            print(f"   {(v if v is not None else 'ERR'):>9}  {s}   [top: {top}]")
        valid = sorted((x for x in vols if x["volume"] is not None),
                       key=lambda x: -x["volume"])
        if not valid:                              # все seeds без ответа → не мёртвая ниша, а отказ API
            combined, vd = None, "API-FAIL"
            print("   COMBINED top-3 = n/a  =>  API-FAIL (ни один seed не ответил — проверь креды/квоту)")
        else:
            combined = sum(x["volume"] for x in valid[:3])
            vd = verdict(combined)
            miss = len(vols) - len(valid)
            note = f"  (⚠ {miss}/{len(vols)} seeds без ответа)" if miss else ""
            print(f"   COMBINED top-3 = {combined}  =>  {vd}{note}")
        summary.append({"niche": name, "verdict": vd, "combined": combined,
                        "method": method, "seeds": vols})

    print("\n" + "=" * 64)
    print(f"WORDSTAT-GATE SUMMARY (combined top-3 by {method}):")
    order = {"GO": 0, "MAYBE-PILOT": 1, "RED/PIVOT": 2, "API-FAIL": 3}
    for row in sorted(summary, key=lambda x: (order.get(x["verdict"], 9), -(x["combined"] or 0))):
        c = row["combined"] if row["combined"] is not None else "n/a"
        print(f"   {row['verdict']:12} {c:>9}  {row['niche']}")
    print(f"Пороги: GO>={GO_MIN} | MAYBE-PILOT {MAYBE_MIN}-{GO_MIN} | RED/PIVOT<{MAYBE_MIN}")
    if not exact:
        print("⚠️ combined = верхняя граница (broad-head inflation). Смотри top-фразу per seed.")
    print("Decision GO/PARK = user-gate (demand-валидация, не вердикт).")
    return summary


def parse_gate_file(path: str) -> dict:
    """Формат: строка `# Имя ниши` открывает нишу, следующие непустые строки — seeds."""
    niches, cur = {}, None
    for raw in Path(path).read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line:
            continue
        if line.startswith("#"):
            cur = line.lstrip("#").strip()
            niches[cur] = []
        elif cur is not None:
            niches[cur].append(line)
    return {k: v for k, v in niches.items() if v}


def selftest():
    assert verdict(5000) == "GO", verdict(5000)
    assert verdict(9999) == "GO"
    assert verdict(2000) == "MAYBE-PILOT", verdict(2000)
    assert verdict(4999) == "MAYBE-PILOT"
    assert verdict(1999) == "RED/PIVOT", verdict(1999)
    assert verdict(0) == "RED/PIVOT"
    assert parse_gate_file  # smoke
    print("[selftest] OK — verdict thresholds 5000/2000 hold")


def main():
    ap = argparse.ArgumentParser(description="Wordstat demand-gate (GO/MAYBE-PILOT/RED-PIVOT)")
    g = ap.add_mutually_exclusive_group()
    g.add_argument("--gate", metavar="\"s1,s2,s3\"", help="одна ниша: seeds через запятую")
    g.add_argument("--gate-file", metavar="PATH", help="много ниш: `# имя` + seeds строками")
    ap.add_argument("--name", default="(ad-hoc ниша)", help="имя ниши для --gate")
    ap.add_argument("--exact", action="store_true", help="exact-phrase объём (консервативнее)")
    ap.add_argument("--json", metavar="PATH", help="дамп структурного результата")
    ap.add_argument("--no-cache", action="store_true", help="обойти кэш (проверка свежести)")
    ap.add_argument("--selftest", action="store_true", help="offline assert порогов, без API")
    args = ap.parse_args()

    if args.selftest:
        selftest()
        return
    load_env()
    if args.gate:
        seeds = [s.strip() for s in args.gate.split(",") if s.strip()]
        niches = {args.name: seeds}
    elif args.gate_file:
        niches = parse_gate_file(args.gate_file)
    else:
        ap.error("нужен --gate \"s1,s2,...\" или --gate-file PATH (или --selftest)")

    summary = run_gate(niches, exact=args.exact, no_cache=args.no_cache)
    if args.json:
        Path(args.json).write_text(
            json.dumps({"thresholds": {"GO": GO_MIN, "MAYBE": MAYBE_MIN}, "results": summary},
                       ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"\n[json] → {args.json}")


if __name__ == "__main__":
    main()
