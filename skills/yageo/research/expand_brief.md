---
title: "YaGEOexpand — pip ecosystem + competitor deep-dive + Webmaster API"
tier: heavy-compressed continuation
status: phase-2.5
created: 2026-04-24
time_cap: 90 min
parent: yandex_geo_seo_brief.md
---

# Expand brief — what we need before writing the skill

## Three sub-decisions

1. **Какие pip/npm-пакеты взять как зависимости** — чтобы не писать с нуля то, что уже решено?
2. **Что именно продают конкуренты (Pixelplus, Rush-Agency, TexTerra, Devaka, SEO.RU, Semantica) и как это раскладывается в чек-лист?** — это даёт нам feature matrix для скилла (каждую услугу → sub-skill).
3. **Есть ли Webmaster API для метрик Алисы AI?** — первичный ресёрч сказал «нет, рассматриваем». Проверяем повторно через официальную doc Яндекс Cloud / dev Webmaster.

## Killer questions expand

1. Какие **Yandex-специфичные Python-пакеты** существуют и что покрывают? (webmaster-api, direct-api, metrika, cloud SDKs, YandexGPT clients)
2. Есть ли **universal SEO Python/Node либлы**, где Yandex поддержан как target (аналог `google-search-console` клиентов, `advertools`)?
3. Есть ли пакеты для **llms.txt / ai.txt / sitemap / robots.txt validation**, которые можно встроить?
4. Что именно обещает **Pixelplus** в каждом tier (129K / 179K / 500K+ ₽/мес) — разложить по конкретным работам?
5. Что у **Rush-Agency** в услуге Yandex Алиса? Конкретные deliverables?
6. **TexTerra, Devaka, SEO.RU, Serpstat, Topvisor** — у кого из RU-SEO-агентств уже есть Alice AI offering, у кого ещё нет (может быть white-space для партнёрств)?
7. **Yandex Webmaster API** — полный список endpoints (current + beta), есть ли `/efficiency/alice-answers/*` или аналог?
8. **Yandex Direct API + Metrika API** — что можно использовать для косвенного трекинга AI-трафика (переходы с `alice.yandex.ru`, metrica UTM)?

## Priors (pre-expand)

- P(найдём полезный pip-пакет кроме yandex-webmaster-api) = **0.70** (YandexGPT clients уже нашли, Yandex Metrika API тоже существует)
- P(Pixelplus детально раскрывает workflow на лендинге) = **0.40** (типично агентства не раскрывают методологию)
- P(Webmaster API имеет beta endpoint для Alice) = **0.15** (первичный ответ Яндекса «рассматриваем», 2 недели прошло)
- P(≥3 RU-агентств без Alice AI offering — потенциал «скилл как lead-gen») = **0.60**

## Brave sweep plan (queries.txt)

Три кластера, 10 queries:

**Cluster A — pip/npm ecosystem (3 q):**
```
q1: yandex site:pypi.org seo sitemap robots
q2: yandex site:pypi.org OR site:npmjs.com GEO "AI" analytics
q3: "yandex direct api" OR "yandex metrika api" python wrapper
```

**Cluster B — competitor deep-dive (5 q):**
```
q4: Pixelplus "Алиса AI" продвижение услуги цена тарифы
q5: Rush-Agency Yandex AI GEO методология чек-лист
q6: TexTerra "Алиса AI" ИИ продвижение 2026
q7: Serpstat Topvisor "Алиса AI" генеративная выдача Яндекс
q8: SEO.RU OR Devaka OR Semantica "Алиса AI" кейсы результаты
```

**Cluster C — Webmaster API depth (2 q):**
```
q9: "Yandex Webmaster API" site:yandex.ru/dev endpoints Алиса
q10: "yandex.ru/dev/webmaster" efficiency alice-answers generative API
```

## Output artifacts

- `research/expand_brief.md` ← этот файл
- `research/_raw_data/yageo_expand_2026-04-24/` ← raw + parsed
- `research/expand_synthesis.md` ← Phase 5 (build plan v2, publication strategy, competitor feature matrix)

## Budget breakdown (90 min)

- Phase 2.5 brief (этот файл): 5 min ✓
- Brave sweep: 5 min
- Triage + select top sources: 10 min
- WebFetch 5-7 sources: 25 min
- Synthesis (build plan v2 + competitor matrix + publication): 40 min
- Phase 6 disconfirming: 5 min
