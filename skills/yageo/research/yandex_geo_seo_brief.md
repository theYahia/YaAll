---
title: "Yandex / Алиса AI GEO SEO — landscape + build-or-buy для gosmax.ru"
tier: heavy-compressed
status: phase-1-brief
created: 2026-04-24
time_cap: 60-90 minutes
---

# Yandex / Алиса AI GEO SEO — брифф

## Blocking decision

**Ставить или пропускать Yandex/Алиса AI оптимизацию для gosmax.ru прямо сейчас?**

Если есть production-ready tooling (GitHub skill / CLI) → ставим за 1-2 дня, раскатываем на 381 страницу.
Если нет tooling, но есть качественные гайды → сами пишем micro-skill за 3-5 дней, опционально публикуем на Gitverse как community-проект (pet/recognition play).
Если ничего нет → откладываем до Q3 2026 или делаем руками по 10-20 ключевым страницам.

## Sub-decision (expanded by user 2026-04-24)

**Если Russian-рынок пуст — делать ли свой аналог YaGEOпод Yandex и публиковать на gitverse.ru?**

Тезис пользователя: «по идее можно много звёзд и признания собрать» — namespace для «Yandex AI SEO Claude Code skill» может быть свободен, RU-dev-комьюнити на Gitverse растёт, Yandex.Алиса AI только объявлена («NEW» плашка в Webmaster).

## Killer questions

1. **Существует ли production-ready GitHub/Gitverse/GitLab репо для Yandex/Алиса AI SEO оптимизации?** (CLI, skill для Claude Code, Python-тул, расширение yandex-webmaster-api)
2. **Что именно Яндекс.Алиса AI считает "citable" контентом?** — есть ли публичные рекомендации от Яндекса (аналог Google E-E-A-T / llms.txt)? Чем schema/markup/структура отличается от западных требований?
3. **Какие сигналы Yandex Webmaster показывает под плашкой «NEW Алиса AI»?** — видимость, импрессии, цитаты, query examples? Есть ли API для этого?
4. **Есть ли у Yandex аналог Google's "AI Overviews best practices" документации?** — статьи от Яндекс.Вебмастера/Searchstaff/Поиск.
5. **Что пишут RU-SEO-блогеры (TexTerra, Pixelplus, Ashmanov, SEO.RU, Devaka) про Алиса AI за последние 3 месяца?** — кейсы, бенчмарки, какие ниши уже выигрывают.
6. **Сколько dev-времени займёт построить MVP-скилл «geo-seo-yandex» под Claude Code?** (citability scorer под кириллицу, yandex-webmaster-api wrapper, llms.txt-валидатор, Яндекс schema best-practices).
7. **Каков объём аудитории на Gitverse для такого репо?** — сколько звёзд получают топовые RU-SEO-тулы, активные SEO-скиллы под Claude Code на RU сегменте.

## Decision criteria (что считаю «success»)

- **GO (ставим сейчас)** если нашли production-ready Yandex GEO tool с ≥50 stars / активным maintainer / документацией на русском.
- **BUILD (делаем сами)** если tooling нет, но есть ≥3 качественных RU-гайда + публичная Алиса AI Webmaster doc + ≥2 активных GitHub/Gitverse проекта по yandex-webmaster-api как референсы.
- **PARK (откладываем)** если и гайдов нет, Алиса AI совсем young, метрики в Webmaster не открыты публично, или сигналов что это даст трафик — нет.

## Prior beliefs (Brier-style, уточнить в Phase 7)

- P(есть production-ready tool сравнимый с YaGEO) = **0.15** (user сказал 20-50%, я чуть ниже — heavy tooling под Алиса AI слишком новое поле)
- P(есть ≥1 качественный RU-гайд по Алиса AI SEO) = **0.50**
- P(Yandex Webmaster раскрывает API для Алиса-метрик) = **0.25**
- P(Gitverse-публикация даст ≥50 звёзд за 3 мес) = **0.20** (Gitverse молодой, ниша узкая)
- P(build-себе скилл за ≤5 дней реально) = **0.60** (если есть YaGEOкак шаблон, yandex-webmaster-api python libs существуют)

## What I Already Know

- **YaGEO-trabzadeh/YaGEO** (изучил через Obsidian clipping `D:/Yahia/obsidian/Base/wiki/raw-processed/2026-04-22/YaGEO-trabzadeh-YaGEO.md`): Claude Code skill с 13 sub-skill для GEO под ChatGPT/Claude/Perplexity/Gemini/Google AIO. Что покрывает: citability (134-167 слов/блок), 14+ AI crawlers robots.txt check, llms.txt, brand mentions (YouTube/Reddit/Wiki/LinkedIn), schema generator, E-E-A-T scoring, PDF reports. Явно НЕ покрывает: Яндекс, YandexGPT, Алиса AI, RU-специфика.
- У Яндекса есть **yandex-webmaster-api** — есть публичные Python-клиенты (вероятно, подробности уточнить).
- Gosmax.ru уже сейчас индексируется в Яндекс/Google — SEO-фундамент заложен (JSON-LD SoftwareApplication, breadcrumbs, sitemap). GEO-слой не добавляли.
- Пользователь видел в **Yandex Webmaster плашку «NEW Алиса AI»** — значит метрики начали публиковаться. Важный Phase 2 target.

## Brave sweep plan (queries.txt)

Порядок: RU-tooling → Yandex official doc → RU-гайды → Gitverse/GitHub репо под yandex-webmaster-api → gitverse stars/activity. 10 queries, ~6 параллельных в flight, rate-limited.

```
q1: "Алиса AI" SEO оптимизация Яндекс 2026
q2: site:github.com yandex-webmaster-api Python
q3: site:gitverse.ru SEO Yandex
q4: Яндекс.Вебмастер "Алиса AI" NEW метрики
q5: "yandex gpt" "generative engine optimization" GEO
q6: "YaGEO" OR "claude code skill" yandex Алиса
q7: TexTerra OR Pixelplus OR Ashmanov "Алиса AI" 2026
q8: site:yandex.ru/blog OR yandex.ru/support/webmaster алиса AI
q9: llms.txt Яндекс Яндексбот crawler
q10: Yandex.SearchStaff "AI answers" OR "GenAI" recommendations
```

## Output artifacts

- `research/yandex_geo_seo_brief.md` ← этот файл (Phase 0+1)
- `research/_raw_data/yandex_geo_seo_2026-04-24/` ← Brave JSON + `parsed_snippets.md` (Phase 2)
- `research/yandex_geo_seo.md` ← synthesis (Phase 5, TL;DR + decision + build-plan если BUILD)
- Phase 3.5 checkpoint: top-10 ranked reading list перед тем как WebFetch'ить (≤10 min бюджет user review).

## Budget

- Phase 0+1 (brief, этот файл): 5 min — **done**
- Phase 2 (sweep): 5 min wall-time после появления BRAVE_API_KEY
- Phase 3 (triage): 10 min
- Phase 3.5 (checkpoint): пауза до go от юзера
- Phase 4 (WebFetch): 20 min (top 5-7 источников)
- Phase 5 (synthesis): 15 min
- Phase 6 (disconfirming): 10 min (3 angles)
- Phase 7 (retrospective + calibration): 5 min

Total: 60-75 min активных + пауза на checkpoint.
