# Research Synthesis — Keyword Research Methodology для RU SEO + Wordstat

> **Tier:** heavy | **Date:** 2026-04-27 | **Sources:** 10 Brave queries + 10 WebFetch sources
> **Brief:** `research/wordstat_methodology_brief.md`
> **Raw data:** `research/_raw_data/wordstat_methodology_2026-04-27/`
> **Methodology:** `obsidian/Base/Templates/Research-Workflow.md` v9

---

## TL;DR (3 строки)

RU SEO использует **SERP-overlap кластеризацию** (не TF-IDF) как стандарт. Для агрегаторов precision = 3-4 (широкая группировка). В 2026 году Яндекс выдаёт AI-ответы на 36% запросов, первая позиция теряет 34.5% кликов при генеративном блоке → semantic core должен строиться как **карта разговорных запросов**, не список keywords.

---

## Answers per Killer Question

### Q1: Фазы professional keyword research в RU SEO

Канонический pipeline (Rush Analytics, промопульт, darvindigital — консенсус):

```
1. Marker queries (маркерные запросы) — базовые, характеризуют тематику
2. Expansion — Wordstat левая колонка + подсказки + конкуренты
3. Cleaning — стоп-слова (автоматически) + ручной review
4. Clustering — SERP-overlap по общим URL в топе
5. URL mapping — каждый кластер → существующая или новая страница
6. Приоритизация — scoring по volume × CPC × competition
```

**Aggregator-specific (из Rush Analytics):**
- Маркерные запросы = названия категорий / фильтров
- Для информационных порталов/агрегаторов: кластеризация Wordstat-first (не marker-first), precision 3-4
- Финальное ядро в 10-50 раз больше базы конкурентов — это норма

**Prior: 75% → Posterior: 85%** — фазы стандартны, нюансы для агрегаторов найдены.

---

### Q2: Классификация интента (горячий/тёплый/холодный)

**RU таксономия (из baykalov-seo, darvindigital, wikipedia):**

| Intent | RU термин | Маркеры | Страница |
|--------|-----------|---------|----------|
| Transactional | Горячий | купить, цена, заказать, стоимость, скидка | Карточки товара / услуги |
| Commercial | Тёплый | отзывы, сравнение, лучшие, рейтинг, vs | Категория / подборка |
| Informational | Холодный | как, что такое, зачем, почему, руководство | Блог / FAQ |
| Navigational | Навигационный | бренд + сайт/официальный | Главная / About |
| Regional | Гео | + город, рядом, в Москве | Геолендинг |

