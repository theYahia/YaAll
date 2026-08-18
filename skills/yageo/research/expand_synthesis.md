---
title: "YaGEOexpand synthesis — competitor landscape + pip ecosystem + build plan v2"
type: heavy-compressed synthesis
status: phase-5
created: 2026-04-24
parent: expand_brief.md
sibling: yandex_geo_seo.md
---

# TL;DR (пересмотрено после expand-сессии)

1. **Вердикт BUILD сохраняется**, но позиционирование уточнено: мы НЕ первый tool для Alice AI GEO. Существуют **2 SaaS-конкурента**: `ai.pixeltools.ru` (Pixel Plus self-serve, 1.1K-22.9K ₽/мес) и **Rush Analytics AI Трекер** (SaaS, API). Плюс проприетарная **LLM Spot** от Digital Geeks (нет публичной цены).
2. Наш skill занимает **уникальный сегмент**: open-source + Claude Code-native + dev-first + free + transparent scoring. Никто не закрывает этот угол — все SaaS закрытые, платные, агентские.
3. **Ashmanov чек-лист попадания в ответы ИИ** — готовый публичный чеклист (~30 пунктов). Это наш blueprint для sub-skills. Каждый пункт → score function или auto-generator.
4. **pip-ecosystem богатый**: yandex-webmaster-api, yametrikapy, ultimate-sitemap-parser, yandex-cloud-ml-sdk. Для build'а не надо писать с нуля HTTP-клиенты.
5. **Webmaster API для Alice — подтверждено отсутствует.** Zero endpoints в официальной doc; GitHub `yandex/webmaster.api` репо мёртвое, редиректит на dev.yandex.ru. Наш skill работает **без API-зависимости** от Yandex-side, только на content-analysis.
6. **Публикация — dual strategy**: GitHub primary (основная stars масса) + Gitverse mirror (RU комьюнити). Habr + vc.ru статья после 2-3 недель пилота на gosmax.ru. Свой репо `TheYahia/YaGEO` — ок как умный alias под твой бренд.

---

# Обновлённая карта конкурентов

## SaaS-tools (прямые конкуренты skill'а)

| Tool | Формат | Цена | Alice AI? | API? | ЭПОС? | Open-source? |
|------|--------|------|-----------|------|-------|--------------|
| **ai.pixeltools.ru** (Pixel Plus self-serve) | SaaS | 1149-22990 ₽/мес + tier 99 ₽ trial | ✅ + ChatGPT/Gemini/DeepSeek/Claude | ✅ документирован | Неявно | ❌ |
| **Rush Analytics AI Трекер** | SaaS | 7 дней free + paid (не раскрыто) | ✅ Алиса + ChatGPT | ✅ общий | ❌ | ❌ |
| **LLM Spot (Digital Geeks)** | Internal/агентская платформа | Агентский price | Неясно | Неизвестно | ❌ | ❌ |
| **YaGEO(мы)** | Claude Code skill | **Free** | ✅ под Алису заточен | По документации Яндекса когда выйдет | ✅ нативный scoring | ✅ MIT |

## Агентства-услуги (conversion funnel после использования скилла)

| Агентство | USP | Цена | Методология |
|-----------|-----|------|-------------|
| Pixel Plus | AI SEO под ключ, 70% пользователей уже в AI-поиске | 79.5K ₽ минимум (Оборот) / 100-500K (комплекс) | ЭПОС + до 300 промптов |
| Rush Agency | GEO + SEO + SGE integration | от 100K ₽ | Bi-weekly отчёты, кейсы |
| Ашманов | Методические статьи + агентские услуги | Не раскрыто | ЭПОС чек-лист (public) |
| РА Ковалевы | AEO/LLMEO/AIO, enterprise | Не раскрыто | 600+ проектов с 2007 |
| Head Promo | GEAR framework, e-com/retail | Не раскрыто | GEAR: analysis→impl→measure→opt |
| Dojo Media | Low-code automation | Не раскрыто | Automated semantic + AI content pipelines |
| Envybox + Ковалевы | "Open GEO promotion" (анонс апрель 2026) | Не раскрыто | В разработке — следить |

**Ниша skill'а**: разрабу удобнее вставить `/yageo audit` в Claude Code CLI, чем платить 79K-22K ₽/мес за dashboard. Для агентств — наоборот: им нужен dashboard и клиентский UI. Мы не конкурируем напрямую, мы для другого юзера.

