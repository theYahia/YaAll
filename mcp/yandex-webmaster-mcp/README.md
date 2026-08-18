# @theyahia/yandex-webmaster-mcp

MCP-сервер для API Яндекс.Вебмастер — сайты, индексация, поисковые запросы, sitemaps,
диагностика и переобход. 13 инструментов, вывод в компактном Markdown (или сыром JSON).

[![npm](https://img.shields.io/npm/v/@theyahia/yandex-webmaster-mcp)](https://www.npmjs.com/package/@theyahia/yandex-webmaster-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Установка

### Claude Desktop

```json
{
  "mcpServers": {
    "yandex-webmaster": {
      "command": "npx",
      "args": ["-y", "@theyahia/yandex-webmaster-mcp"],
      "env": {
        "YANDEX_WEBMASTER_TOKEN": "ваш_oauth_токен"
      }
    }
  }
}
```

### Claude Code

```bash
claude mcp add yandex-webmaster -e YANDEX_WEBMASTER_TOKEN=ваш_oauth_токен -- npx -y @theyahia/yandex-webmaster-mcp
```

## Авторизация

Нужен только **`YANDEX_WEBMASTER_TOKEN`** — OAuth-токен с правом `webmaster:api`.
`user_id` определяется автоматически через `GET /user/`, задавать его руками не нужно.

Как получить токен:

1. Создайте приложение на <https://oauth.yandex.ru/> и выдайте ему право
   **Яндекс.Вебмастер (`webmaster:api`)**.
2. Получите OAuth-токен по
   [инструкции Яндекса](https://yandex.ru/dev/id/doc/ru/access) и положите его в
   `YANDEX_WEBMASTER_TOKEN`.

### Переменные окружения

| Переменная                 | Обяз. | Назначение                                                               |
| -------------------------- | :---: | ------------------------------------------------------------------------ |
| `YANDEX_WEBMASTER_TOKEN`   |  да   | OAuth-токен с правом `webmaster:api`                                     |
| `YANDEX_WEBMASTER_USER_ID` |  нет  | Числовой user ID. Если не задан — определяется автоматически             |
| `PORT`                     |  нет  | Порт HTTP-режима (по умолчанию `3100`)                                   |
| `MCP_ALLOWED_HOSTS`        |  нет  | Разрешённые Host для HTTP (CSV). `*` — отключить защиту от DNS-rebinding |
| `MCP_HTTP_AUTH_TOKEN`      |  нет  | Если задан — требует `Authorization: Bearer <token>` на `POST /mcp`      |

## Инструменты (13)

| Инструмент                   | Описание                                                               |
| ---------------------------- | ---------------------------------------------------------------------- |
| `get_hosts`                  | Список сайтов: URL, статус подтверждения                               |
| `get_user_info`              | Данные аккаунта (user_id)                                              |
| `get_popular_search_queries` | Поисковые запросы по сайту: показы, клики, средняя позиция (per-query) |
| `get_query_analytics`        | Агрегированный тренд трафика во времени (НЕ per-query)                 |
| `get_search_queries`         | ⚠️ deprecated — алиас `get_popular_search_queries`                     |
| `get_indexing`               | Сводка индексации сайта                                                |
| `get_indexing_history`       | Тренд проиндексированных/исключённых страниц                           |
| `submit_url`                 | Отправить URL на переобход (расходует дневную квоту)                   |
| `get_recrawl_quota`          | Остаток дневной квоты переобхода                                       |
| `get_recrawl_task`           | Статус задачи переобхода по `task_id`                                  |
| `get_sitemaps`               | Список sitemap'ов сайта                                                |
| `get_diagnostics`            | Диагностика сайта: ошибки обхода, DNS, проблемы сервера                |
| `get_important_urls`         | Мониторинг важных URL                                                  |

У каждого инструмента есть параметр `format`: `markdown` (по умолчанию, компактно) или
`json` (сырой ответ API).

## Примеры запросов

```
Какие сайты у меня в Вебмастере?
По каким запросам находят мой сайт за последнюю неделю?
Сколько страниц проиндексировано и есть ли деиндексация?
Отправь https://example.com/new-page на переобход и покажи остаток квоты.
```

## HTTP-режим

Помимо stdio сервер умеет работать по Streamable HTTP:

```bash
YANDEX_WEBMASTER_TOKEN=... npx @theyahia/yandex-webmaster-mcp --http
# POST /mcp  — MCP endpoint
# GET  /health — { "status": "ok", "version": "..." }
```

По умолчанию включена защита от DNS-rebinding (разрешены только `localhost`/`127.0.0.1`).
Для доступа с другого хоста задайте `MCP_ALLOWED_HOSTS`. Токен в HTTP-режиме общий
(берётся из окружения) — multi-tenancy не поддерживается.

## Разработка

```bash
npm install
npm run dev          # запуск из исходников (tsx)
npm test             # тесты (vitest)
npm run typecheck    # tsc --noEmit (src + tests)
npm run lint         # eslint
npm run format       # prettier --check
npm run build        # сборка в dist/
```

## Лицензия

MIT