**Критическое правило:** Нельзя смешивать informational и commercial в одном кластере (darvindigital Error #2). Это убивает релевантность страницы.

**RU vs EN отличие:** В RU SEO более развита категория "региональный интент" (геозависимость Яндекса сильнее Google). Маркеры commercial почти идентичны EN, но с кириллическими формами.

**Prior: 50% → Posterior: 65%** — существенных различий меньше чем ожидал, но региональная специфика реальна.

---

### Q3: Инструменты RU агентств

**Топ стек (консенсус 5+ sources):**

| Инструмент | Тип | Роль | Агрегатор-fit |
|-----------|-----|------|---------------|
| **Key Collector** | Desktop, paid | Primary: парсинг + кластеризация | ✅ лучший выбор |
| **Rush Analytics** | SaaS | SERP-overlap clustering, Wordstat integration | ✅ хорош |
| **Arsenkin Tools** | Online | Быстрая кластеризация, SERP-based | ✅ дешевле |
| **Keys.so** | SaaS | Конкурентный анализ + новый кластеризатор (обновлён март 2026) | ✅ |
| **Serpstat** | SaaS | Конкуренты, gap analysis | ⚠️ дороже |

**Для Python pipeline (наш case):**
- XMLriver API — SERP парсинг для кластеризации (альтернатива Key Collector backend)
- Arsenkin Tools имеет API (лимиты в рублях: 1 лимит = 1 фраза в 1 ПС)
- Rush Analytics — Wordstat integration + кластеризация из Wordstat напрямую

**Prior: 65% → Posterior: 75%** — KeyCollector доминирует, но облачные варианты (Keys.so, Rush) набирают вес.

---

### Q4+5: Кластеризация и маппинг на страницы

**КЛЮЧЕВАЯ НАХОДКА: RU стандарт = SERP-overlap, не TF-IDF**

Алгоритм консенсуса (Rush Analytics, kokoc.com, arsenkin.ru, промопульт):

```
1. Для каждой фразы → снять топ-10 (или топ-20/30/100) Яндекса
2. Сравнить URL пересечения между фразами
3. Если ≥N общих URL → одна группа
```

**Precision thresholds по типу сайта:**
- Агрегатор / информационный портал: **Precision 3-4** (широкая группировка)
- E-commerce: Precision 5-7 (строгое разделение)
- Высококонкурентная ниша: Precision 6-7

**Soft vs Hard:**
- **Soft**: все фразы группы связаны с самой частотной, но не друг с другом → широкие кластеры
- **Hard**: все фразы взаимно связаны → точные, мелкие кластеры
- **Middle**: маркер связан со всеми, остальные не обязаны → balance

**Для агрегаторов рекомендую Soft + Precision 3-4** — максимальная группировка, каждый кластер = посадочная страница бота/категории.

**URL маппинг:**
- Если сайт в топ-10 по маркеру → назначить ту страницу (зелёный)
- Если не в топ → найти лучшую через `site:` поиск (чёрный)
- Неясные → ручной разбор

**Implications для collect_semantics.py:** Нужно заменить TF-IDF на SERP-overlap. Практически: для каждой фразы → Яндекс поиск API (у нас есть через yandex-search-mcp!), сравнить топ-10 URL, threshold=3.

**Prior: 55% → Posterior: 70%** — SERP-overlap сюрприз, aggregator precision rules найдены.

---

### Q6: Критерии качества семядра

Из нескольких источников (quality benchmarks):

| Критерий | Описание | Benchmark |
|----------|----------|-----------|
| Полнота | Все тематические кластеры покрыты | Ядро в 10-50x больше конкурентского |
| Чистота | Нерелевантные удалены | >95% фраз целевые |
| Intent diversity | Есть все типы интента | ≥2 типа в ядре |
| Актуальность | Wordstat данные не старше 3 мес | Свежий парсинг |
| Depth | Long-tail включён | 6+ слов ≥ 30% ядра (AI-era) |
| Не-накрутка | Нет spike-фраз | dynamics без резких пиков |

**Новое в 2026:** 6+ словные запросы ≥30% ядра — потому что AI-поиск работает с разговорными формулировками.

**Prior: 70% → Posterior: 75%** — численные benchmarks частично найдены.

---

### Q7: SEO + Direct связка

Единый keyword pool разводится по каналам:

**SEO:** все типы интента (info + nav + commercial + regional)
**Direct:** только transactional/commercial (горячий + тёплый) + гео-модификаторы

**Практика RU агентств:**
- Одна кластеризация → из неё выводятся как SEO-страницы, так и Direct ad groups
- Минус-слова для Direct строятся из информационных кластеров ядра
- convertmonster.ru: сегментация семядра для Директ = отдельный этап с подбором минус-фраз

**Prior: 60% → Posterior: 70%** — концепция подтверждена, практика конкретнее чем ожидал.

---

### Q8: Частые ошибки

Топ-8 из нескольких источников (darvindigital, Rush Analytics, promopult):

1. **Смешивать info и commercial в кластере** — разные страницы, разные intent
2. **Игнорировать long-tail** — 6+ слов = conversional queries, приносят конверсии
3. **Удалять 6+ словные запросы** — в AI-эпоху это ключевые фразы
4. **Работать с устаревшими базами** (Pastuhov, SeoPult) — устаревшие / искусственные фразы
5. **Не обновлять семядро** — сезонность + апдейты алгоритмов меняют спрос
6. **Игнорировать сезонность** — dynamics обязателен перед написанием контента
7. **Переоценивать высокочастотники** — HF = высокая конкуренция, LF/MF конвертируют
8. **Не делать URL mapping** — кластеры без страниц = потерянный труд

**Prior: 75% → Posterior: 80%** — хорошо документировано.

---

### Q9: Методология в эпоху AI-поиска (2026)

**КЛЮЧЕВАЯ НАХОДКА — Яндекс апрель 7, 2026:**
- Новая гибридная архитектура: MoE + encoder-decoder
- Покрытие AI-ответами выросло в 1.5x за год
- **36% запросов Яндекса получают AI-ответ** (апрель 2026)
- Персонализация: 50ms на пользователя, контекст + история + геолокация
- Alice AI Search = отдельное семейство моделей, оптимизированных под поиск

**34.5% потеря кликов** на позиции #1 при наличии генеративного блока (Ahrefs 2025).

**Что меняется в методологии:**
1. Semantic core = карта разговорных запросов (conversational), не список keywords
2. 6+ словные фразы = основа ядра, а не мусор
3. Content clusters → "coverage of scenarios" (habr.com)
4. Ядро становится живым: пересматривается по данным аналитики, не статичный список
5. GEO слой обязателен: llms.txt, E-E-A-T, Schema.org, RAG-optimized структура (400-600 символов на параграф)
6. YandexAdditionalBot — отдельный crawler, нужен в robots.txt

**Для агрегатора gosmax.ru:**
- Запросы типа "как использовать бота МФЦ в MAX" (разговорные, 6+ слов) = новый приоритет
- Карточки ботов 800-1200 слов = правильное направление (ЭПОС критерии)
- Первый абзац H1 = прямой ответ на главный вопрос (Alice AI паттерн)

**Prior: 35% → Posterior: 80%** — ОГРОМНЫЙ сдвиг. Методология действительно меняется. Q11-связь: keyword research не устарел, но РАСШИРЯЕТСЯ.

---

### Q10: Специфики агрегатора/каталога

**Найдено — теговые расширения (promopult "Формула 3*3"):**
Агрегаторы используют семядро для автогенерации тегованных страниц. Пример: каталог ботов → страницы по категориям ("боты для бизнеса MAX", "боты для каналов MAX") + фильтры.

**Rush Analytics для агрегаторов:**
- Precision 3-4 (широкая группировка = больше кластеров = больше страниц)
- Wordstat-first clustering (не marker-first)
- Цель: максимальное количество сгруппированных кластеров под статьи/страницы

**Специфика (из intervolga.ru, mwi.me):**
- Структура каталога формируется по поисковому спросу (не по внутренней логике компании)
- Кластеризация сначала → из неё строится меню навигации
- Геозависимость важнее для агрегаторов (локальные vs общие страницы)

**1-кластер-1-страница правило:**
- 1 кластер = 1 посадочная страница
- Для агрегаторов: 1 бот = 1 страница, 1 категория = 1 листинг
- НЕ объединять ботов в одну страницу (разные кластеры = разный intent)

**Prior: 40% → Posterior: 65%** — документировано хуже чем хотелось, но fundamentals найдены.

---

### Q11: Стоит ли делать keyword research для каталогов в 2026?

**Вердикт: YES, но методология расширяется.**

Аргументы ЗА (подтверждения из sources):
- vc.ru/niksolovov: "В 2026 году semantic core по-прежнему является фундаментом для оптимизации" — прямая цитата
- Rush Analytics: "запросы, кластеризованные по SERP-методу, попадут в ТОП уже в момент индексации"
- Яндекс Апрель 2026: classical SEO ranking по-прежнему critical, т.к. Алиса выбирает из стандартного топа

Аргументы ПРОТИВ (disconfirming):
- При 36% AI-ответах часть трафика уходит в "zero-click" — keyword research не решает эту проблему
- "58% потребителей уже заменяют традиционный поиск AI для рекомендаций" (habr.com)
- habr.com: "SEO alone is insufficient" — нужен GEO layer сверху

**Вывод**: keyword research ≠ устарел для каталогов. Но: к классическому SEO-ядру обязательно добавляется GEO layer (conversational queries, Schema.org, RAG structure). Для gosmax — это означает делать оба: SEO-ядро для стандартного поиска + "Alice-friendly" контент.

**Prior: 70% → Posterior: 80%** — подтверждён с нюансом про GEO expansion.

---

## What Brave Found That I Didn't Know

(Неожиданные находки против baseline из Phase 0b)

1. **SERP-overlap IS THE RU SEO STANDARD** — я планировал TF-IDF cosine для collect_semantics.py. Это неправильно для RU рынка. Нужен SERP-based кластеризатор.

2. **Яндекс 7 апреля 2026 — гибридная AI архитектура** — MoE + encoder-decoder, 1.5x рост покрытия за год. Не просто "AI trend" — конкретный technical update с числами.

3. **Precision 3-4 специфично для агрегаторов** — значение threshold не было известно до sweep. Это меняет логику collect_semantics.py.

4. **6+ слов = ценные запросы, не мусор** — ozhgibesov.agency: "Deleting 6+ word queries is a critical mistake". В AI-эпоху они первичны для generative answers.

5. **Soft vs Hard кластеризация** — специфическая RU терминология с четкими правилами. Для агрегатора: Soft + Precision 3-4.

6. **34.5% потеря кликов на #1 при генеративном блоке** — конкретная цифра с источником (Ahrefs 2025). Используем в мега-промпте.

7. **llms.txt файл** — новый стандарт для GEO, аналог robots.txt для AI crawlers. Нужен gosmax.ru.

8. **YandexAdditionalBot** — отдельный crawler для Alice AI, нужен явный доступ в robots.txt. (Подтверждает findings из yandex_geo_seo.md).

9. **Keys.so кластеризатор обновлён в марте 2026** — анализирует топ Яндекса + семантическую близость одновременно. Лучший cloud-вариант для нашего case.

10. **"Теговые расширения" для агрегаторов** — конкретная техника auto-generation страниц по тегам из семядра. Для gosmax: категории ботов из кластеров = теги.

---

## Recommendation для gosmax.ru

### P2 Blog Queue пересортировка

Текущий подход: 2 posts/week без volume-based приоритизации.
**Рекомендация**: приоритизировать темы с (а) высоким Wordstat volume И (б) conversational intent для Alice AI.

**Новые приоритеты (из findings):**
1. **"Как использовать [Bot Name] в MAX"** — how-to, разговорный, 6+ слов, Alice-friendly → ВЫСШИЙ ПРИОРИТЕТ
2. **"Лучшие боты MAX для [use case]"** — comparison/commercial, aggregator-specific → ВЫСОКИЙ
3. **"[Bot Name] бот MAX — что умеет"** — informational, карточный, 800-1200 слов → СТАНДАРТ
4. **Категорийные гиды** ("боты госуслуг MAX" → "боты для государственных услуг в MAX — полный список") → СРЕДНИЙ

### P1 Bot Descriptions апдейт

Добавить к каждой карточке:
- Первый параграф = прямой ответ "Что умеет этот бот" (Alice AI паттерн)
- FAQPage Schema с 3-5 вопросами (habr.com: "FAQ blocks with conversational language")
- 400-600 символов на параграф (RAG-optimized structure)

### Новый deliverable: llms.txt

Создать `/llms.txt` на gosmax.ru:
- Перечислить 25-35 ключевых страниц ботов (gov/banking tier)
- Указать Schema.org Article pages
- Подтвердить что YandexAdditionalBot не заблокирован

### collect_semantics.py архитектурное изменение

Заменить TF-IDF clustering на SERP-overlap:
- Использовать `yandex-search-mcp` `wordstat_top_requests` как прокси для SERP similarity
- Threshold: ≥3 общих related phrases в topRequests ответе → один кластер
- Precision аналог: параметр min_shared_count=3 (для агрегатора)

---

## Posterior Beliefs Table (для Phase 7 Brier calibration)

| Q | Prior | Posterior | Delta | Verdict |
|---|-------|-----------|-------|---------|
| Q1 | 75% | 85% | +10 | Confirmed: фазы стандартны, aggregator nuances найдены |
| Q2 | 50% | 65% | +15 | Partially confirmed: RU ≈ EN, но regional intent сильнее |
| Q3 | 65% | 75% | +10 | Confirmed: KeyCollector + облачные (Keys.so, Rush) |
| Q4+5 | 55% | 70% | +15 | Surprise: SERP-overlap стандарт (не TF-IDF), Soft+3-4 для агрегатора |
| Q6 | 70% | 75% | +5 | Partial: численные benchmarks частично (10-50x, 6+слов ≥30%) |
| Q7 | 60% | 70% | +10 | Confirmed: единый pool, Direct = commercial subset |
| Q8 | 75% | 80% | +5 | Confirmed: хорошо задокументировано + новое (6+ слов = ценность) |
| Q9 | 35% | 80% | +45 | MASSIVE SHIFT: AI апдейт апрель 2026, 36% coverage, GEO layer обязателен |
| Q10 | 40% | 65% | +25 | Found: теговые расширения, Soft 3-4, Wordstat-first для агрегатора |
| Q11 | 70% | 80% | +10 | Confirmed with nuance: keyword research + GEO expansion = стандарт 2026 |

**Brier score** (будет посчитан в Phase 7 retro)

---

## Threads to Pull (для следующего sprint'а)

- [ ] SERP-overlap через Yandex Search API — технически реализуемо? (наш MCP дает topRequests как прокси)
- [ ] Keys.so API — есть ли programmatic access для нашего pipeline?
- [ ] llms.txt стандарт — есть ли Yandex-specific guidelines? (обычно robotstxt.org/llms.txt)
- [ ] Теговые страницы gosmax.ru — генерировать под топ-10 категорий из семядра
- [ ] Alice AI Webmaster data — когда появятся первые данные? (ждём 2-3 недели с момента верификации)

---

## Sources (топ-10, с оценками)

| # | Source | Auth | Rec | Score | Key contribution |
|---|--------|------|-----|-------|-----------------|
| 1 | habr.com/articles/1021980 | 5 | 5 | 15 | GEO vs SEO mechanics, RU-specific AI behaviors |
| 2 | ixbt.com — Яндекс гибрид 2026 | 5 | 5 | 14 | MoE+encoder-decoder, 1.5x coverage, technical ground truth |
| 3 | kokoc.com — кластеризация 2026 | 4 | 5 | 13 | Soft/Hard rules, Keys.so update, thresholds |
| 4 | ozhgibesov.agency — кластеризация нейросети | 3 | 4 | 12 | n-gram pipeline, 6+ word rule, Алиса personalization |
| 5 | darvindigital.ru — 2026 гайд | 3 | 5 | 12 | Full pipeline, errors, 2-week-old source |
| 6 | sedovcompany.ru — SEO+AEO+GEO | 3 | 5 | 12 | Hybrid strategy, metrics for Alice/YandexGPT |
| 7 | generative-optimization.ru — GEO | 3 | 4 | 11 | 34.5% stat, 8-stage checklist, llms.txt |
| 8 | news.inhouse-marketing.ru — апдейт 2026 | 3 | 5 | 11 | April 2026 update details, 36% AI coverage |
| 9 | rush-analytics.ru — методология | 4 | 3 | 11 | Aggregator precision 3-4, Wordstat-first clustering |
| 10 | promopult.ru — Формула 3*3 | 4 | 3 | 10 | Теговые расширения для агрегаторов, 9-step formula |