---

# pip/npm ecosystem inventory

Что можем использовать как зависимость, чтобы не писать с нуля:

| Пакет | Назначение | Сфера использования в YaGEO|
|-------|------------|---------------------------|
| `yandex-webmaster-api` (pypi, bzdvdn, MIT) | Classic Webmaster API (sitemap, search queries, indexing stats) | `yageo-webmaster-readiness` sub-skill |
| `yametrikapy` (github.com/pikhovkin) | Yandex.Metrika Reports API wrapper | `yageo-traffic-source` (track Alice referral traffic) — v0.2 |
| `yandex-cloud-ml-sdk` / `yandex-ai-studio-sdk` | YandexGPT + Yandex Search API | Опционально для LLM-assisted ЭПОС scoring (пусть YandexGPT сам оценивает страницу) |
| `yandex_gpt` / `yandex-chain` (pypi) | YandexGPT Python clients | Альтернатива cloud-ml-sdk, проще |
| `ultimate-sitemap-parser` (pypi) | Sitemap parsing + crawling | `yageo-crawlers` для валидации sitemap.xml |
| `sitemap_grabber` (pypi) | Sitemap + robots.txt + well-known files | Альтернатива ultimate-sitemap |
| `yandex-geocoder` (pypi) | Yandex Geocoder API | `yageo-schema` для auto-populate адреса в LocalBusiness schema |
| `reportlab` (pypi) — как у YaGEO| PDF report generation | `yageo-report-pdf` |
| `beautifulsoup4` + `requests` | HTML parsing + HTTP | Core — парсинг страниц под scoring |
| `trafilatura` (pypi) | Extract main content from HTML (избавляемся от navbar/footer) | `yageo-epos-score` для чистого content анализа |
| `@langchain/yandex` (npm) | LangChain.js YandexGPT | На случай Node.js версии skill'а — не приоритет |

**Вывод**: все критичные блоки покрыты существующими пакетами. MVP может не писать ни одного HTTP-клиента — только склейка + ЭПОС scoring logic.

---

# Ashmanov чек-лист → sub-skill mapping

Полный чеклист с Ashmanov "GEO-продвижение: как попасть в ответы ИИ" раскладывается по sub-skills нашего скилла:

| Ashmanov пункт | → YaGEOsub-skill | Implementation hint |
|---------------|-------------------|---------------------|
| Нет критических ошибок, страницы в индексе | `yageo-webmaster-readiness` | yandex-webmaster-api get diagnostic_site() |
| Mobile version, HTTPS, URL-friendly | `yageo-technical` | Parsed HTML + User-Agent switch |
| robots.txt, sitemap.xml корректны | `yageo-crawlers` | ultimate-sitemap-parser + own robots check |
| Core Web Vitals в green | `yageo-technical` | PageSpeed Insights API или Lighthouse CLI |
| Уникальный контент, E-E-A-T | `yageo-epos-score` | ЭПОС scoring 0-100 per page |
| Credentials автора | `yageo-author-eeat` | Check `<script type="application/ld+json">` for Person schema |
| Поведенческие метрики | `yageo-metrika-integrate` (v0.2) | yametrikapy + визуализация в отчёте |
| Качественные backlinks | (out of scope — не измеряем для v1) | — |
| Schema.org микроразметка + NER | `yageo-schema` | JSON-LD validator + generator RU-friendly |
| Hub-and-spoke cluster | `yageo-site-structure` | Graph analysis внутренних ссылок |
| Title с основным запросом | `yageo-onpage` | HTML parse + keyword match |
| Ответ в первых 1-2 абзацах | `yageo-content-depth` | trafilatura + paragraph scoring |
| H2-H4, списки, таблицы | `yageo-content-structure` | HTML parse + structural score |
| FAQPage schema | `yageo-schema` | Detect + generate FAQ microdata |
| Даты обновлений | `yageo-freshness` | Parse `dateModified` in JSON-LD |
| "Crocodile effect" prevention | `yageo-uniqueness-check` | Heuristic: наличие калькуляторов/интерактивов |

+ Yandex GPT-специфичные факторы (5 items):
- Экспертный контент (кейсы, цифры, исследования) → `yageo-epos-score`
- Чёткая структура H2-H4 → `yageo-content-structure`
- Одна мысль на абзац → `yageo-content-structure`  
- Wiki-интонация → `yageo-content-style` (можно через YandexGPT API: «оцени стиль 0-100»)
- Speakable markup + FAQ → `yageo-schema`

