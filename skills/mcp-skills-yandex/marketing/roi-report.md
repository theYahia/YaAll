---
id: roi-report
name: "ROI по каналам"
version: 1.0.0
category: marketing
persona: [маркетолог, руководитель маркетинга]
servers: ["@theyahia/roistat-mcp", "@theyahia/calltouch-mcp", "@theyahia/yandex-metrika-mcp"]
env_required: [ROISTAT_API_KEY, CALLTOUCH_TOKEN, CALLTOUCH_SITE_ID, YANDEX_METRIKA_TOKEN]
tags: [roi, аналитика, каналы, roistat, calltouch, метрика]
complexity: multi-server
time_saving: "3 часа ручного сбора → 2 минуты"
premium: false
---

# ROI по каналам

## Что делает
Собирает данные из Roistat, Calltouch и Яндекс.Метрики, объединяет в единый отчёт ROI по рекламным каналам с разбивкой по расходам, заявкам, звонкам и выручке.

## Требуемые серверы
- `npx -y @theyahia/roistat-mcp` — аналитика визитов, заявок и ROI
- `npx -y @theyahia/calltouch-mcp` — коллтрекинг и статистика звонков
- `npx -y @theyahia/yandex-metrika-mcp` — трафик и источники

## Переменные окружения
| Переменная | Сервер | Где получить |
|---|---|---|
| `ROISTAT_API_KEY` | roistat-mcp | Личный кабинет Roistat → Настройки → API |
| `CALLTOUCH_TOKEN` | calltouch-mcp | Личный кабинет Calltouch → Настройки |
| `CALLTOUCH_SITE_ID` | calltouch-mcp | Личный кабинет Calltouch → ID сайта |
| `YANDEX_METRIKA_TOKEN` | yandex-metrika-mcp | oauth.yandex.ru → Яндекс.Метрика |

## Шаги
1. Вызвать `get_analytics` (roistat) за выбранный период — получить визиты, заявки, выручку, ROI по каналам
2. Вызвать `get_statistics` (calltouch) за тот же период — получить статистику звонков по источникам
3. Вызвать `get_traffic_sources` (yandex-metrika) за тот же период — получить разбивку трафика по каналам
4. Объединить данные по каналам: расход, визиты, заявки, звонки, выручка, ROI
5. Сформировать таблицу с сортировкой по ROI (от лучшего к худшему)
6. Дать рекомендации: какие каналы масштабировать, какие отключить

## Пример использования
«Сделай отчёт ROI по всем рекламным каналам за март 2026»

## Обработка ошибок
- Если Roistat недоступен → сформировать отчёт на основе Calltouch + Метрики, предупредить об отсутствии данных по выручке
- Если Calltouch недоступен → исключить звонки из отчёта, отметить в примечании
- Если период слишком большой (>90 дней) → разбить на месячные подзапросы

## Ожидаемый результат
Таблица ROI по каналам с колонками: канал, расход, визиты, заявки, звонки, выручка, ROI%. Рекомендации по оптимизации бюджета.
