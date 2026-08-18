# YaGEO— handoff prompt для новой Claude Code сессии

> **Инструкция**: открой новый Claude Code в папке `D:/Yahia/active/YaGEO/`, скопируй этот файл целиком в prompt. Claude увидит полный контекст и сможет продолжить build.

---

## Контекст проекта

Я работаю над **YaGEO** — open-source Claude Code skill для оптимизации сайтов под **Яндекс.Поиск** и **Alice AI** (генеративные ответы). заточенный под критерии **ЭПОС** (Экспертность, Полезность, Оригинальность, Содержательность) и официальный Яндекс.Вебмастер-инструмент «Видимость сайта в Алисе AI» (запущен 7 апреля 2026).

Первый dogfood-пилот будет на `gosmax.ru` (каталог 413 ботов MAX-мессенджера, принадлежит мне).

---

## Что уже сделано (research phase, 3 sweep'а)

Все артефакты research лежат в `D:/Yahia/active/YaGEO/research/`. **Прочитай их по порядку перед началом:**

1. `yandex_geo_seo_brief.md` — Phase 0+1 брифф первого sweep (стратегический вопрос: ставить или пропускать Alice AI GEO для gosmax.ru)
2. `yandex_geo_seo.md` — Phase 5 synthesis первого sweep (вердикт: **BUILD**)
3. `expand_brief.md` + `expand_synthesis.md` — второй sweep (competitors + pip ecosystem + Ashmanov чеклист)
4. `verification_pass.md` — audit 43 claim'ов (что факт, что forecast)
5. `expand2_brief.md` + `expand2_synthesis.md` — третий sweep (NLP stack + YandexGPT pricing + SaaS traffic + Gitverse реальность)

Ресёрч делался через **Brave Search API** (обязательно, не WebSearch). Скрипт в `research/scripts/brave_sweep.py`, ключ в `.env.local`. Raw data в `research/_raw_data/`.

---

## Ключевые факты (уже верифицированы)

### Критерии ЭПОС (Яндекс, публичные)
- **Э** Экспертность — квалифицированные авторы, кейсы, цифры, ссылки на исследования, credentials в Person schema
- **П** Полезность — UX aудит, mobile OK, отсутствие навязчивых баннеров, решение задачи юзера
- **О** Оригинальность — «ценностная уникальность»: свои кейсы/факты компании, не rewording
- **С** Содержательность — семантическая плотность, полное покрытие темы, структурированность, H2-H4, списки

### Alice AI mechanics
- 46.5M человек/мес видят ответы Alice
- 14M+ сайтов-источников в индексе
- Alice делает несколько запросов в Поиск → отбирает top → ИИ-блендер комбинирует 40+ блоков за 50 мс
- Alice AI LLM (hundreds of billions params) + Alice AI Search (lightweight)

### Webmaster API для Alice — НЕТ
Официальный ответ Яндекса «рассматриваем». Скилл работает **без** API, только на content-analysis.

