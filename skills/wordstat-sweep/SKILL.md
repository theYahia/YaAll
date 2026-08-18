---
name: wordstat-sweep
description: Два режима на одном Yandex Wordstat API. (1) SEO-ядро — top requests + регионы + сезонность ПЕРЕД написанием контента. (2) Gate — demand-валидация ниши: combined-объём top-3 seeds → вердикт GO/MAYBE-PILOT/RED-PIVOT (screen-niche). НЕ путать с /yageo-audit (пост-деплойный аудит). Триггеры — "/wordstat-sweep", "wordstat sweep", "семантическое ядро", "собрать семантику", "ядро запросов", "wordstat gate", "проверить спрос ниши", "wordstat для проекта", "yandex wordstat".
license: MIT — openclaw-skills
preamble-tier: 2
version: 1.1.0
---

# /wordstat-sweep

> 🖥 **На маке (дача, август 2026) — два обязательных исправления.**
>
> **1. Везде ниже `python` читать как `python3`.** Команды `python` на macOS не существует вообще. В этом файле голый `python` стоит в четырёх местах — строки **53, 58, 60** (три вызова `wordstat_gate.py`) и **159** (`collect_semantics.py`). Рабочий вызов gate-режима:
>
> ```bash
> python3 ~/.claude/skills/wordstat-sweep/scripts/wordstat_gate.py --selftest
> python3 ~/.claude/skills/wordstat-sweep/scripts/wordstat_gate.py \
>   --name "<ниша>" --gate "<seed1>,<seed2>,<seed3>"
> ```
>
> **2. Gate-режим ✅ живой, SEO-режим ❌ мёртвый.**
> - Gate: `wordstat_gate.py` **забандлен в пакете** (`skills/wordstat-sweep/scripts/`), копировать никуда не нужно. Нужен только ключ Yandex Cloud в `<project>/.env.local` и сеть. `--selftest` проверяет пороги **офлайн, без API и без квоты** — с него и начинать.
> - SEO-ядро: `collect_semantics.py` **лежит рядом**, в `scripts/`. Прежняя версия этой памятки утверждала, что он остался на выключенном ПК, — неверно, файл нашёлся и доехал. Шаг 3 «cp из эталона» не нужен. Учти: в скрипте зашит маппинг страниц под конкретный сайт, под свой проект его надо править.
> - `D:/Yahia/CLAUDE.md` (ссылки на SEO Content Pipeline) → `~/Yahia/CLAUDE.md`. Сам пайплайн и `GosMaxCatalog` остались на ПК.
> - Эталон-нарратив `D:/Yahia/active/research/2026-06/idea-build-specs-2026-06-23/…` в пакет не попал.
>
> Про диагностику `403 Permission denied`: по памяти `reference_yandex_search_api` это **пустой платёжный аккаунт**, а не отсутствие роли — пополнить и повторить.

Два режима на одном Wordstat API (`v2/wordstat/topRequests`), не путать:

| Режим | Скрипт | Задача | Output |
|---|---|---|---|
| **SEO-ядро** | `collect_semantics.py` (per-project) | собрать семантику ПЕРЕД контентом | `semantic_core.csv` |
| **Gate** | `scripts/wordstat_gate.py` (забандлен) | demand-валидация ниши → вердикт | stdout + опц. JSON |

---

## Gate-режим (demand-валидация ниши)

Проверяет, есть ли реальный поисковый спрос под нишу, ДО dev/MVP. Заменяет ручной подсчёт в screen-niche pipeline (это тот gate, что спас ~200ч на jobbee.ru). Скрипт **забандлен** в `scripts/wordstat_gate.py` — копировать в проект не нужно.

**Метод** (канон `wordstat-gate-max-per-seed`): на нишу — 4-6 buyer-intent seeds. Per seed объём = MAX count в раскрытии topRequests (избегает false-RED от склонений/порядка слов). Sort → top-3 → sum = `combined`. Вердикт по порогам:

| combined top-3 seeds | Вердикт |
|---|---|
| ≥ 5000/мес | **GO** |
| 2000–5000 | **MAYBE-PILOT** (7-дн paper-landing тест) |
| < 2000 | **RED/PIVOT** |

**Usage:**
```
# одна ниша (quick-check)
python ~/.claude/skills/wordstat-sweep/scripts/wordstat_gate.py \
  --name "Маркетплейсы: защита селлера" \
  --gate "обжалование штрафа wildberries,оспорить штраф озон,защита селлера маркетплейс"

# много ниш из файла (`# имя ниши` заголовок + seeds строками)
python .../wordstat_gate.py --gate-file niches.txt --json out.json

