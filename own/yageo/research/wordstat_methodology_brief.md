---
created: 2026-04-27
status: research-brief
tags:
  - research
  - research-deep
  - research-brief
  - wordstat
  - keyword-research
---

# RESEARCH: Методология keyword research для RU SEO + Wordstat template family

> **Шаблон:** Deep Research v9 — Brief, heavy tier
> **Methodology:** `obsidian/Base/Templates/Research-Workflow.md`
> **Output:** `research/wordstat_methodology.md` (synthesis) + `research/_raw_data/wordstat_methodology_2026-04-27/`

**Tier:** heavy
**Date:** 2026-04-27
**Blocking decision:** Какую методологию keyword research принять как стандарт для всех проектов (gosmax, CexStableBots, EdTech, NutriAI...)
**Gut feeling:** 60% — методология известна, RU-специфика и aggregator-специфика требуют sweep

---

## ⚡ QUICK START

```
WHY: Создать переиспользуемую методологию keyword research для RU SEO + template family
Q1: Какие фазы professional keyword research в RU SEO (collection → clustering → mapping)?
Q2: Как классифицировать интент (горячий/тёплый/холодный + brand/info/how-to)?
Q3: Какие инструменты использует RU рынок (KeyCollector, Rush, Just-Magic)?
SCOPE: RU SEO, агрегаторы/каталоги, Яндекс + AI-поиск, 2025-2026
```

---

## WHY (зачем этот research)

Keyword research — фундамент всех продуктовых решений в gosmax.ru (и будущих проектах):
1. Архитектура сайта (какие разделы делать) — на основе кластеров семядра
2. Приоритет P2 блог-очереди (2 posts/week) — по volume × intent fit
3. Оценка рынка (есть ли спрос на "бот МФЦ MAX"?) — до написания 1200-слов описаний
4. SEO + Direct связка — один keyword pool

Нет стандартной методологии в проектах → каждый раз изобретаем заново. Цель: **template family** в `obsidian/Base/Templates/` + 2 мега-промпта для AI-агентов.

---

## QUESTIONS

1. **Q1** — Какие фазы professional keyword research в RU SEO (collection → expansion → cleaning → clustering → mapping)?
2. **Q2** — Как классифицировать интент: горячий/тёплый/холодный + brand/info/how-to/commercial/navigational/regional?
3. **Q3** — Какие инструменты используют RU агентства (KeyCollector, Rush Analytics, Just-Magic, Serpstat) — сильные/слабые стороны для агрегаторов?
4. **Q4+5** — Как кластеризовать запросы (TF-IDF / embeddings / SERP-overlap / manual) и мапить кластеры на pages?
5. **Q6** — Какие критерии качества семядра (полнота, чистота, актуальность) — численные benchmarks?
6. **Q7** — Как использовать данные семядра для связки SEO + Direct?
7. **Q8** — Какие частые ошибки (мусор, переоптимизация, missing intent, ignored seasonality)?
8. **Q9** — Как меняется методология в эпоху AI-поиска (Алиса AI, Google AI Overview)?
9. **Q10** — Какие специфики **агрегатора/каталога** (vs e-commerce / blog / SaaS)?
10. **Q11** — **Стоит ли вообще делать формальный keyword research для каталогов в 2026?** (мета-вопрос, disconfirming)

### Follow-up questions (добавляй по ходу)

11. Как Wordstat affinity index (>100%) сигнализирует потенциальный рынок?
12. Как детектировать накрученные запросы (spike в dynamics + low SERP)?
13. Какой реальный rate-limit у Yandex Cloud Search API Wordstat?

---

## WHAT I ALREADY KNOW (до sweep — Phase 0b baseline)

**Из catalog_growth.md:**
- gosmax.ru дифференцируется на gov/banking ботах (МФЦ, Госуслуги, Сбербанк, ВТБ, ФНС)
- 12+ конкурентов, mxstat.ru доминирует channels → не лезем туда
- Приоритет: контент (800-1200 слов на бота) → блог 2 posts/week

**Из yandex_geo_seo.md:**
- Алиса AI: ЭПОС = Экспертность + Полезность + Оригинальность + Содержательность
- Алиса выбирает из стандартного топа Яндекс-поиска → классическое SEO по-прежнему критично
- gosmax.ru Webmaster уже верифицирован, ждём Alice AI data 2-3 недели

