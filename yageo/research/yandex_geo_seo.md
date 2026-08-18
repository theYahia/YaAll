---
title: "Yandex / Алиса AI GEO — landscape + build-or-buy synthesis"
type: heavy-compressed synthesis
status: phase-5
created: 2026-04-24
companion_brief: yandex_geo_seo_brief.md
companion_raw: _raw_data/yandex_geo_seo_2026-04-24/
---

# TL;DR

1. **Production-ready Claude Code skill / CLI под Yandex + Alice AI не существует** на GitHub и Gitverse (проверено 2026-04-24, 10 Brave queries). Ближайшее — `yandex-cloud/yandex-ai-studio-sdk` — это LLM API SDK, не SEO-тул. Ни один из reviewed hostnames не предоставляет skill-формата.
2. **Официальная doc от Яндекса появилась 7 апреля 2026** — 17 дней назад. Инструмент «Видимость сайта в Алисе AI» в Вебмастере + публичные критерии **ЭПОС** (аналог E-E-A-T). Публичной Webmaster API для этих данных **пока нет** («рассматриваем»).
3. **Рынок разогрет** — Pixelplus берёт 129-500K ₽/мес за Alice AI GEO услугу, Rush-Agency делает комплексные пакеты, Ashmanov выпустил методологический материал. Спрос есть, монетизация есть, open-source tool — нет.
4. **Рекомендация: BUILD** — собрать `geo-seo-yandex` Claude Code skill за 3-5 рабочих дней на базе шаблона YaGEO+ ЭПОС-критериев + публичной Yandex doc. Опубликовать синхронно на GitHub + Gitverse. Использовать на gosmax.ru как dogfood-кейс.
5. **Блок gosmax.ru немедленные действия**: (a) verify в Яндекс.Вебмастере (уже сделано — `598461d seo: add Yandex and Google site verification`); (b) дождаться накопления данных 2-3 недели в разделе «Эффективность → Видимость сайта в Алисе AI»; (c) параллельно строить skill, применять сразу по мере готовности.

---

# Decision

**BUILD + ship gosmax.ru как pilot** (уверенность 80%+).

Почему не PARK: Алиса AI уже покрывает 46.5M человек/мес, ЭПОС критерии опубликованы, Webmaster tool live — можно начинать прямо сейчас.

Почему не GO-through-existing-tool: он не существует. Платный Pixelplus решает проблему, но не соответствует DIY-ценностям проекта и не даёт дифференциации gosmax.ru.

---

# Answers to killer questions

**Q1: Существует ли production-ready GitHub/Gitverse/GitLab репо для Yandex/Alice AI SEO?**
**Нет.** Поиск по GitHub + Gitverse на "YaGEO", "yandex gpt generative engine optimization", "claude code skill yandex alisa" — 0 релевантных результатов. Единственное близкое — `yandex-cloud/yandex-ai-studio-sdk`, но он покрывает только LLM API, не SEO-тулинг. В Gitverse ручной срез поиска даёт yandex-translate, yandex-music, yandex-ads — ничего по GEO/SEO.