Из workspace.ru дополнительно:
- Prompt inversion modeling → `yageo-prompt-coverage` (генерируем 50 промптов под страницу, проверяем coverage)
- LSI vocabulary → `yageo-content-depth` (synonym analysis)
- 40-60 слов ответа на FAQ → `yageo-content-structure` (FAQ block scoring)

---

# Build plan v2 — concrete commands with I/O

## Команды главного skill'а

```
/yageo init <url>          — bootstrap: fetch sitemap, verify in Webmaster, write .yageorc
/yageo audit <url>         — полный аудит: parallel subagents по 8 sub-skills, композитный score 0-100
/yageo epos <url>          — scorer по 4 критериям ЭПОС (Э, П, О, С каждый 0-100)
/yageo crawlers <url>      — robots.txt + YandexBot/YandexAdditionalBot check + sitemap validity
/yageo schema <url>        — JSON-LD аудит + генерация недостающих типов (Organization, Article, FAQPage, LocalBusiness)
/yageo webmaster <url>     — чеклист готовности к Вебмастеру (через yandex-webmaster-api)
/yageo content <url>       — content depth, Ashmanov структура, LSI coverage, prompt inversion
/yageo freshness <url>     — dateModified, устаревший контент, рекомендации по обновлению
/yageo prompt-coverage <url> <prompt-file>  — сколько из 50 реальных user prompts покрывает страница
/yageo report <url>        — client-ready PDF + markdown отчёт на русском
/yageo watch <url>         — мониторинг: запуск еженедельно через cron, отправка diff в Telegram/Email
```

## Пример output `/yageo epos <url>`

```
YaGEO— ЭПОС scorer
Target: https://gosmax.ru/catalog/alfa-bank/

Э Экспертность:      62 / 100   ⚠ Автор не указан в JSON-LD Person schema
П Полезность:        78 / 100   ✓ UX прошёл, mobile OK, 0 intrusive popups
О Оригинальность:    45 / 100   ✗ 70% описания идентично max-app.ru (ссылка на источник)
С Содержательность:  71 / 100   ⚠ 180 слов — ниже рекомендуемых 300-500

Overall: 64 / 100 — MEDIUM citability
Quick wins:
  1. Добавить Author schema с credentials (+15 pts)
  2. Переписать описание своими словами (+20 pts на О)
  3. Расширить body до 400 слов с кейсами использования (+10 pts на С)
```

## Архитектура директорий (final)

```
YaGEO/
├── README.md
├── LICENSE (MIT)
├── pyproject.toml              # yandex-webmaster-api, yametrikapy, trafilatura, reportlab, bs4
├── install.sh / install-win.sh
├── yageo/
│   └── SKILL.md                # Главный skill — оркестратор + routing команд
├── skills/
│   ├── yageo-audit/            # Композитный audit
│   ├── yageo-epos-score/       # ⚡ КРИТИЧНЫЙ — scoring по 4 критериям
│   ├── yageo-crawlers/
│   ├── yageo-schema/           # JSON-LD validator + generator
│   ├── yageo-webmaster-readiness/
│   ├── yageo-content-depth/
│   ├── yageo-content-structure/
│   ├── yageo-author-eeat/
│   ├── yageo-freshness/
│   ├── yageo-prompt-coverage/
│   ├── yageo-technical/        # Core Web Vitals через PSI API
│   ├── yageo-report/           # Markdown
│   └── yageo-report-pdf/       # ReportLab PDF
├── agents/                     # 4 parallel subagents для /yageo audit
│   ├── yageo-ai-visibility.md  # epos + crawlers + schema
│   ├── yageo-content.md        # content-depth + structure + freshness + author
│   ├── yageo-technical.md      # technical + webmaster-readiness
│   └── yageo-strategy.md       # prompt-coverage + composite scoring
├── schema/
│   ├── ru-organization.json    # с sameAs: VK, OK, Telegram, Dzen, RuTube
│   ├── ru-article-author.json  # Person credentials
│   ├── ru-faqpage.json
│   ├── ru-local-business.json  # Yandex Maps integration
│   ├── ru-product.json
│   └── ru-software-app.json
├── scripts/
│   ├── epos_scorer.py          # core — regex + heuristics + опционально YandexGPT eval
│   ├── yandex_crawler_check.py
│   ├── json_ld_validator.py
│   ├── generate_yageo_pdf.py
│   └── prompt_coverage_engine.py
└── docs/
    ├── epos-methodology.md     # как мы считаем ЭПОС score (transparent)
    ├── ru-schema-guide.md      # JSON-LD под Yandex — best practices
    └── dogfood-case-gosmax.md  # кейс применения на gosmax.ru
```

