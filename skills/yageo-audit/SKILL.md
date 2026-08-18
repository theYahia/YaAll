---
name: yageo-audit
description: ЭПОС-аудит уже-задеплоенного сайта через YaGEO scorer (Экспертность/Полезность/Оригинальность/Содержательность). Используй ПОСЛЕ деплоя — оценивает попадание страниц в ответы Алисы и Yandex AI Search. НЕ путать с /wordstat-sweep (тот — pre-content market scan). Триггеры — "/yageo-audit", "yageo audit", "ЭПОС-проверка", "ЭПОС audit", "проверить сайт на ЭПОС", "yageo gate", "audit сайта Yandex AI".
license: MIT — openclaw-skills
preamble-tier: 2
version: 1.0.0
---

# /yageo-audit

> 🖥 **На маке (дача, август 2026) этот скилл НЕ ЗАПУСКАЕТСЯ. Не пытаться — сказать сразу.**
>
> Прежняя версия памятки утверждала, что нет ни одной из трёх составляющих. Две теперь на месте:
> - пакет **YaGEO** — в этой же сборке, `../yageo/` (ставится `pip install -e`);
> - **`yageo_gate.py`** — рядом, в `scripts/`;
> - **сам задеплоенный сайт** — `gosmax.ru` и остальные проекты остались на выключенной машине.
>
> Не хватает только третьего — задеплоенного сайта под аудит. Его подставляет пользователь.
>
> Если всё же дойдёт до запуска: **везде ниже `python` читать как `python3`** — команды `python` на macOS нет. Голый `python` стоит в четырёх местах: строки **82** (проверка импорта `epos_scorer`), **108** и **111** (два вызова `yageo_gate.py`), **160** (`indexnow_ping.py`). И `D:/Yahia/CLAUDE.md` → `~/Yahia/CLAUDE.md`.

Прогон уже-задеплоенного сайта через YaGEO ЭПОС scorer. Возвращает per-page score 0-100 по 4 dimensions — Экспертность / Полезность / Оригинальность / Содержательность — критериям Yandex AI Search для попадания в ответы Алисы.

**Когда применять:**
- После деплоя batch SEO-контента (`generate_bot_content.py` → деплой → audit)
- Weekly snapshot для trend (см. `yageo_weekly.py`)
- Перед IndexNow ping — отсечь страницы которые сольют ranking

**НЕ применять:**
- Перед написанием контента — это pre-content market scan через `/wordstat-sweep`
- Для не-русскоязычного сайта — YaGEO заточен под Yandex AI Search heuristics
- Для SPA без SSR — scoring читает HTML, JS-only страницы вернут пусто

## Usage

```
/yageo-audit <site-or-sitemap-url>
/yageo-audit <site-url> --top 20 --threshold 60
/yageo-audit <project-path>          # auto-detect sitemap
```

**Примеры:**
- `/yageo-audit https://gosmax.ru/sitemap-0.xml`
- `/yageo-audit D:/Yahia/active/GosMaxCatalog --top 30`
- `/yageo-audit https://example.ru/ --threshold 70`

## Threshold policy

| Threshold | Mode | Поведение |
|---|---|---|
| **<60** | Hard fail | Страница НЕ попадёт в Yandex AI ответы — блок deploy / re-write |
| **60-70** | Soft warn | Default Phase B (post-deploy) — пропускаем deploy, фиксим в next iteration |
| **70-85** | Pass | Конкурентоспособный score |
| **>85** | Top-tier | Целевой для money-pages |

Default `--threshold 60` (soft gate). Hard-gate (`--threshold 70` блокирующий deploy) применять только после 7-14 дней наблюдения тренда (см. `yageo_weekly.py`).

## Process

<example>
Триггер-фразы:
- "/yageo-audit https://gosmax.ru/sitemap-0.xml"
- "ЭПОС-проверка сайта GosMaxCatalog"
- "yageo audit top 50 страниц перед IndexNow ping"
</example>

### Step 1: Determine input mode

Парсинг аргумента:
- **URL** на `*.xml` → sitemap mode → `--sitemap <url>`
- **URL** на любой другой path → single URL → `--urls <url>`
- **Project path** (`D:/Yahia/active/<project>`) → auto-detect:
  - `<project>/app/dist/sitemap-0.xml` (Astro/SSG default)
  - `<project>/dist/sitemap.xml`
  - `<project>/public/sitemap.xml`
  - Если ничего не нашёл → попросить URL явно

### Step 2: Verify YaGEO availability