**Q2: Что Яндекс.Алиса AI считает citable контентом?**
**Публичные критерии ЭПОС (Yandex's E-E-A-T):**
- **Экспертность** — глубина раскрытия темы, квалифицированные авторы с реальным опытом, аргументы с опорой на исследования/лучшие практики отрасли, отображение credentials авторов/компании.
- **Полезность** — способность решать задачу пользователя; UX и функциональность проверены на всех устройствах; отсутствие навязчивых баннеров/попапов.
- **Оригинальность** — «ценностная уникальность» (не rewording, а собственные кейсы/факты компании); цитаты не ухудшают уникальность при оригинальной ценности.
- **Содержательность** — семантическая плотность, полное покрытие темы, структурированность, отсутствие воды.

Mechanics: Alice AI делает несколько запросов в Поиск, выбирает самые качественные страницы, ИИ-блендер комбинирует 40+ типов блоков за 50 мс.

**Q3: Какие сигналы Yandex Webmaster показывает под «Алиса AI NEW»?**
Раздел: **Вебмастер → Эффективность → Видимость сайта в Алисе AI**. Метрики:
- **Share of Voice (%)** — доля ответов Алисы с упоминанием сайта от общего числа ответов
- **Ранг-группа** — топ-3 / топ-10 / топ-20 по частоте упоминаний
- **Примеры запросов**, где сайт попадает в ответы Алисы
- **Список сайтов-конкурентов** в той же тематике (случайный сэмпл)
- Данные за 3 месяца, обновление еженедельное
- **API/экспорт: НЕТ** («рассматриваем возможность» — прямой ответ Яндекса пользователю)

**Q4: Аналог Google "AI Overviews best practices" от Яндекса?**
Есть. `yandex.ru/support/webmaster/ru/service/alice-answers` — официальная doc. Плюс развёрнутый pre-made материал от Ashmanov с раскладкой ЭПОС. Ресурс webmaster.yandex.ru/blog/efficiency-alice — launch-анонс.

**Q5: Что пишут RU-SEO-блогеры (TexTerra, Pixelplus, Ashmanov, SEO.RU, Devaka) за 3 месяца?**
Активно. Ashmanov — топовый методический разбор ЭПОС. Pixelplus — услуги. Rush-Agency — методология + цены. Semantica-media, Rookee, Qmedia.by — гайды. Новость дня про Webmaster tool прошла через Habr, Коммерсант, vc.ru, ixbt, seonews. TexTerra и Devaka **в Brave sweep не всплыли** — возможно, не писали либо Brave их плохо индексирует.

**Q6: Dev-бюджет на MVP-skill `geo-seo-yandex`?**
**3-5 рабочих дней** при использовании YaGEO`YaGEO` как скелета. Разбивка:
- День 1: fork/re-scaffold архитектуры YaGEOна Claude Code skill формат, перевод команд на RU + адаптация scoring под ЭПОС
- День 2: `geo-yandex-citability` sub-skill — scorer ЭПОС по странице (parse HTML, score 0-100 по каждому из 4 критериев)
- День 3: `geo-yandex-crawlers` — robots.txt checker для YandexBot, YandexAdditionalBot, YandexImages, YandexMobileBot + warnings если блокируем
- День 4: `geo-yandex-schema` — генератор Yandex-friendly JSON-LD (Organization с sameAs под VK/OK/Telegram, Article с author E-E-A-T), валидатор
- День 5: PDF-репорт (по шаблону YaGEO, но с brand "для Алисы AI"), README, install.sh, Russian-language commands `/yageo audit`, `/yageo check`, etc.

**Опционально Phase 2 (неделя +1):** Webmaster-scraper через Puppeteer (риск: Яндекс может менять DOM) или wait-for-API если Яндекс выпустит.

**Q7: Аудитория на Gitverse?**
Gitverse (СберТех) — 2024+. Открытых данных об активных dev-аккаунтах мало. В нашем sweep доминировал (7 хостов) — больше за счёт long-tail SEO сниппетов. Топ-проекты типа coderun/godot-yandex-ads имеют десятки звёзд, не сотни. **Оценка: <50 звёзд за 3 мес** реалистично; 200+ звёзд — только если пойдёт вирусная публикация через vc.ru/Habr. **GitHub-публикация mirror'ом** даст основную массу звёзд (западное SEO-комьюнити интересуется non-Google GEO).

---

# What Brave Found I Didn't Know

1. **ЭПОС как публичная аббревиатура** — Яндекс действительно опубликовал названный критерий. До sweep я предполагал, что Яндекс может дать только размытые рекомендации. Ashmanov материал раскрывает каждую букву — можно напрямую кодировать в scorer.
2. **46.5M user reach + 14M sources cited за Jan-Feb 2026** — число сайтов-источников огромное, это НЕ узкий топ-1000. Gosmax.ru в нишевом запросе "боты MAX" имеет неплохие шансы.
3. **ИИ-блендер и Alice AI Search как отдельная модель** — Алиса делает *несколько* запросов в Поиск, значит классический SEO ранкинг критичен (Alice отбирает сверху). Наш существующий Astro SSG + sitemap + schema — хорошая база.
4. **YandexAdditionalBot** — новый craulwer, упоминается в news.inhouse-marketing. Нужен check. В нашем robots.txt пока нет специфики — вероятно, всё разрешено по умолчанию, но warning в skill будет ценен.
5. **Yandex Commerce Protocol (YCP)** — новый стандарт для покупок через Алису. Для gosmax.ru напрямую неактуально (мы не e-commerce), но в skill можно добавить детектор/генератор для будущих e-commerce клиентов.
6. **API Webmaster для Alice-видимости в планах, но не сейчас.** Значит наша обёртка должна быть stateless (screen-scraping опционально, не критично для MVP).

---

# Build plan — `geo-seo-yandex` skill

## Architecture (inherit from YaGEO, remap)

```
geo-seo-yandex/
├── yageo/SKILL.md                     # главный оркестратор с командами /yageo *
├── skills/
│   ├── yageo-epos-score/              # scorer по 4 критериям ЭПОС
│   ├── yageo-crawlers/                # YandexBot + YandexAdditional check
│   ├── yageo-schema/                  # Yandex-friendly JSON-LD генератор
│   ├── yageo-webmaster-readiness/     # sitemap.xml, robots.txt, verify
│   ├── yageo-content-depth/           # Полезность + Содержательность тесты
│   ├── yageo-author-eeat/             # Экспертность — author markup check
│   └── yageo-report/                  # PDF/markdown report на русском
├── agents/
│   ├── yageo-epos.md                  # parallel subagent
│   ├── yageo-technical.md
│   └── yageo-content.md
├── schema/
│   ├── ru-organization.json           # с sameAs под VK/OK/Telegram/Dzen
│   ├── ru-article-author.json         # Author + Credentials
│   └── ru-product.json
├── scripts/
│   ├── epos_scorer.py                 # ядро scoring
│   ├── yandex_crawler_check.py        # robots.txt + IP проверка
│   └── generate_yageo_pdf.py
├── install.sh / install-win.sh
└── README.md (RU + EN)
```

## Команды

| Команда | Что делает |
|---------|-----------|
| `/yageo audit <url>` | Полный аудит с parallel subagents |
| `/yageo epos <url>` | Score 0-100 по 4 критериям ЭПОС |
| `/yageo crawlers <url>` | Проверка доступности YandexBot + YandexAdditionalBot |
| `/yageo schema <url>` | JSON-LD валидация + генерация под RU-реалии |
| `/yageo webmaster <url>` | Чеклист готовности для Вебмастера |
| `/yageo report <url>` | PDF-отчёт на русском |

## Dogfood: gosmax.ru как pilot

Сразу применить skill на gosmax.ru:
- `/yageo audit https://gosmax.ru` — получить baseline
- Применить рекомендации к 381 странице (массовые фиксы из скрипта)
- Через 2-3 недели собрать Webmaster Alice AI метрики как evidence — кейс для README/блога

## Publication

**GitHub**: `github.com/<user>/geo-seo-yandex` — primary, английская README, русская опционально.
**Gitverse**: mirror, русская README primary. Важно для SEO-выдачи в ru-сегменте.
**Хабр/vc.ru статья** после первых результатов с gosmax.ru — PR-триггер. Заголовок: «Open-source Claude Code skill для Яндекс.Алисы AI — первые результаты на каталоге из 400 ботов».

---

# Gitverse star potential — honest assessment

- **Prior (calibrated)**: ≥50 stars за 3 мес ≈ 0.35 (выше моего pre-research прогноза 0.20)
- **Drivers вверх**: first-mover в AI-GEO-Yandex нише на Gitverse; русские разработчики активно переезжают с GitHub; YaGEO`YaGEO` оригинал имеет 1000+ stars на GitHub — ниша проверена
- **Drivers вниз**: Gitverse аудитория молодая, SEO-публика больше сидит в Telegram-каналах чем на Gitverse; Claude Code в RU-сегменте не массовый — придётся объяснять что это
- **Mitigation**: GitHub mirror ловит большую часть трафика; Gitverse — как PR-плашка «поддерживаем RU-платформы». Статья на Habr даст 1000+ просмотров → 30-100 stars реально.

---

# Risks

1. **Яндекс изменит ЭПОС / алгоритм Alice AI** → скилл устаревает. Mitigation: версия v0.1, scoring-логика параметризуется через конфиг, обновления = merge PRs.
2. **Webmaster API не выпустят** → screen-scraping через Puppeteer — хрупкий. Mitigation: MVP без скрейпинга, только рекомендации от контента + CLI хелперы. Scraper — optional module v0.2.
3. **Pixelplus / Ashmanov сделают свой open-source первыми** → мы теряем first-mover. Вероятность низкая (они монетизируют, зачем open-source'ить core IP). Mitigation: shipped за 5 дней, не тянуть.
4. **Gosmax.ru как pilot недостаточно контента под ЭПОС** — у нас карточки ботов с коротким описанием и auto-gen body из `expand_bodies.py`. Под **Оригинальность** и **Экспертность** слабо. Mitigation: блог-раздел гайдов по Max-ботам, expert author schema, расширение body до 800-1500 слов на топ-ботов.

---

# Immediate next steps (по приоритетам)

**Prio 1 (этот спринт, gosmax.ru пайплайн):**
- [ ] Проверить что `gosmax.ru` добавлен в Яндекс.Вебмастер с подтверждёнными правами → дождаться накопления данных в «Видимость сайта в Алисе AI» (первые 2-3 недели)
- [ ] Проверить `robots.txt` на отсутствие блокировок для `YandexBot` и `YandexAdditionalBot`

**Prio 2 (build-ветка, следующая неделя):**
- [ ] Fork YaGEOкак скелет → создать отдельный репо `geo-seo-yandex`
- [ ] MVP dev 5 дней по плану выше
- [ ] Публикация на GitHub + Gitverse
- [ ] Apply на gosmax.ru, собрать before/after метрики за 2-3 недели

**Prio 3 (PR-волна, через месяц):**
- [ ] Статья на Habr или vc.ru с результатами
- [ ] Отправить в Яндекс.Вебмастер evangelism-канал (Михаил Сливинский — амбассадор платформ)

---

# Disconfirming sweep (Phase 6)

3 дополнительных запроса, чтобы поймать tooling, которое я мог пропустить:

**q1: `"yandex webmaster api" python pip install LLM`** → нашёл `yandex-webmaster-api` PyPI (bzdvdn, MIT, v0.0.3 Mar 2024). 30+ методов: host management, sitemaps, indexing stats, search query history, recrawl. **Проверено WebFetch — НЕТ методов связанных с Alice AI / generative search / efficiency**. Полезно как dependency для classic-Webmaster модуля нашего скилла (verify sitemap, pull search queries) — не конкурент.

**q2: `"YandexGPT" site:pypi.org OR site:npmjs.com SEO audit`** → `yandexgpt-python`, `yandex-chain`, `yandex_gpt`, `@langchain/yandex` — все LLM wrapper'ы (не SEO). Bonus discovery: «Lighthouse for AI SEO», «Keploy SEO Audit Claude Code skill» — формат Claude Code skill для SEO уже emerging (под EN-рынок). Наш skill попадает в тренд.

**q3: `GEO "E-E-A-T" русский "ЭПОС" скрипт open-source`** → **0 results.** Никто не кодировал ЭПОС в open-source script/skill. Идея свободна.

**Итог disconfirming**: первичный вердикт BUILD подтверждён. Плюс нашли полезную dependency (`yandex-webmaster-api` pip package). Минус — ничего принципиально не опровергло гипотезу «первый на рынке».

---

# Calibration update (Phase 7)

Prior → Posterior:
- P(production-ready tool exists) = 0.15 → **0.02** (подтверждено Brave sweep, 0 хитов)
- P(RU-guide ≥1 exists) = 0.50 → **0.98** (6+ высококачественных гайдов найдено)
- P(Webmaster API for Alice data) = 0.25 → **0.15** (Яндекс прямо ответил «рассматриваем», значит не сейчас; но движение в эту сторону есть)
- P(Gitverse ≥50 stars in 3 мес) = 0.20 → **0.35** (наша ниша чище чем думал; но всё ещё непредсказуемо)
- P(build-skill ≤5 days realistic) = 0.60 → **0.70** (YaGEOскелет даёт 60% структуры, ЭПОС — публичная фреймворк, не надо reverse-engineer'ить)

Самая большая переоценка — существование tooling (я был оптимистичнее чем реальность). Подтверждение: в RU-сегменте open-source SEO tooling традиционно отстаёт на 1-2 года от западного. GEO появилось в 2024, Alice AI в 2025-2026 — действительно first-mover window открыто.

---

# Sources (cited)

Official (Yandex):
- https://yandex.ru/support/webmaster/ru/service/alice-answers
- https://webmaster.yandex.ru/blog/efficiency-alice
- https://github.com/yandex-cloud/yandex-ai-studio-sdk

Industry authority:
- https://www.ashmanov.com/education/articles/alisa-ai-yandeksa-menyaet-pravila-igry-obnovleniya-poiska-i-novye-instrumenty/
- https://pixelplus.ru/ai-seo/alisa/
- https://www.rush-agency.ru/prodvizhenie-sajta-v-ai/yandex-alisa/

News/context:
- https://habr.com/ru/news/1020242/
- https://www.kommersant.ru/doc/8570440
- https://news.inhouse-marketing.ru/2026/04/22/vidimost-saita-v-alise-ai-novyi-instryment-v-iandeks-vebmastere/
- https://vc.ru/ai/2855487-yandeks-dobavil-instrument-dlya-otslezhivaniya-upominaniy-saytov-v-alise-ai

Reference:
- https://github.com/YaGEO(original template)
- https://robotstxt.com/ai (YandexAdditionalBot context)
- https://pypi.org/project/yandex-webmaster-api/ (classic Webmaster API Python wrapper, useful as dependency)
- https://www.npmjs.com/package/@langchain/yandex (LangChain.js integration with YandexGPT — referenced, not core)

---

# Retrospective

- **Budget spent**: ~60 min (Phase 0+1 brief + Phase 2 sweep + Phase 3 triage + Phase 3.5 checkpoint + Phase 4 WebFetch 5 sources + Phase 5 synthesis + Phase 6 disconfirming + Phase 7 calibration) — в рамках cap 60-90 min.
- **What worked**: Brave sweep дал 60% нужных данных в одном проходе; WebFetch топ-5 добил детали ЭПОС + mechanics Alice AI; disconfirming sweep добавил ценную находку (yandex-webmaster-api).
- **What could improve**: 2 из 10 первоначальных queries дали 0 результатов — регекс-стиль queries можно было сразу адаптировать под Brave's stopword-behavior. Mitigation на будущее — после первого sweep проверять warnings и сразу re-query альтернативными формулировками.
- **Biggest surprise**: Яндекс опубликовал ЭПОС и инструмент настолько недавно (17 дней назад). Это window of opportunity для first-mover — если ждать 3-6 месяцев, рынок закроется.
- **Unresolved**: Webmaster API для Alice данных — Яндекс «рассматривает». Если выпустят через 1-2 месяца, скилл v0.2 добавит auto-pull метрик. Следить за `webmaster.yandex.ru/blog`.
