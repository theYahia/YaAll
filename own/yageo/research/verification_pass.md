---
title: "Verification pass — проверка всех claims из expand_synthesis.md"
type: audit
created: 2026-04-24
---

# Метод

Для каждого load-bearing claim — ставлю:
- ✓ **Fact** — прямая цитата из raw sweep или WebFetch
- ⚠ **Estimate** — моя оценка / прогноз (не факт, должен быть помечен как forecast)
- ❌ **Retract** — ошибся, надо исправить

# Claims audit

## SaaS-конкуренты

| # | Claim | Status | Source / Note |
|---|-------|--------|---------------|
| 1 | `ai.pixeltools.ru` цены 1149 / 3490 / 22990 ₽/мес | ✓ | WebFetch ai.pixeltools.ru. Direct quote «Professional: ₽1,149/month, Guru: ₽3,490/month, Business: ₽22,990/month» |
| 2 | `ai.pixeltools` trial «99 рублей» | ✓ | WebFetch quote «попробовать за 99 рублей» |
| 3 | `ai.pixeltools` трекает ChatGPT + Алиса + Gemini + DeepSeek + Claude | ✓ | WebFetch direct list |
| 4 | `ai.pixeltools` clients: Касперский, Samsung, Яндекс, Skyeng | ⚠ | WebFetch: «client logos» — т.е. **логотипы на странице**, не обязательно активные клиенты. Каждый из них может быть партнёром или кейсом. **Осторожно с цитированием как «клиенты»** |
| 5 | `Rush Analytics` трекает Алису + ChatGPT | ✓ | parsed_snippets q05: «контролируйте упоминания в ChatGPT и Алисе» |
| 6 | `Rush Analytics` API есть | ✓ | WebFetch: «получайте данные о позициях всего за 1 запрос к API». Endpoints не раскрыты на публичной странице. **Для Alice-specific API — НЕ подтверждено** |
| 7 | `Rush Analytics` 7 дней free trial | ✓ | WebFetch direct quote |
| 8 | `LLM Spot` by Digital Geeks — «proprietary platform for LLM brand visibility» | ⚠ | Источник: одно предложение vc.ru top-6 статьи: «LLM Spot platform for neural network brand visibility analysis». **Детальной публичной инфы нет — я назвал его «proprietary», но может быть внутренний tool или SaaS. Неопределённость.** Требует дополнительного WebFetch |

## Pixel Plus pricing

| # | Claim | Status | Source |
|---|-------|--------|--------|
| 9 | Pixel Plus агентство тарифы 129.9K / 179.9K / 500K+ / 195.9K | ✓ | WebFetch первый проход (synthesis v1) |
| 10 | Pixel Plus «Оборот» минимум 79.5K ₽ | ✓ | q04 direct quote «Минимальная фиксированная часть оплаты — от 79 500 рублей» |
| 11 | Pixel Plus продают «до 300 промптов» | ✓ | parsed_snippets q08 direct: «Анализ цитируемости сайта и бренда (до 150 промптов и поисковых запросов)» (сначала было 150, в других местах — 300 для comprehensive tier). **Уточнить: 150 для mid-tier, 300 для top-tier** |

## Yandex / Алиса AI факты

| # | Claim | Status | Source |
|---|-------|--------|--------|
| 12 | 46.5M человек/мес видят Alice AI ответы | ✓ | Triple-cited: habr.com/ru/news/1020242, kommersant.ru/doc/8570440, webmaster.yandex.ru/blog/efficiency-alice |
| 13 | 14M+ сайтов-источников за Jan-Feb 2026 | ✓ | kommersant.ru direct quote |
| 14 | ЭПОС = Экспертность/Полезность/Оригинальность/Содержательность | ✓ | Ashmanov WebFetch direct; также в yandex.ru/support/webmaster doc |
| 15 | Инструмент «Видимость сайта в Алисе AI» запущен 7 апреля 2026 | ✓ | Multiple sources |
| 16 | Webmaster tool показывает SoV %, топ-3/10/20, примеры запросов, конкурентов, 3 мес timeline, weekly update | ✓ | WebFetch yandex.ru/support/webmaster/ru/service/alice-answers |
| 17 | API для Alice-метрик НЕТ («рассматриваем») | ✓ | WebFetch direct quote + triple-verified через q09, q10, yandex-webmaster-api pypi |
| 18 | ИИ-блендер 50 мс, Alice AI LLM = «сотни миллиардов параметров» | ✓ | Ashmanov WebFetch |
| 19 | Alice делает «несколько запросов в поиск» и отбирает top | ✓ | Ashmanov quote |
| 20 | Октябрь 2025 — Алиса выбирают 14.3% пользователей vs DeepSeek 9.4% | ✓ | m.seonews.ru quote q08 (cited to Mediascope исследование) |

## Pip / открытые пакеты