Проверить что YaGEO установлен:
```bash
python -c "from scripts.epos_scorer import score_url; print('OK')"
```

Если **ImportError** → установить:
```bash
pip install -e D:/Yahia/active/YaGEO
```

Если папки `D:/Yahia/active/YaGEO` нет → клонировать:
```bash
git clone https://gitverse.ru/m3taR3B/YaGEO D:/Yahia/active/YaGEO
pip install -e D:/Yahia/active/YaGEO
```

### Step 3: Verify gate script

Проверить наличие `<project>/research/scripts/yageo_gate.py`. Если нет — скопировать эталон:
```bash
mkdir -p <project>/research/scripts
cp D:/Yahia/active/GosMaxCatalog/research/scripts/yageo_gate.py <project>/research/scripts/
```

### Step 4: Run audit

```bash
# Sitemap mode (рекомендованный для batch):
python research/scripts/yageo_gate.py --sitemap <sitemap-url> --top <N> --threshold 60 --workers 5

# Single-URL mode:
python research/scripts/yageo_gate.py --urls <url1> <url2> ... --threshold 60
```

Параметры:
- `--top N` — аудит только top-N URLs из sitemap (default 0 = все)
- `--threshold 60` — soft default; hard-gate подкручивай только после baseline
- `--workers 5` — параллельные HTTP fetch'ы (Yandex может throttle на >10)
- `--json` — emit summary как JSON для downstream pipe

Exit codes:
- `0` — все страницы ≥ threshold
- `1` — хоть одна < threshold
- `2` — config error (sitemap не найден / YaGEO не установлен)

### Step 5: Parse + report

Стандартный stdout формат:
```
[yageo-gate] auditing N URLs (threshold=60, workers=5)
  PASS  73  E= 75 P= 80 O= 65 S= 72  https://gosmax.ru/
  PASS  68  E= 70 P= 65 O= 60 S= 75  https://gosmax.ru/catalog/business
  FAIL  52  E= 45 P= 55 O= 50 S= 58  https://gosmax.ru/catalog/foo-bot

[yageo-gate] summary: 18/20 pass  avg=64.7/100
  worst 2 URLs (overall < 60):
    52  https://gosmax.ru/catalog/foo-bot
    58  https://gosmax.ru/catalog/bar-bot
```

### Output

Финальный отчёт юзеру:
```
[yageo-audit] DONE
- Site: <site>
- URLs audited: <N>
- Pass rate: <P>/<N> (<%>) — threshold <T>
- Average score: <avg>/100
- Distribution: E=<eAvg> P=<pAvg> O=<oAvg> S=<sAvg>
- Worst-3 (отдать на rewrite):
  <score> — <url1>
  <score> — <url2>
  <score> — <url3>
- Verdict:
  - GREEN if pass_rate ≥80% and avg ≥65 → ок для IndexNow ping
  - YELLOW if pass_rate 60-80% → fix worst-N перед массовым re-ping
  - RED if pass_rate <60% → review template / GigaChat prompts перед next batch

Next:
- Если GREEN → `python research/scripts/indexnow_ping.py` (см. SEO Content Pipeline)
- Если worst score из-за O (Оригинальность) → re-generate с `GigaChat-2-Max` вместо Lite
- Weekly trend → `yageo_weekly.py` снэпшот в `research/yageo_history/<date>.csv`
```

## Architecture reference

Канонический эталон: `D:/Yahia/active/GosMaxCatalog/` Phase B (post-deploy ЭПОС audit). Метрика после Phase B: avg 64.7/100, soft warn threshold 60. Полная методика — секция «SEO Content Pipeline» в `D:/Yahia/CLAUDE.md` блок «Гейтинг и качество».

YaGEO scorer репозиторий: `https://gitverse.ru/m3taR3B/YaGEO` (open-source, локально работает без API).

## Не путать с /wordstat-sweep

| | `/yageo-audit` | `/wordstat-sweep` |
|---|---|---|
| **Когда** | ПОСЛЕ деплоя | ДО написания контента |
| **Что меряет** | ЭПОС-score уже-опубликованных страниц | Объёмы запросов в Яндексе |
| **Output** | per-page 0-100 + worst-N | `semantic_core.csv` |
| **API** | YaGEO local (HTTP fetch + heuristics) | Yandex Search API (Wordstat) |
| **Стоит** | бесплатно | ~5-15 ₽/прогон |
| **Триггер cadence** | После каждого batch deploy / weekly trend | Перед каждым content-cycle (раз в 1-3 мес) |
