---
title: "YaGEOexpand2 synthesis — NLP stack + YandexGPT + SaaS data + hidden tools"
type: heavy-compressed synthesis
status: phase-5-round-2
created: 2026-04-24
parent: expand2_brief.md
---

# TL;DR

1. **NLP stack для ЭПОС**: **Natasha** (Razdel + Slovnet + Navec + Pymorphy) — production-ready, 27 MB, 25 статей/сек на CPU, NER 1-2% ниже DeepPavlov BERT SOTA но 60× меньше. Для semantic similarity — `cointegrated/rubert-tiny2` (HF, small Russian BERT). Readability — `textstat` (поддерживает RU).
2. **YandexGPT pricing (верифицировано)**: 5 Lite/Preview $2/1M tokens, 5.1 Pro $4/1M (с $12 упало в 3×). Async mode −50%. Free 10 rph для test. Стоимость LLM-assisted scoring gosmax.ru всех 381 страниц ≈ $2-3. SDK: `yandex-cloud-ml-sdk` (YCloudML) или lightweight `yandexgpt-python` (allseeteam).
3. **SaaS competitor traffic**: **Rush Analytics = 140.1K visits/мес** (Semrush Oct 2025, RU rank #21304, Advertising/Marketing). Реальный игрок. **ai.pixeltools.ru** — не индексируется в Semrush, нишевый. Confirms рынок разогрет, но SaaS сегмент не переполнен.
4. **Gitverse reality check**: **НЕТ публичного star-ranking / trending**. Discovery only через прямой URL и поиск Яндекс. Следовательно, star-forecast надо **снизить** до 20-30 реалистично (Habr-статья нужна как основной driver).
5. **Hidden competitors clarified**:
   - **LLM Spot** → retract «proprietary public platform» → **«internal Digital Geeks tool, zero public trace» (q09 = 0 results)**
   - **Envybox + Ковалевы «открытое GEO»** → **это публичный эксперимент-кейс, НЕ tool**. Фокус на ChatGPT/Perplexity/Gemini, НЕ Alice AI. Не конкурент skill'у.
   - **GitHub поиск «алиса SEO audit skill»** = **0 hits**, только Alice Skills (for voice dialogs, not SEO). **Ниша подтверждена свободной.**

---

# Updated positioning

YaGEO= единственный open-source GEO skill специально под Alice AI + русский язык + ЭПОС scoring. Конкуренты:
- 2 SaaS (ai.pixeltools.ru, Rush Analytics) — **работают, имеют traffic, но закрытые и платные**
- 1 внутренний tool (LLM Spot) — **не публичный**
- 1 эксперимент (Envybox + Ковалевы) — **кейс, не tool**
- GitHub/Gitverse — **ноль open-source alternative**

Позиция скилла: **единственный open-source / free / Claude Code-native** под RU+Алису.

---

# NLP stack finalized (core ЭПОС engine)

| Компонент | Пакет | Size | Назначение |
|-----------|-------|------|------------|
| Tokenizer + сентенсизация | `natasha`/`razdel` | <1 MB | Разделение текста для анализа |
| Morphology | `pymorphy3` (активно поддерживается) или `natasha`/`pymorphy` | ~10 MB | Лемматизация, нормальные формы |
| NER (Организации, Персоны, Локации) | `natasha` (Slovnet BERT NER) | 27 MB | Вычисление «экспертность» через upcount цитирований + именованных сущностей |
| Sentence embeddings | `sentence-transformers` + `cointegrated/rubert-tiny2` | ~150 MB (model) | Semantic similarity — проверка уникальности vs top источников; Prompt coverage |
| Navec word embeddings | `navec` (часть Natasha) | ~50 MB | Alternative lightweight embeddings |
| Readability | `textstat` | <1 MB | Flesch-Kincaid RU, sentence length, syllable counts |
| HTML content extraction | `trafilatura` | ~10 MB | Извлекать main content без nav/footer — чистый текст для scoring |
| Sitemap parsing | `ultimate-sitemap-parser` | <1 MB | Для `/yageo crawlers` |
| PDF generation | `reportlab` | ~10 MB | `/yageo report` output |

**Общий disk footprint**: ~250 MB для full install (acceptable для CLI skill). Runtime CPU-only, без GPU — работает на любом dev-машине.

**Запуск scoring на странице (пример):**
```python
from natasha import Segmenter, MorphVocab, NewsEmbedding, NewsNERTagger, Doc
from trafilatura import fetch_url, extract
from sentence_transformers import SentenceTransformer

segmenter = Segmenter()
ner = NewsNERTagger(NewsEmbedding())
morph = MorphVocab()
encoder = SentenceTransformer('cointegrated/rubert-tiny2')

html = fetch_url(url)
text = extract(html, include_tables=False)
doc = Doc(text)
doc.segment(segmenter)
doc.tag_ner(ner)
entities = [span.text for span in doc.spans]  # для Экспертность score
embeddings = encoder.encode(doc.sents)        # для Оригинальность / Содержательность
```

---

# YandexGPT integration (v0.2 LLM-assisted scoring)

**Pricing verified (2026-04-24):**

| Модель | Context | Цена in / out | Best for |
|--------|---------|---------------|----------|
| YandexGPT 5 Lite | 32K | $2/1M tokens (оба) | Volume scoring, classification |
| YandexGPT 5 Preview | 32K | $2/1M tokens | Experimentation, RC features |
| YandexGPT 5.1 Pro | 32K (до 128K у некоторых sources) | $4/1M tokens | High-quality ЭПОС judgment |
| Async mode любой | — | **−50% discount** | Batch analysis overnight |

**Free tier**: 10 req/hour YandexGPT Lite+Pro (для dev/testing). Юрлицам: 50K токенов/год.

**Стоимость scoring всего gosmax.ru:**
- 381 страницы × ~1500 токенов input + 500 output ≈ 762K tokens
- YandexGPT Lite: ≈ $1.5 (или $0.75 в async)
- Доступно через `yandex-cloud-ml-sdk`:
```python
from yandex_cloud_ml_sdk import YCloudML
sdk = YCloudML(folder_id="...", auth="<api-key>")
result = sdk.models.completions('yandexgpt-lite').configure(temperature=0.3).run([
    {"role": "system", "text": "Оцени страницу по критерию 'Экспертность' 0-100..."},
    {"role": "user", "text": page_text}
])
```

**LLM-assisted scoring — опционально в v0.2**. MVP v0.1 использует только heuristic scoring на Natasha — работает offline, бесплатно. YandexGPT добавляем как «extra precision mode» с флагом `--llm-boost`.

---

# SaaS traffic (calibration update)

**Rush Analytics (rush-analytics.ru):**
- 140.1K visits/мес (Semrush Oct 2025)
- RU rank #21304
- Category: Advertising and Marketing > Online Services
- **Interpretation**: серьёзный SaaS-игрок, но не mass-market. Наш skill не конкурирует — разные user personas (SaaS-клиенты = агентства/маркетологи; skill users = devs/content creators).

**ai.pixeltools.ru:**
- Не индексируется Semrush в нашем sweep → либо <10K/мес, либо недавно запущен
- Client logos: Касперский, Samsung, Яндекс, Skyeng (partners/case studies, не обязательно активные paying)
- **Interpretation**: нишевый / young SaaS. Меньший threat.

---

# Gitverse reality (star-forecast update)

**Обнаружено:**
- НЕТ публичного trending page на gitverse.ru
- НЕТ общего repo discovery (как github.com/trending)
- YouTube: «Убийца GitHub? GitVerse» — community интерес ЕСТЬ
- Официальное позиционирование (Leino case study): «Russian alternative to GitLab and GitHub, meeting local regulatory requirements»
- API mirror'ит GitHub (routes совместимы)

**Implications для star-forecast:**
- Discovery на Gitverse в основном **пассивная** (direct URL, Яндекс-поиск). Stars редки спонтанно.
- Активная раскрутка через Habr + Telegram-каналы = must-have.
- **Пересмотр estimate: ≥50 stars за 3 мес → 0.25** (было 0.45, теперь ниже из-за discovery gap).
- **Компенсация — GitHub primary**: на GitHub discovery работает естественно через Topics (`russian-seo`, `claude-code-skill`, `generative-engine-optimization`). Большая часть stars придёт оттуда.

---

# Hidden competitors — updated

| Tool | Статус | Threat level |
|------|--------|--------------|
| LLM Spot by Digital Geeks | Internal / non-public (q09 = 0 web results) | Не threat |
| Envybox + Ковалевы «открытое GEO» | **Публичный эксперимент-кейс**, фокус на ChatGPT/Perplexity/Gemini (НЕ Alice) | Не конкурент skill'у |
| GitHub/Gitverse open-source | **Ноль релевантных репо** (проверено q12) | Ниша чистая |
| `awesome-alice` (sameoldmadness GH) | **Yandex.Диалоги skills dev** (voice assistants), НЕ SEO | Разная сфера |

---

# Обновлённые зависимости (для pyproject.toml)

```toml
[project]
name = "yageo"
version = "0.1.0"
requires-python = ">=3.9"
dependencies = [
    # Core HTML + content
    "requests>=2.28",
    "beautifulsoup4>=4.12",
    "trafilatura>=1.6",

    # RU NLP (Natasha stack)
    "natasha>=1.6",          # orchestrator
    "razdel>=0.5",           # tokenizer (included in natasha)
    "slovnet>=0.6",          # NER (included in natasha)
    "pymorphy3>=2.0",        # morphology (active fork of pymorphy2)
    "sentence-transformers>=2.2",  # для cointegrated/rubert-tiny2

    # Sitemap + robots
    "ultimate-sitemap-parser>=1.8",

    # Yandex APIs
    "yandex-webmaster-api>=0.0.3",   # classic Webmaster
    "yandex-cloud-ml-sdk>=0.5",      # YandexGPT (для v0.2)
    # yametrikapy — только для v0.2 (Metrika integration)

    # Readability
    "textstat>=0.7",

    # Reports
    "reportlab>=4.0",        # PDF
    "jinja2>=3.1",           # markdown templating

    # Utilities
    "typer>=0.9",            # CLI routing (если делаем standalone CLI)
    "rich>=13.0",            # pretty console output
]

[project.optional-dependencies]
dev = ["pytest", "ruff", "mypy"]
llm = ["yandex-cloud-ml-sdk"]  # v0.2 LLM boost
```

---

# Commands list — final v1

| Команда | MVP v1 | Purpose |
|---------|--------|---------|
| `/yageo audit <url>` | ✓ | Полный аудит (epos + crawlers + schema + content) |
| `/yageo epos <url>` | ✓ | Focused ЭПОС scoring, только 4 критерия |
| `/yageo crawlers <url>` | ✓ | YandexBot/YandexAdditionalBot + sitemap + robots |
| `/yageo schema <url>` | ✓ | JSON-LD validate + generate missing |
| `/yageo report <url>` | ✓ | PDF + markdown report |
| `/yageo help` | ✓ | Команды справка |
| `/yageo webmaster <url>` | ✓ (если OAuth настроен) | Интеграция yandex-webmaster-api: sitemap status, indexing |

**v0.2 (через 2-4 недели):**
- `/yageo epos --llm-boost` — YandexGPT-assisted scoring
- `/yageo content <url>` — deep content analysis отдельно
- `/yageo prompt-coverage <url>` — проверка coverage по 50+ LLM-generated prompts
- `/yageo metrika` — yametrikapy интеграция для source-attribution
- `/yageo watch <url>` — cron monitor + Telegram alerts

---

# Publication strategy — refined

**Confirmed**: RU-README primary, EN **skip** (таргет-аудитория 100% RU; буржуи Яндекс не используют).

**Публикация каденс (обновлённая):**

| Неделя | Action |
|--------|--------|
| W1-2 (build) | Repo приватный на GitHub + Gitverse; MVP 5 дней |
| W3 (dogfood) | Применение на gosmax.ru; сбор baseline в Webmaster Alice AI |
| W4 (soft launch) | Public release v0.1 на GitHub + Gitverse mirror; announcement 1-2 Telegram каналах (SEO Tips, Бурый медведь SEO) |
| W5-6 (hard PR) | Статья на Habr с кейсом gosmax.ru before/after; дубль на vc.ru и SEOnews; напрямую в Сливинский (Yandex amb.) |

**Ключевой рычаг**: пост на Habr на 4-6 неделе — главный engine stars (ожидание: 30-80 stars в 1 день через UPVOTE трафик).

---

# Final calibration (Phase 7)

| Prior → Posterior (after всех 3 sweep'ов) | Value |
|-------------------------------------------|-------|
| P(open-source tool competitor exists) | 0.02 (стабильно) |
| P(RU NLP стек готов под production) | 0.98 (Natasha verified) |
| P(YandexGPT LLM-scoring feasible ≤$5 на весь gosmax.ru) | 0.95 |
| P(Webmaster API for Alice released <3 мес) | 0.15 |
| P(Gitverse+GitHub ≥50 stars за 3 мес) | **0.28** (снижено с 0.45 — Gitverse discovery слабее ожидаемого) |
| P(Habr статья >5K просмотров) | 0.70 (стабильно) |
| P(MVP 5 дней реально) | 0.90 (Natasha + зависимости готовы → меньше боли писать с нуля) |
| P(Envybox open GEO эксперимент обгонит нас до публикации) | 0.10 (разный фокус — они на ChatGPT/Perplexity) |

**Самая большая переоценка этой итерации**: Gitverse star-potential — меньше, чем думал. Но это не меняет BUILD вердикт, просто подстраивает expectations.

---

# Что сделано / артефакты

- `research/expand2_brief.md` — Phase 0+1 брифф 2-го расширения
- `research/expand2_synthesis.md` — этот файл
- `research/_raw_data/yageo_expand2_2026-04-24/parsed_snippets.md` — 12 queries raw
- `research/verification_pass.md` — 43-claim audit (из предыдущей итерации)

# Что осталось открытым / для будущих research-сессий

- **Yandex Metrika API Alice source attribution** — конкретные endpoints не проверил, отложил до v0.2
- **Turbo pages / AMP alternative Yandex** — современное состояние, нужно ли отдельное support в schema generator
- **Local Business / Yandex Карты integration** — sameAs best practices для гео-бизнесов (если делаем LocalBusiness schema)
- **Benchmark dataset**: какие 20-30 RU страниц использовать как «золотой стандарт» для тестирования ЭПОС scorer'а
