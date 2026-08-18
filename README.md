# YaAll

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![npm](https://img.shields.io/npm/v/@theyahia/yandex-direct-mcp?label=yandex-direct-mcp)](https://www.npmjs.com/package/@theyahia/yandex-direct-mcp)
[![npm](https://img.shields.io/npm/v/@theyahia/yandex-metrika-mcp?label=yandex-metrika-mcp)](https://www.npmjs.com/package/@theyahia/yandex-metrika-mcp)

Весь яндексовский слой для MCP в одном репозитории: **десять своих MCP-серверов**
(104 инструмента), **четыре набора скиллов** Claude Code и материалы **двух
официальных наборов** серверов от Яндекса.

**Это канон для всего, что лежит в `mcp/` и `skills/`.** Отдельные репозитории, из
которых часть этого собрана, заархивированы и указывают сюда. Разработка идёт здесь,
обычными коммитами: ни сабмодулей, ни сабтри — просто файлы.

---

## Быстрый старт

Все свои серверы опубликованы в npm и запускаются без установки:

```jsonc
// ~/.claude.json  или  claude_desktop_config.json
{
  "mcpServers": {
    "yandex-direct":  { "command": "npx", "args": ["-y", "@theyahia/yandex-direct-mcp"],
                        "env": { "YANDEX_DIRECT_TOKEN": "..." } },
    "yandex-metrika": { "command": "npx", "args": ["-y", "@theyahia/yandex-metrika-mcp"],
                        "env": { "YANDEX_METRIKA_TOKEN": "..." } }
  }
}
```

Переменные окружения у каждого сервера свои — точный список в его `README.md`.
Скиллы из `skills/` копируются в `~/.claude/skills/` и вызываются как `/имя-скилла`.

---

## `mcp/` — свои MCP-серверы, MIT

| Каталог | Инструментов | Версия | Что делает |
|---|---:|---|---|
| `yandex-direct-mcp` | 20 | 4.0.1 | Директ: кампании, группы, объявления, ключевые слова, ставки, минус-фразы, статистика, баланс. Ввод-вывод в рублях, поддержка песочницы |
| `yandex-metrika-mcp` | 15 | 2.1.1 | Метрика: счётчики, цели, отчёты, логи, источники трафика, топ страниц |
| `yandex-webmaster-mcp` | 13 | 2.0.0 | Вебмастер: хосты, поисковые запросы, индексация, переобход, карты сайта, диагностика |
| `yandex-tracker-mcp` | 12 | 1.0.1 | Трекер: задачи, очереди, ворклоги, доски |
| `yandex-360-mcp` | 10 | 1.0.1 | Яндекс 360: почта, календарь, диск, пользователи |
| `yandex-maps-mcp` | 10 | 1.0.1 | Карты: геокодинг, маршруты, поиск мест |
| `appmetrica-mcp` | 8 | 1.0.1 | AppMetrica: мобильная аналитика, когорты, пуши |
| `yandexgpt-mcp` | 8 | 3.0.1 | YandexGPT: генерация, эмбеддинги, суммаризация |
| `yandex-speechkit-mcp` | 5 | 1.1.0 | SpeechKit: распознавание и синтез речи |
| `yandex-search-mcp` | 3 | 1.0.0 | **Wordstat**: `topRequests`, `regions`, `dynamics` — статистика поисковых запросов |

Все опубликованы в npm под `@theyahia/*`.

**`yandex-search-mcp` стоит отдельного слова.** Статистики поисковых запросов нет ни в
одном официальном сервере Яндекса: оба его поисковых сервера отдают только веб-поиск,
то есть «найди страницы в интернете». Wordstat при этом живёт в том же Search API —
эндпоинт `v2/wordstat/topRequests`, тот же ключ и тот же каталог. Яндекс просто не
завернул его в MCP; этот сервер закрывает пробел.

## `skills/` — скиллы Claude Code, MIT

| Каталог | Что делает |
|---|---|
| `yageo/` | Аудит сайта по ЭПОС — Экспертность, Полезность, Оригинальность, Содержательность. Оценивает, попадут ли страницы в ответы Алисы и Yandex AI Search. Питон: `epos_scorer.py`, `audit.py`, `batch_audit.py`, `content_depth.py`, `json_ld_validator.py`, `yandex_crawler_check.py`, `generate_yageo_pdf.py`, плюс четыре субагента и пять JSON-LD-схем под РФ. Требует Python ≥3.12 и десяток пакетов, см. `pyproject.toml` |
| `wordstat-sweep/` | Два режима поверх Wordstat API. **Gate** — валидация спроса под нишу до разработки, вердикт GO / MAYBE-PILOT / RED/PIVOT по объёму top-3 seed-фраз, голая стандартная библиотека. **SEO-ядро** — `collect_semantics.py`, сборка семантики перед написанием контента |
| `yageo-audit/` | Прогон уже задеплоенного сайта через ЭПОС-скорер, `yageo_gate.py`. Парный к `wordstat-sweep`: тот работает до контента, этот после деплоя |
| `mcp-skills-yandex/` | Девять готовых сценариев поверх серверов выше: аудит Директа, SEO-аудит, недельный отчёт по трафику, ROI, описания товаров, голосовой бот, генерация контента, суммаризация документов, расшифровка звонков |

## `upstream/` — материалы Яндекса, Apache 2.0

| Каталог | Что это | Канон |
|---|---|---|
| `yandex-cloud-mcp/` | **Документация** десяти хостовых MCP-серверов Yandex Cloud: `apigateway`, `containers`, `datacatalog-consumer`, `documentation`, `functions`, `mcpgateway`, `search`, `toolkit`, `triggers`, `workflows`. Исходников в репозитории Яндекса нет — серверы работают на его стороне, доступ через клиент `@yandex-cloud/mcp` или streamable HTTP | [yandex-cloud/mcp](https://github.com/yandex-cloud/mcp) |
| `yandex-search-mcp-server/` | Отдельный сервер Yandex Search API на питоне. Два инструмента: `ai_search_with_yazeka` и `web_search`; в README самого Яндекса они названы `*_post`, это опечатка апстрима. Есть remote-подключение по SSE — ключ и каталог передаются заголовками | [yandex/yandex-search-mcp-server](https://github.com/yandex/yandex-search-mcp-server) |

Здесь канон **не** переезжает: репозитории принадлежат Яндексу, он продолжает их
развивать. В `upstream/` лежит снимок на дату из `ИСТОЧНИКИ.md`. Править его на месте
бессмысленно — правка исчезнет при следующем обновлении снимка. Нужно поправить код
Яндекса — pull request в его репозиторий.

---

## Ключи и доступы

Общего ключа на всю сборку нет, и это главный источник путаницы. Три разных механизма:

| Что | Как авторизуется |
|---|---|
| `skills/wordstat-sweep`, `skills/yageo-audit` | `YANDEX_SEARCH_API_KEY` + `YANDEX_FOLDER_ID` |
| `upstream/yandex-search-mcp-server` | Те же значения, но переменные называются `SEARCH_API_KEY` и `FOLDER_ID` — **без префикса** `YANDEX_`. В remote-режиме вместо них заголовки `ApiKey` и `FolderId` |
| `upstream/yandex-cloud-mcp` | Ключом не пользуется вовсе: OAuth в браузере по умолчанию, либо `yc` CLI, либо IAM-токен в `Authorization: Bearer` плюс заголовок `Folder-Id` |
| `mcp/*` | У каждого свой токен продукта — Директа, Метрики, Вебмастера и так далее. См. `README.md` внутри каталога |

**Роль сервисного аккаунта тоже зависит от того, чем пользуешься**, и одного правильного
ответа нет: `wordstat-sweep` требует `search-api.executor`, документация Яндекса к
`yandex-search-mcp-server` называет `search-api.editor` и scope `yc.search-api.execute`,
а его же `search-mcp-server` в Yandex Cloud — `search-api.webSearch.user`.

Частая диагностика: HTTP 403 `Permission denied` в Search API чаще означает, что на
платёжном аккаунте нет денег, а не что роли не хватает.

## Что сознательно вне сборки

- **Свой `theYahia/yandex-cloud-mcp`.** Имя в точности совпадает с каталогом
  `upstream/yandex-cloud-mcp`, который на самом деле от `yandex-cloud/mcp`. Два
  одноимённых каталога породили бы вопрос «какой канон» — ровно ту болезнь, от которой
  эта сборка лечит. Официальные десять серверов уже здесь.
- **`WWmcp`** — экосистема из 114 MCP-серверов для развивающихся рынков. Яндекс там
  один вендор из многих; сюда приехал только `servers/yandex-search`.
- **Остальные 31 скилл из `theYahia/mcp-skills`** — не про Яндекс.

## Лицензии

Сборка, `mcp/` и `skills/` — MIT, см. `LICENSE`. Материалы Яндекса в `upstream/` —
Apache 2.0, LICENSE-файлы сохранены внутри каждого каталога, атрибуция в `NOTICE`.
Ни один LICENSE не удалён и не переписан, изменений в код Яндекса не вносилось.

Происхождение каждого каталога, точные коммиты снимков и порядок обновления —
в `ИСТОЧНИКИ.md`.

## Правки

Правки в `mcp/` и `skills/` — обычным pull request сюда. Правки в `upstream/`
**не принимаются**: это чужой код, изменения затрутся при следующем обновлении
снимка. Нашли баг у Яндекса — заводите issue в его репозитории по ссылке из таблицы.