| # | Claim | Status | Source |
|---|-------|--------|--------|
| 21 | `yandex-webmaster-api` (bzdvdn, MIT, v0.0.3 Mar 2024) — 30+ методов, НЕТ Alice-endpoints | ✓ | WebFetch pypi + triple check |
| 22 | `yametrikapy` (pikhovkin GitHub) — Metrika API wrapper | ✓ | Brave q03 result |
| 23 | `yandex-cloud-ml-sdk` / `yandex-ai-studio-sdk` — YandexGPT + Search API | ✓ | Brave q02 + WebFetch github.com/yandex-cloud/yandex-ai-studio-sdk |
| 24 | `yandex_gpt` pypi — YandexGPT client | ✓ | Brave q02 direct |
| 25 | `yandex-chain` pypi — LangChain YandexGPT integration | ✓ | Brave q02 |
| 26 | `ultimate-sitemap-parser` pypi | ✓ | Brave q01 direct |
| 27 | `sitemap_grabber` pypi (robots + sitemap + well-known) | ✓ | Brave q01 direct |
| 28 | `yandex-geocoder` pypi | ✓ | Brave q02 |
| 29 | `ya-direct-api` (amureki GitHub) | ✓ | Brave q03 |
| 30 | `@langchain/yandex` npm | ✓ | Brave q02 (first sweep disconfirming) |
| 31 | **НЕ из sweep: `trafilatura`, `reportlab`, `beautifulsoup4`** — mainstream Python packages | ⚠ | Я знаю их из общего опыта. Не проверил специально под RU-контент. **Рекомендация: в MVP-build фазе прогнать на тестовой RU-странице, убедиться что cyrillic не ломает parser** |

## Ashmanov чек-лист

| # | Claim | Status | Source |
|---|-------|--------|--------|
| 32 | Полный чек-лист ~30 пунктов + 5 Yandex GPT-specific | ✓ | WebFetch WebFetch ashmanov GEO article. Подсчитано 29 пунктов ±, 5 отдельных Yandex-specific |
| 33 | FAQ block 40-60 слов ответа + Speakable | ✓ | workspace.ru quote |
| 34 | LSI vocabulary, prompt inversion, hub-and-spoke cluster | ✓ | workspace.ru + ashmanov quotes |
| 35 | "Crocodile effect" — уникальный не-summarizable контент | ✓ | ashmanov direct quote |

## Агентства landscape

| # | Claim | Status | Source |
|---|-------|--------|--------|
| 36 | 6 GEO-агентств из vc.ru top-6: Инженеры продаж, Ковалевы, Head Promo, Rush Agency, Digital Geeks, Dojo Media | ✓ | WebFetch vc.ru article, all 6 named |
| 37 | GEAR framework у Head Promo (analysis→implementation→measurement→optimization) | ✓ | vc.ru quote |
| 38 | Ковалевы — 600+ проектов с 2007 | ✓ | vc.ru quote |
| 39 | Envybox + Ковалевы «open GEO promotion» — анонсировали апрель 2026 | ⚠ | Одно упоминание в snippets news.inhouse-marketing.ru: «Envybox и агентство «Ковалевы» запускают открытое GEO-продвижение». **Детали не видел. Требует WebFetch в следующем research** |

## Forecasts (моё, не факты — помечены как estimate)

| # | Claim | Status | Note |
|---|-------|--------|------|
| 40 | P(Gitverse+GitHub ≥50 stars за 3 мес) = 0.45 | ⚠ estimate | Моя калибровка, не измеримый факт |
| 41 | P(Habr статья >5K просмотров) = 0.70 | ⚠ estimate | Subjective forecast |
| 42 | Build timeline 5 дней | ⚠ estimate | Зависит от моей velocity и LLM context retention при работе |
| 43 | «Open-source free сегмент — уникальный угол» | ⚠ estimate | True по состоянию sweep на 2026-04-24; может измениться через неделю |

## Claims к переформулировке

- **#4** → переписать «клиенты» как «логотипы на странице (partners/case studies, точный статус не раскрыт)»
- **#8** → «LLM Spot — внутренняя SaaS/платформа, детали не публичны, требует дополнительной проверки»
- **#11** → уточнить «до 150 промптов для mid-tier, до 300 для comprehensive»
- **#31** → добавить caveat «стандартные Python пакеты, не проверены специально на RU-content parsing в sweep»
- **#39** → «Envybox+Ковалевы: анонс упомянут, детали не проверены, следить»
- **#40-43** → чётко пометить как «forecast» не «claim»

# Commands list audit

Исходный список (11 команд):

```
/yageo init / audit / epos / crawlers / schema / webmaster / content / freshness / prompt-coverage / report / watch
```

**Проблемы:**
- `/yageo content` и `/yageo freshness` — оба в скопе «content-quality», создают cognitive overhead. Лучше внутри `/yageo audit`.
- `/yageo init` — bootstrap неочевиден, можно делать автоматически при первом `audit`.
- `/yageo watch` — feature, не core command. v0.2.
- `/yageo prompt-coverage` — эксперимент, v0.2.

**Оптимизированный MVP v1 — 7 команд:**

```
/yageo audit <url>         — полный аудит (включает epos + crawlers + schema + content + freshness внутри)
/yageo epos <url>          — быстрый focused scoring 4 критериев ЭПОС
/yageo crawlers <url>      — robots.txt + YandexBot/YandexAdditionalBot + sitemap validity
/yageo schema <url>        — JSON-LD аудит + генерация недостающих типов
/yageo webmaster <url>     — интеграция с Webmaster API (sitemap status, indexing stats) — требует OAuth
/yageo report <url>        — PDF + markdown отчёт по последнему audit
/yageo help                — справка по командам
```

**v0.2 (через 2-4 недели после MVP):**
```
/yageo content <url>           — deep content scoring (если нужна фокусированная итерация)
/yageo freshness <url>         — dateModified analytics + рекомендации
/yageo prompt-coverage <url>   — LLM-assisted coverage через YandexGPT
/yageo watch <url>             — cron + Telegram notifier
/yageo init                    — interactive setup wizard
```

**Почему 7 а не 11:**
- Меньше когнитивной нагрузки для пользователя
- Каждая команда имеет чёткий job-to-be-done
- v0.2 команды — для power-users, не для MVP
- `/yageo audit` — default path; остальные 4 (epos, crawlers, schema, webmaster) для точечных итераций