**Из Research-Workflow.md v9:**
- 3-engine triangulation: Brave + Claude Opus DR + Gemini DR (mandatory heavy)
- Query diversification rule: каждый concept → 3-5 phrasings (избегаем semantic gap)
- Phase -1: research = decision accelerator, цепь research → decision → action должна замкнуться

**Из Research-Deep-Brief.md:**
- Шаблон v9 имеет "3-ENGINE TRIANGULATION" секцию — надо включить в нашу template family
- Follow-up clusters запускаются ПОСЛЕ первого sweep (threads to pull)

**Что ещё знаю (до sweep):**
- KeyCollector — де-факто стандарт в RU SEO, paid, Windows-only
- Intent классификация: commercial = "купить", "цена", "заказать"; informational = "как", "что такое"; navigational = brand name
- Wordstat Cloud API: topRequests + regions ✅, dynamics ✅ (только high-volume >10K/мес), top ❌ (404)
- TF-IDF char n-grams (3-5) + cosine 0.55 — стартовый threshold, tunable на demo run
- GigaChat encoding issue на Windows (требует UTF-8 stdout reconfigure)

---

## BRAVE SWEEP PLAN

> 10 queries, 5 diversity angles per core concept (v9 rule)

### Cluster 1: Методология и фазы
```
c1_01: семантическое ядро методология сбор сегментация Россия 2026
c1_02: кластеризация запросов SEO Россия Яндекс инструменты алгоритмы
c1_03: классификация интента запросов горячий теплый холодный SEO
c1_04: Wordstat best practices сбор семантического ядра гайд агентство
```

### Cluster 2: Инструменты и агрегатор-специфика
```
c2_01: KeyCollector Just-Magic Rush Analytics Serpstat сравнение 2026
c2_02: семантическое ядро для агрегатора каталога методика отличия
c2_03: архитектура сайта на основе семантического ядра кластер страница
c2_04: SEO Яндекс Директ связка семантическое ядро keyword pool 2026
```

### Cluster 3: Ошибки + AI-эпоха
```
c3_01: частые ошибки сбор семантического ядра как избежать
c3_02: семантическое ядро AI поиск Алиса генеративные ответы 2026
```

**Output dir:** `research/_raw_data/wordstat_methodology_2026-04-27/`

---

## SCOPE

**Include:**
- Методология keyword research для RU SEO, Яндекс-фокус
- Агрегаторы и каталоги (gosmax-специфика)
- Wordstat API usage + best practices
- AI-поиск влияние на методологию (Алиса, 2026)
- Template design для переиспользования (obsidian vault)

**Exclude:**
- Google-ориентированная методология (не primary для RU рынка)
- E-commerce-специфика (другой intent profile)
- Paid tool internals (KeyCollector API, Rush Analytics backend)

**Language:** ru + en (en для алгоритмических источников — clustering, TF-IDF papers)

---

## THREADS TO PULL

- [ ] Как именно SERP-overlap clustering работает для RU? (только HTTPS или Яндекс-топ отдельно?)
- [ ] Есть ли публичные benchmarks: "сколько фраз нормальное семядро для каталога N страниц"?
- [ ] Programmatic SEO для агрегаторов: как другие Яндекс-каталоги (например, kinopoisk, otzovik) строят структуру?
- [ ] Affinity index Wordstat: как использовать как сигнал "emerging demand"?
- [ ] Gemini DR: запустить отдельно на Q10 (aggregator-specific) — RU-специфика может быть слепым пятном

---

## 3-ENGINE TRIANGULATION (mandatory для heavy tier)

- [x] Local Brave sweep (через `brave_sweep.py`) — Phase 2
- [ ] AI DR prompt написан из `obsidian/Base/Templates/Research-AI-DR-Prompt.md`
- [ ] Prompt paste'нут в Claude app Opus 4.7 → Deep Research
- [ ] Prompt paste'нут в Gemini → Deep Research
- [ ] Outputs saved в `_raw_data/{claude,gemini}_output.md`
- [ ] `synthesis_triangulation.md` написан — convergent / divergent / unique findings

---

## DECISION CRITERIA