## Build timeline v2 (5 рабочих дней MVP)

- **Day 1 (Setup + core scoring)**: pyproject, install scripts, `yageo-epos-score` с heuristic scoring (без LLM call'а), unit tests на 10 тестовых страниц включая gosmax.ru
- **Day 2 (Content + crawlers)**: `yageo-content-depth`, `yageo-content-structure`, `yageo-crawlers` с YandexBot/YandexAdditionalBot
- **Day 3 (Schema + webmaster)**: `yageo-schema` generators (6 JSON-LD templates), `yageo-webmaster-readiness` через yandex-webmaster-api
- **Day 4 (Composite + reports)**: `yageo-audit` оркестратор, agents, markdown отчёт, PDF через ReportLab, RU templating
- **Day 5 (Dogfood + публикация)**: прогон на gosmax.ru (381 страниц батчем), results.json, README (RU+EN), install.sh для Git Bash + Bash, GitHub + Gitverse push, announcement draft

**Optional Phase 2 (+1 неделя):**
- `yageo-prompt-coverage` через YandexGPT API (оценка промптов LLM'ом)
- `yageo-metrika-integrate` (yametrikapy, трекинг реферального трафика из alice.yandex.ru)
- `yageo-watch` — cron-watcher с Telegram-уведомлениями
- Habr/vc.ru статья с метриками gosmax.ru before/after

---

# Publication strategy (ответ на вопрос #9)

**Рекомендация — dual-publish на 2 платформы + статья по итогам:**

| Платформа | Приоритет | Почему |
|-----------|-----------|--------|
| **GitHub** (как `github.com/<user>/YaGEO`) | Primary | Основная аудитория Claude Code skills; EN+RU README; 90% звёзд и форков придёт оттуда; зарубежные RU-SEO специалисты тоже там |
| **Gitverse** (как `gitverse.ru/<user>/YaGEO`, зеркало) | Secondary | Важно для Russian SEO-community narrative; plus if Яндекс.Поиск начнёт индексить git-репозитории как источники для Алисы — мы в плюсе; показывает патриотичность под RU-платформу |
| **TheYahia umbrella repo** | ❌ Не рекомендую | Skill должен стоять отдельно — иначе forkать нельзя, stars не фиксируются на проекте, а на umbrella. Можно добавить ссылку из TheYahia/README.md на YaGEOкак одно из "tools by Tim" |
| **Хабр** (статья по итогам) | High, через 2-3 недели | Главный канал RU-SEO dev-аудитории; ожидаемо 5-20K просмотров; 30-100 stars из UPVOTE-трафика |
| **vc.ru** (дубль статьи) | High | Маркетинговая публика, агентства, возможное внимание CMO крупняка |
| **SEO.RU / SEOnews** блогпост | Medium | Специфическое SEO-коммьюнити, узкая но вовлечённая |
| **Telegram-каналы** (SEO Tips, Бурый медведь SEO, и др.) | High | RU-SEO Telegram-каналы = основной discovery канал. Нужны preprinted tweets/посты для гостевых размещений |

**Timeline публикации:**
- **Week 1 (build)**: развиваем MVP, без публикации
- **Week 2 (dogfood)**: прогоняем на gosmax.ru, фиксируем before/after метрики
- **Week 3 (soft launch)**: публикация на GitHub + Gitverse, release v0.1.0, announcement в 1-2 Telegram-каналах
- **Week 4-5 (hard launch)**: статья на Хабр с кейсом gosmax.ru, дубль на vc.ru
- **Ongoing**: следим за issues/PRs, еженедельные улучшения, 2-3 месяца до стабильного v1.0

---

# Phase 6 disconfirming (expand)

Был сделан неявно — `q09` "Yandex Webmaster API Alice endpoints" вернул 0 результатов, `q10` нашёл только deprecated `github.com/yandex/webmaster.api` (редиректит на dev.yandex.ru). Это тройная проверка отсутствия Alice-specific endpoints: (а) первый sweep q02, (б) yandex-webmaster-api package review, (в) прямой query на yandex.ru/dev. Вердикт — API для Alice-метрик не существует и не документирован. Skill строится без этой зависимости.

---

# Phase 7 calibration (updated after expand)

Prior → Prior2 (после первого sweep) → Posterior (после expand):

- P(существует production-ready open-source tool) = 0.15 → 0.02 → **0.02** ✓ подтверждено
- P(существует SaaS-конкурент) = **не в приорах, но вскрыто в expand**: ai.pixeltools.ru + Rush Analytics + LLM Spot = **3 SaaS**. Переопределяю как: P(мы первые в open-source free сегменте) = **0.90**
- P(Webmaster API for Alice data) = 0.15 → **0.05** (подтверждено отсутствие в dev.yandex.ru)
- P(build-skill ≤5 days realistic) = 0.70 → **0.85** (pip ecosystem покрывает больше чем ожидал, Ashmanov чеклист = ready-made spec)
- P(Gitverse+GitHub ≥50 stars за 3 мес) = 0.35 → **0.45** (с учётом Habr/vc.ru + dogfood-кейса gosmax.ru; риск — много платных SaaS-конкурентов могут оттягивать поиск)
- P(Habr статья >5K просмотров) = **0.70** (тематика горячая, публичный чек-лист + dogfood-кейс — формула для хайпа)

**Самая большая переоценка в expand**: наличие SaaS-конкурентов. В первичном sweep я не проверял слово "tracker/monitoring SaaS", фокусировался на GitHub/Gitverse. Ashmanov и Pixel Plus имеют уже работающие продукты. **Это не отменяет BUILD**, но меняет positioning: «open-source альтернатива платным SaaS» вместо «первый тул на рынке».

---

# Immediate next steps (updated)

**Prio 1 (ближайшие дни):**
- [ ] Git-init YaGEOрепо (local), создать GitHub + Gitverse пустые репозитории
- [ ] Поставить yandex-webmaster-api, trafilatura, reportlab, bs4 в pyproject
- [ ] Написать первую версию `epos_scorer.py` — ядро скилла, тестить на 5 страницах (3 gosmax.ru + 2 из топ-источников Алисы)

**Prio 2 (эта неделя):**
- [ ] MVP 5 дней по timeline выше
- [ ] Dogfood run на gosmax.ru, засечь метрики в Webmaster «Видимость сайта в Алисе AI»

**Prio 3 (через 2-3 недели):**
- [ ] Release v0.1.0 на GitHub + Gitverse
- [ ] Habr статья draft (опираясь на `docs/dogfood-case-gosmax.md`)
- [ ] vc.ru дубль, Telegram announcement

---

# Открытые вопросы (для следующей итерации research'а если понадобится)

1. Сколько реально месячный трафик у `ai.pixeltools.ru` (косвенно — SimilarWeb)? Подскажет, насколько плотно SaaS-сегмент занят.
2. Gitverse аналитика — есть ли trending page? Сколько stars получают топ-репозитории в категории DevTools?
3. Будет ли Яндекс публиковать официальный CLI / open-source reference implementation? Если да — наш skill может стать community-wrapper вокруг него (ниша «better DX»).

---

# Sources added in expand

- https://www.rush-analytics.ru — Rush Analytics SaaS
- https://ai.pixeltools.ru — Pixel Plus self-service (primary SaaS competitor)
- https://vc.ru/marketing/2624845-top-5-geo-agentstv-dlya-uspehnogo-prodvizheniya — agency landscape
- https://www.ashmanov.com/education/articles/geo-prodvizhenie-kak-popast-v-otvety-ii-a-ne-tolko-v-vydachu/ — checklist
- https://workspace.ru/blog/kak-popast-v-poiskovuyu-vydachu-s-alisoy-i-alisu-ai/ — metrics framework
- https://pypi.org/project/yametrikapy/, https://github.com/pikhovkin/yametrikapy — Metrika API wrapper
- https://pypi.org/project/yandex-geocoder/ — Geocoder для schema
- https://pypi.org/project/ultimate-sitemap-parser/ — sitemap tooling
- https://pypi.org/project/sitemap_grabber/ — robots + sitemap + well-known
- https://pypi.org/project/yandex-cloud-ml-sdk/ — LLM SDK alias
- https://www.rush-agency.ru/blog/yandex/ — agency blog
- https://pixelplus.ru/samostoyatelno/otvety-na-voprosy/ai-seo-geo-aeo/ — Pixel Plus FAQ + pricing tiers