python .../wordstat_gate.py --selftest      # offline проверка порогов, без API/квоты
```

**Флаги:** `--exact` (консервативный объём: count точной фразы вместо MAX — метод scan.py, перепроверка сверху) · `--json PATH` (структурный дамп с thresholds) · `--no-cache` (обойти кэш) · `--name` (имя для `--gate`).

**⚠️ Три правила чтения вывода:**
1. **combined = верхняя граница** (broad-head inflation). GO ≠ решение — смотри `[top: ...]` фразу per seed: если объём набран одним broad info-термином без buyer-intent = **false-GO trap**. Прогони `--exact` для перепроверки.
2. **Вердикт — demand-валидация, не GO/PARK.** Финальное решение за пользователем (user-gate).
3. **`API-FAIL` ≠ RED.** Если seeds не ответили (403/quota) — скрипт печатает `API-FAIL`, а не ложный RED. Это отказ инфры, не мёртвая ниша.

**Слой narrative (пишет Claude поверх чисел):** после авто-вердикта — per-niche разбор с false-GO downgrade по top-фразе (эталон `D:/Yahia/active/research/2026-06/idea-build-specs-2026-06-23/_wordstat-gate/VERDICT-2026-06-24.md`). Эмодзи-легенда: 🟢 GO / 🟡 MAYBE / 🟠 PARK-LEAN / 🔴 PARK/RED.

**Wordstat ≠ полный вердикт (триангуляция).** Wordstat меряет только поисковый floor и слаб для B2B (там ищут через сарафан/тендеры/отраслевые чаты). После gate добавляй, особенно для B2B-ниш:
- **Яндекс.Директ**: крутят ли рекламу по seed → WTP-сигнал (кто-то платит за клики = деньги в нише). Сильнее Wordstat для B2B.
- **Каталоги/отзывы** (startpack.ru, отраслевые): есть решения с отзывами = validated demand + видна дырка.

**Диагностика:** `NO YANDEX CREDS` → положить `YANDEX_SEARCH_API_KEY` + `YANDEX_FOLDER_ID` в `<project>/.env.local`. `API-FAIL` + HTTP 403 `Permission denied` → ключ протух ИЛИ у сервисного аккаунта нет роли `search-api.executor` на этот folder (частая причина). Кэш живёт 30 дней в `<cwd>/.wordstat-cache/` (переопределить: `WORDSTAT_GATE_CACHE`).

---

## SEO-режим (семантическое ядро)

Сборка семантического ядра проекта через Yandex Wordstat API. Запускает `collect_semantics.py` с расширениями `--regions` (региональная affinity) + `--dynamics` (сезонность high-volume фраз). Output — `<project>/research/semantic_core.csv` с колонками phrase / volume / intent / cluster / longtail / target_page (+ опц. top_region / affinity_index / seasonality).

**Когда применять:**
- ПЕРЕД массовой генерацией SEO-страниц (см. SEO Content Pipeline в `D:/Yahia/CLAUDE.md`)
- Перед запуском `/research <topic>` — для калибровки запросов реальными объёмами
- Перед blog-постом / лендингом — выяснить какая формулировка тянет трафик

**НЕ применять:**
- Если нужен пост-деплойный аудит уже-залитых страниц → используй `/yageo-audit`
- Если уже есть свежее ядро (<14 дней) — переиспользуй CSV
- Не-RU рынок → Yandex Wordstat покрывает только русскоязычные запросы

## Usage

```
/wordstat-sweep <project-path>
/wordstat-sweep <project-path> --depth 2
/wordstat-sweep <project-path> --no-regions --no-dynamics
```

**Примеры:**
- `/wordstat-sweep D:/Yahia/active/GosMaxCatalog`
- `/wordstat-sweep D:/Yahia/active/EdTech --depth 2`

## Pricing note (verify перед запуском!)

Yandex Search API (включает Wordstat endpoints). ⚠️ **Тариф меняется — verify актуальный на cloud.yandex.ru/docs/search-api перед heavy-use, не полагайся на числа отсюда.**
- Yandex Cloud trial обычно даёт freemium-грант, покрывающий разовый прогон.
- **Gate-режим дёшев:** 4-6 API calls на нишу (по seeds), кэш на 30 дней → повторы бесплатны. Копейки за нишу.
- **SEO-режим** дороже: 30 seeds + regions + dynamics = ~150-300 API calls.
- Rate-limit Yandex ~100 req/час — скрипт с backoff `(6,18,35)s` на 429/timeout.

Если volume фразы <10K/мес — `dynamics` endpoint вернёт `low_volume` (квоту не тратит).

## Process

<example>
Триггер-фразы:
- "/wordstat-sweep D:/Yahia/active/EdTech"
- "собери семантическое ядро для GosMaxCatalog"
- "wordstat sweep — нужны объёмы запросов перед blog-постом"
</example>

### Step 1: Verify project + seeds

Спросить или проверить:
1. **Project root path** — например `D:/Yahia/active/GosMaxCatalog`
2. Существует ли `<project>/research/seed_keywords.txt` (10-30 фраз с опц. `# intent_hint`)?
   - Если **нет** → попросить создать вручную или предложить bootstrap из `D:/Yahia/active/GosMaxCatalog/research/seed_keywords.txt` как шаблона (формат: одна фраза на строку, опционально `# category_X` после `#`)
   - Если **есть** → прочитать первые 5 строк, показать юзеру для confirmation

