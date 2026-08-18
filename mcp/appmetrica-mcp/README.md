# @theyahia/appmetrica-mcp

MCP-сервер для AppMetrica API — мобильная аналитика, отчёты, когорты, профили, push-кампании, краши. 8 инструментов.

[![npm](https://img.shields.io/npm/v/@theyahia/appmetrica-mcp)](https://www.npmjs.com/package/@theyahia/appmetrica-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Установка

### Claude Desktop

```json
{
  "mcpServers": {
    "appmetrica": {
      "command": "npx",
      "args": ["-y", "@theyahia/appmetrica-mcp"],
      "env": {
        "APPMETRICA_TOKEN": "ваш_токен"
      }
    }
  }
}
```

### Claude Code

```bash
claude mcp add appmetrica -e APPMETRICA_TOKEN=ваш_токен -- npx -y @theyahia/appmetrica-mcp
```

## Авторизация

`APPMETRICA_TOKEN` — OAuth-токен AppMetrica.

## Инструменты (8)

| Инструмент | Описание |
|------------|----------|
| `list_applications` | Список приложений |
| `get_report` | Отчёт по метрикам (sessions, users, events) за период |
| `get_cohorts` | Когортный анализ (retention, sessions per user) |
| `get_profiles` | Профили пользователей с фильтрацией |
| `get_push_campaigns` | Список push-кампаний |
| `send_push` | Отправить push-уведомление |
| `get_deeplinks` | Диплинки приложения |
| `get_crash_report` | Отчёт о крашах за период |

## Примеры запросов

```
Покажи все мои приложения в AppMetrica
Какая статистика по сессиям и пользователям за январь для приложения 12345?
Покажи retention когорт за последний месяц
Сколько крашей было за неделю?
Отправь push "Новая версия!" группе 10 в приложении 12345
```

## Лицензия

MIT
