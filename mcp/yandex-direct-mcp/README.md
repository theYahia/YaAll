# @theyahia/yandex-direct-mcp

MCP-сервер для API Яндекс.Директ — управление контекстной рекламой из любого MCP-клиента (Claude, Cursor и др.): кампании, группы, объявления, ключевые слова, **ставки**, **минус-фразы**, статистика, баланс. **20 инструментов.**

[![npm](https://img.shields.io/npm/v/@theyahia/yandex-direct-mcp)](https://www.npmjs.com/package/@theyahia/yandex-direct-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> Деньги — **в рублях** (бюджеты, ставки на вводе и выводе); сервер сам конвертирует в микроединицы API. Поддержаны **песочница** для безопасного теста и **агентский режим** (Client-Login).

## Установка

### Claude Desktop

```json
{
  "mcpServers": {
    "yandex-direct": {
      "command": "npx",
      "args": ["-y", "@theyahia/yandex-direct-mcp"],
      "env": {
        "YANDEX_DIRECT_TOKEN": "ваш_токен"
      }
    }
  }
}
```

### Claude Code

```bash
claude mcp add yandex-direct -e YANDEX_DIRECT_TOKEN=ваш_токен -- npx -y @theyahia/yandex-direct-mcp
```

## Конфигурация (переменные окружения)

| Переменная | Обязательна | Назначение |
|------------|:-----------:|------------|
| `YANDEX_DIRECT_TOKEN` | да | OAuth-токен Яндекс.Директ |
| `YANDEX_DIRECT_SANDBOX` | нет | `1` — работа в [песочнице](https://yandex.ru/dev/direct/doc/concepts/sandbox.html) (изолированные данные, без трат). Тот же токен, отличается только URL |
| `YANDEX_DIRECT_LOGIN` | нет | Логин клиента для агентских токенов (заголовок `Client-Login`). Обязателен, если токен агентский |

### Как получить токен

OAuth-токен выпускается для приложения, зарегистрированного в [Яндекс OAuth](https://oauth.yandex.ru/), с доступом к API Директа. Подробности — [регистрация приложения и получение токена](https://yandex.ru/dev/direct/doc/start/token.html). Доступ к API нужно [запросить в интерфейсе Директа](https://yandex.ru/dev/direct/doc/start/step1.html).

## ⚠️ Внимание: реальные траты

Инструменты `create_campaign`, `create_text_ad`, `add_keywords`, `set_keyword_bids` и др. меняют боевой рекламный аккаунт и могут **расходовать деньги**. Для отладки сценариев включайте песочницу (`YANDEX_DIRECT_SANDBOX=1`).

## Инструменты (20)

**Кампании**

| Инструмент | Описание |
|------------|----------|
| `list_campaigns` | Список кампаний (фильтр по статусу/типу, пагинация) |
| `get_campaign` | Детальная информация о кампании по ID |
| `create_campaign` | Создать кампанию (бюджет в рублях, выбор стратегии) |
| `update_campaign` | Обновить название/бюджет и/или статус (SUSPEND/RESUME/ARCHIVE/UNARCHIVE) |

**Группы объявлений**

| Инструмент | Описание |
|------------|----------|
| `list_ad_groups` | Группы объявлений выбранных кампаний |
| `create_ad_group` | Создать группу с таргетингом по регионам |
| `delete_ad_groups` | Удалить группы по ID |
| `set_ad_group_negative_keywords` | Задать минус-фразы группы |

**Объявления**

| Инструмент | Описание |
|------------|----------|
| `list_ads` | Объявления в группах |
| `create_text_ad` | Создать текстовое объявление (≤56/≤30/≤81) |
| `update_text_ad` | Обновить заголовок/текст/ссылку |
| `manage_ads` | suspend/resume/archive/unarchive/moderate/delete |

**Ключевые слова и ставки**

| Инструмент | Описание |
|------------|----------|
| `list_keywords` | Ключевые фразы в группах (ставки в рублях) |
| `add_keywords` | Добавить ключевые фразы |
| `set_keyword_bids` | Установить ставки (поиск/сети, рубли) на фразах/группах/кампаниях |
| `manage_keywords` | suspend/resume/delete |
| `set_campaign_negative_keywords` | Задать минус-фразы кампании |

**Статистика, аккаунт, справочники**

| Инструмент | Описание |
|------------|----------|
| `get_statistics` | Статистика за период (показы, клики, расход, CTR, CPC) |
| `get_account_balance` | Баланс аккаунта (Live API v4) |
| `get_regions` | Справочник кодов регионов (225 = Россия) |

## Примеры запросов

```
Покажи все активные рекламные кампании
Создай кампанию "Летняя распродажа" с бюджетом 5000 ₽/день, старт 2026-05-01
Установи ставку 25 ₽ на ключевые фразы 111 и 222
Добавь минус-фразы "бесплатно", "скачать" в кампанию 12345
Какая статистика у кампаний 12345 и 67890 за последнюю неделю?
Найди код региона для Новосибирска
Покажи баланс аккаунта
```

## Разработка

```bash
npm install
npm run build      # tsc → dist/
npm test           # vitest (моки fetch)
npm run dev        # tsx src/index.ts
```

## Лицензия

MIT