- **Если Q1 = фазы хорошо документированы (Prior 75% подтверждён)** → template family берёт их как foundation
- **Если Q2 = RU intent taxonomy ≠ EN** → создаём RU-specific 5-tier (не копируем EN frameworks)
- **Если Q9 = AI-поиск меняет методологию** → добавляем Phase "AI-visibility check" в workflow template
- **Если Q10 = агрегатор специфика слабо документирована** → пишем с нуля (не адаптируем e-commerce гайды)
- **Если Q11 = keyword research устарел для каталогов 2026** → пересматриваем весь скоуп sprint'а

---

## PRIOR BELIEFS (heavy tier — per Q)

| Q# | Belief | Prior % | Reasoning |
|----|--------|---------|-----------|
| Q1 | Фазы стандартны (collection→expansion→cleaning→clustering→mapping) | 75% | Наблюдается в EN литературе, вероятно RU аналогично |
| Q2 | RU intent taxonomy отличается от EN (иные маркеры commercial intent) | 50% | RU: "купить" vs EN: "buy" — возможно разные веса |
| Q3 | KeyCollector доминирует рынок, остальные нишевые | 65% | Многолетнее наблюдение, но детали для агрегаторов TBD |
| Q4+5 | TF-IDF baseline работает, threshold 0.55 потребует тюнинга | 55% | Алгоритм общий, RU-специфика (брендовые стемы) может сломать |
| Q6 | Quality criteria известны, численные benchmarks нет | 70% | Качественные критерии понятны, чисел нигде не видел |
| Q7 | SEO+Direct связка концептуально известна, RU-практика TBD | 60% | Концепция есть в EN, RU-агентства могут иметь разный подход |
| Q8 | Частые ошибки хорошо документированы | 75% | Стандартный контент у любого RU SEO агентства |
| Q9 | AI-поиск меняет методологию, пока нет устоявшегося ответа | 35% | Свежая тема (2026), мало данных |
| Q10 | Агрегатор-специфика слабо документирована | 40% | Большинство гайдов = e-commerce, агрегатор редко отдельно |
| Q11 | Formal keyword research ещё актуален для каталогов в 2026 | 70% | Думаю да — AI-поиск ещё не убил intent-based discovery |

В Phase 7 эти priors сравниваются с posterior → Brier score.

---

## Pre-mortem (что может убить sprint)

1. **Templates получатся theoretical** — data из demo run слабая (sparse, неточная) → templates без real-grounding. *Mitigation: Phase 5b demo run обязателен до написания templates*
2. **Methodology research дублирует общеизвестное** — Brave sweep вернёт agima.ru/click.ru → no novelty. *Mitigation: следить за disconfirming в Phase 6*
3. **Wordstat rate limits** — depth=2 на 30 seeds ≈ 650 calls → throttle/quota errors. *Mitigation: caching между запусками, incremental dev depth=1 → depth=2*
4. **GigaChat intent classification дрейфует** — confidence низкая → manual review съест бюджет. *Mitigation: Tier 1 regex pokryvaet ~25%, GigaChat только для остальных; если >50% confidence <0.6 → остановить*
5. **Sprint занимает 12-15h** — мега-промпты H1+H2 по 2-3 часа каждый → fatigue hits quality. *Mitigation: Session 3 (мега-промпты) отдельным днём*

---

## Субагент prompt template

```
Read the Brave sweep at: research/_raw_data/wordstat_methodology_2026-04-27/parsed_snippets.md

Context: GosMaxCatalog project (gosmax.ru) — catalog of MAX messenger bots.
Project differentiator: official gov/banking bots (МФЦ, Госуслуги, Сбербанк).
Research focus: RU SEO keyword research methodology + aggregator-specific techniques.

For each cluster:
1. Key findings with sources (URLs, dates, exact quotes)
2. Surprising facts (things not obvious from first principles)
3. Numbers and metrics (exact thresholds, benchmarks, counts)
4. RU-vs-EN differences (where Russian SEO practice diverges)
5. Aggregator-specific mentions (anything specific to catalog/directory sites)
6. AI-search implications (Алиса AI, generative search relevance)
7. Follow-up threads (what should we research NEXT?)

Be comprehensive. Extract everything valuable. Under 3000 words.
```