### SaaS-конкуренты (все закрытые/платные)
- **ai.pixeltools.ru** (Pixel Plus self-serve): 1149-22990 ₽/мес + 99 ₽ trial. Трекает ChatGPT/Алиса/Gemini/DeepSeek/Claude. API есть. Клиенты на лого: Касперский, Samsung, Яндекс, Skyeng.
- **Rush Analytics** (rush-analytics.ru): **140.1K visits/мес** (Semrush Oct 2025, RU #21304). Трекает AI-упоминания. 7 дней free trial. API есть (endpoints не публикуют).
- **LLM Spot** (Digital Geeks): внутренняя платформа, НЕ публичная (sweep q09 = 0 web results).

Открытых source-аналогов **нет** — GitHub + Gitverse проверены тройным sweep'ом.

### Ashmanov чек-лист (публичный, наш blueprint)
URL: https://www.ashmanov.com/education/articles/geo-prodvizhenie-kak-popast-v-otvety-ii-a-ne-tolko-v-vydachu/
29 пунктов + 5 Yandex GPT-specific. Полный текст в `expand_synthesis.md`.

---

## Technical stack (verified)

### RU NLP (core ЭПОС engine)
```
natasha              # all-in-one: razdel + slovnet NER + navec + pymorphy
# Slovnet NER: 27 MB, 25 articles/sec CPU, 1-2% ниже BERT SOTA
pymorphy3            # морфология
sentence-transformers + cointegrated/rubert-tiny2  # semantic similarity
textstat             # readability (Flesch supports RU)
trafilatura          # HTML → чистый main content
ultimate-sitemap-parser
```

### Yandex APIs
```
yandex-webmaster-api (bzdvdn, MIT, v0.0.3) — classic Webmaster, 30+ endpoints, НЕТ Alice
yandex-cloud-ml-sdk — для v0.2 LLM-assisted scoring
yametrikapy — для v0.2 Metrika integration
```

### Reports
```
reportlab            # PDF
jinja2               # markdown templating
```

### YandexGPT pricing (для v0.2)
- 5 Lite/Preview: $2/1M tokens, 32K context
- 5.1 Pro: $4/1M tokens (было $12, упало 3× в 2025)
- Async mode: -50%
- Free: 10 req/hour (dev)
- Full gosmax.ru scoring (381 стр): ~$1.5-3

---

## Архитектура (следовать YaGEOкак скелет)

```
YaGEO/
├── README.md (RU primary, EN — skip)
├── LICENSE (MIT)
├── pyproject.toml          # dependencies выше
├── install.sh / install-win.sh
├── yageo/
│   └── SKILL.md            # главный оркестратор, routing команд
├── skills/
│   ├── yageo-audit/        # композитный аудит (parallel через agents)
│   ├── yageo-epos-score/   # ⚡ КРИТИЧНЫЙ — scoring Э/П/О/С
│   ├── yageo-crawlers/     # YandexBot + YandexAdditionalBot + sitemap
│   ├── yageo-schema/       # JSON-LD validator + generator (6 types)
│   ├── yageo-webmaster-readiness/
│   ├── yageo-content-depth/
│   ├── yageo-author-eeat/
│   ├── yageo-report/       # markdown
│   └── yageo-report-pdf/   # ReportLab PDF
├── agents/                 # 4 parallel subagents для /yageo audit
│   ├── yageo-ai-visibility.md
│   ├── yageo-content.md
│   ├── yageo-technical.md
│   └── yageo-strategy.md
├── schema/                 # JSON-LD RU-friendly шаблоны
│   ├── ru-organization.json    # sameAs: VK, OK, Telegram, Dzen, RuTube
│   ├── ru-article-author.json
│   ├── ru-faqpage.json
│   ├── ru-local-business.json
│   └── ru-software-app.json
├── scripts/
│   ├── epos_scorer.py      # core — Natasha heuristics
│   ├── yandex_crawler_check.py
│   ├── json_ld_validator.py
│   └── generate_yageo_pdf.py
└── docs/
    ├── epos-methodology.md # transparent scoring logic
    ├── ru-schema-guide.md
    └── dogfood-case-gosmax.md # результаты pilot на gosmax.ru
```

---

## Commands MVP v1 (7 штук)

```
/yageo audit <url>         — полный аудит (epos + crawlers + schema + content)
/yageo epos <url>          — focused ЭПОС scoring 4 критериев
/yageo crawlers <url>      — YandexBot + YandexAdditionalBot + robots/sitemap
/yageo schema <url>        — JSON-LD валидация + генерация недостающих
/yageo webmaster <url>     — yandex-webmaster-api интеграция (нужен OAuth)
/yageo report <url>        — PDF + markdown отчёт на русском
/yageo help                — справка
```

**Пример output `/yageo epos`:**
```
YaGEO— ЭПОС scorer
Target: https://gosmax.ru/catalog/alfa-bank/

Э Экспертность:      62 / 100   ⚠ Автор не указан в JSON-LD Person schema
П Полезность:        78 / 100   ✓ UX прошёл, mobile OK, 0 intrusive popups
О Оригинальность:    45 / 100   ✗ 70% описания идентично max-app.ru
С Содержательность:  71 / 100   ⚠ 180 слов — ниже рекомендуемых 300-500

Overall: 64 / 100 — MEDIUM citability
Quick wins:
  1. Добавить Author schema с credentials (+15 pts)
  2. Переписать описание своими словами (+20 pts на О)
  3. Расширить body до 400 слов с кейсами (+10 pts на С)
```

---

## Build timeline MVP v1 (5 дней)

- **Day 1**: pyproject.toml + install scripts. **Core `epos_scorer.py`** на Natasha heuristics (Э через NER entity count + числовые факты, П через technical SEO + UX флаги, О через sentence-transformer similarity vs топ источники, С через textstat + sentence count + структура H2-H4). Unit tests на 5 страницах gosmax.ru.
- **Day 2**: `yageo-content-depth` + `yageo-crawlers`. YandexBot check, sitemap валидация через ultimate-sitemap-parser.
- **Day 3**: `yageo-schema` — 5 JSON-LD шаблонов + validator + generator недостающих типов.
- **Day 4**: `yageo-audit` composite + 4 agents в parallel. Markdown report через Jinja2.
- **Day 5**: PDF через ReportLab. Dogfood run на gosmax.ru (все 381 страниц batch). Commit + push на GitHub + Gitverse.

## Publication strategy

- **GitHub** primary (`<user>/YaGEO`) — RU README
- **Gitverse mirror** — RU community (patriotic angle + на случай если Яндекс начнёт индексить git-репо)
- **EN README skipped** — таргет-аудитория 100% RU
- **Habr статья** через 2-3 недели после пилота с before/after метриками gosmax.ru — главный PR-триггер
- **vc.ru + SEOnews** — дубль статьи
- **Telegram** (SEO Tips, Бурый медведь SEO) — announcement
- **TheYahia umbrella** — НЕ использовать, skill должен стоять отдельно для stars/forks

Star forecast (откалибровано): **0.28 прb 50+ stars за 3 мес** — Gitverse discovery слабый, надо активно PR-ить.

---

## Gosmax.ru pilot workflow

Gosmax.ru — готовый каталог 381 бота с `launch_link` + 32 linkless (скрыты из листингов). Структура:
- `app/src/content/bots/*.md` — 413 md файлов, frontmatter: name/short_description/categories/tags/launch_link/max_handle/added/source_url
- Astro SSG, build production-ready
- Верифицирован в Yandex Webmaster + Google Search Console (domain verification через `598461d seo: add Yandex and Google site verification`)

**План pilot'а:**
1. `/yageo audit https://gosmax.ru/catalog/alisa-ai/` — baseline на 1 странице
2. Расширить до 381 страниц batch
3. Применить top-10 recommendation'ов (author schema, расширение body, добавление FAQPage)
4. Через 2-3 недели: собрать метрики Webmaster «Видимость сайта в Алисе AI» (путь: Вебмастер → Эффективность → Видимость сайта в Алисе AI)
5. Статья: «Open-source Claude Code skill для Яндекс.Алисы AI — первые результаты на каталоге из 400 ботов»

---

## Что делать прямо сейчас

1. **Прочитай research-файлы** (порядок выше) — 20-30 мин чтения, но критично для контекста
2. **Инициализируй репо**: `git init`, создай pyproject.toml с dependencies выше, install scripts
3. **Напиши `scripts/epos_scorer.py`** как первый артефакт — ядро скилла
4. **Напиши SKILL.md для /yageo epos** — чтобы можно было сразу протестить на gosmax.ru странице
5. **Unit test**: прогон на `https://gosmax.ru/catalog/alisa-ai/` — должен вернуть scoring 4 критериев

---

## Risks / что перепроверить

1. **Natasha + Python 3.12** — проверить совместимость (natasha зависит от dawg2-python который может конфликтовать). Если ломается — fallback на Python 3.11.
2. **trafilatura на русском тексте** — проверить что кириллица не ломает extractor. Если нужно, добавить fallback на BeautifulSoup для main content extraction.
3. **Яндекс обновит ЭПОС / алгоритм Alice AI** — скилл параметризуется через YAML config, обновления = config bump.
4. **TWO SaaS конкурента** (ai.pixeltools.ru, Rush Analytics) — НЕ конкурируем напрямую, но следить за их API — если откроют дешёвый endpoint для Alice метрик, пересмотреть интеграцию.

---

## Следующие сессии / открытые research-фронты

Если нужно больше данных — запусти новый research через `research/scripts/brave_sweep.py` в папке YaGEO. Открытые вопросы:
- Yandex Metrika API — Alice source attribution endpoints
- Turbo pages / AMP — нужно ли support'ить в schema generator
- LocalBusiness + Яндекс.Карты sameAs best practices
- Benchmark dataset: 20-30 RU страниц как «золотой стандарт» для scorer'а

---

## Глобальные правила (`D:/Yahia/CLAUDE.md`)

Прочитай также `D:/Yahia/CLAUDE.md` — там правила по:
- Research через Brave (не WebSearch)
- Auto-memory в `~/.claude/projects/<project-slug>/memory/`
- Deep Research Triptych templates
- Стиль коммитов, testing, etc.

---

## Статус при handoff

- ✅ Research phase завершён (3 sweep'а, 35 queries, 43 claim'а verified)
- ✅ Build plan v2 финализирован
- ✅ Pip ecosystem + NLP stack выбраны
- ✅ YandexGPT pricing верифицирован
- 🟡 Build phase — **начать с Day 1**
- 🟡 Dogfood pilot — **после Day 5**
- 🟡 Публикация — **после pilot'а + before/after метрик**

Go! 🚀
