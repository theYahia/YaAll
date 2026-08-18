---
title: "YaGEOexpand2 — NLP libs + YandexGPT + SaaS traffic + hidden competitors"
tier: heavy-compressed
status: phase-2.5-round-2
time_cap: 60 min
parent: expand_synthesis.md
---

# 4 parallel fronts

## A. RU NLP/NER libs (ядро ЭПОС-scorer)

Killer Qs:
- Какой стек для русской морфологии + NER production-ready: Natasha / DeepPavlov / pymorphy2 / razdel / rusvectores?
- Есть ли готовые RU-BERT/SBERT модели для semantic similarity scoring?
- Что требуется для обнаружения "экспертности" через lexical markers (терминология, цифры, цитирования)?

## B. YandexGPT API модели + цены (v0.2 feasibility)

Killer Qs:
- Актуальные модели в 2026: YandexGPT 5 Lite/Pro/Reasoning + Alice LLM?
- Цены за 1K токенов, бесплатные лимиты, trial?
- Rate limits для production MVP использования (скилл будет делать 50-200 вызовов на сайт)?

## C. SaaS traffic + Gitverse reality check (калибровка star forecasts)

Killer Qs:
- Месячный traffic у `ai.pixeltools.ru` и `rush-analytics.ru` (через SimilarWeb или косвенные метрики)?
- На Gitverse — сколько звёзд у топ-dev-tools репо (для realistic forecast)?
- Trending репо в Gitverse за последние 3 месяца в категории developer tools / SEO?

## D. Hidden конкуренты

Killer Qs:
- LLM Spot — публичная ли платформа, может open-source частями?
- Envybox + Ковалевы «открытое GEO-продвижение» — это tool, гайд или agency service?
- Есть ли другие RU GitHub/Gitverse репо с «алиса seo» / «geo ai russia»?

## Priors (compressed)

- P(Natasha дадут 80%+ NER coverage для RU) = 0.75
- P(YandexGPT Lite достаточно для scoring задачи ≤5 руб/сайт) = 0.55
- P(ai.pixeltools.ru <100K viz/мес) = 0.60 (SaaS, узкий сегмент)
- P(Gitverse top SEO-tool имеет ≤30 stars) = 0.65
- P(LLM Spot — public SaaS) = 0.35 (скорее внутренняя)
- P(Envybox+Ковалевы анонс — это tool) = 0.30 (скорее гайд/services)

## Queries (12)

```
1. Natasha DeepPavlov pymorphy2 razdel russian NER сравнение production
2. "rubert" OR "sbert" russian semantic similarity embedding pypi 2025
3. russian text quality scoring readability expertise metrics
4. YandexGPT 5 Lite Pro Reasoning API цена за токены 2026
5. yandex.ru/dev/foundation-models yandexgpt pricing rate limits
6. yandex-cloud-ml-sdk python YandexGPT example completion
7. similarweb ai.pixeltools.ru OR rush-analytics.ru traffic 2026
8. site:gitverse.ru stars trending developer tools 2026
9. gitverse.ru repositories ranking discovery popular
10. "LLM Spot" Digital Geeks brand visibility platform публичная
11. Envybox Ковалевы "открытое GEO" 2026 анонс что это
12. site:github.com OR site:gitverse.ru russian "Alice AI" OR алиса SEO audit tool
```

## Budget

- Brief: 5 min ✓
- Sweep: 5 min
- Triage: 10 min
- WebFetch 6-8 urls: 20 min
- Synthesis + verification updates: 15 min
- Disconfirming / Phase 7: 5 min

Total: ~60 min