### Step 2: Verify .env.local

Прочитать `<project>/.env.local`. Должны быть **обе** переменные:
- `YANDEX_SEARCH_API_KEY=...`
- `YANDEX_FOLDER_ID=...`

Если хоть одна отсутствует → STOP, сказать юзеру: «Положи в `<project>/.env.local`:
```
YANDEX_SEARCH_API_KEY=<key>
YANDEX_FOLDER_ID=<folder-id>
```
Получить ключ: console.cloud.yandex.ru → Сервисный аккаунт → Создать API-ключ для роли `search-api.executor`.»

### Step 3: Verify script availability

Проверить наличие `<project>/research/scripts/collect_semantics.py`.

Если **нет** — скопировать из эталона:
```bash
mkdir -p <project>/research/scripts
cp D:/Yahia/active/GosMaxCatalog/research/scripts/collect_semantics.py <project>/research/scripts/
```

### Step 4: Run sweep

```bash
cd <project> && python research/scripts/collect_semantics.py --regions --dynamics
```

Опции:
- `--depth 2` — расширить related-фразы рекурсивно (больше квоты, +30-50% объёма ядра)
- без `--regions` — пропустить enrichment по регионам (экономит ~30% квоты)
- без `--dynamics` — пропустить seasonality (экономит ~10% квоты)

Default — со всеми enrichments (≤15 ₽ за прогон в платном тарифе).

### Step 5: Verify output

Проверить `<project>/research/semantic_core.csv`:
- Открыть, прочитать первые 10 строк
- Подсчитать total rows
- Проверить распределение `intent` (T1/T2/T3/T4/T5) — должно быть mix, не моно-T3
- Long-tail % (6+ слов) — target ≥30% per Q6/Q9 research note в скрипте

### Output

Финальный отчёт юзеру:
```
[wordstat-sweep] DONE
- Project: <project>
- Seeds: <N> phrases
- Core size: <M> rows in research/semantic_core.csv
- Long-tail share: <X>% (target ≥30%)
- Top-3 clusters: cluster_1 (N1 phrases) / cluster_2 / cluster_3
- Top-3 by volume:
  <vol1> — <phrase1>
  <vol2> — <phrase2>
  <vol3> — <phrase3>
- Cost: ~<P> ₽ (estimated)

Next: feed CSV в `generate_bot_content.py` (см. SEO Content Pipeline) или в `<project>/research/<topic>_brief.md` Phase-1 calibration.
```

## Architecture reference

Канонический эталон-imp: `D:/Yahia/active/GosMaxCatalog/` Phase A (semantic core 535 фраз → 535 SEO-страниц через GigaChat). Полная методика — секция «SEO Content Pipeline» в `D:/Yahia/CLAUDE.md`.

Скрипт portable: использует `Path(__file__).parent.parent` для project-root, работает в любом проекте с `<project>/.env.local` + `<project>/research/seed_keywords.txt`.

## Не путать с /yageo-audit

| | `/wordstat-sweep` | `/yageo-audit` |
|---|---|---|
| **Когда** | ДО написания контента | ПОСЛЕ деплоя сайта |
| **Что меряет** | Объёмы запросов в Яндексе | ЭПОС-score уже-опубликованных страниц |
| **Output** | `semantic_core.csv` | per-page score 0-100 |
| **API** | Yandex Search API (Wordstat) | YaGEO local scoring |
| **Стоит** | ~5-15 ₽/прогон | бесплатно (локальное скорирование) |
