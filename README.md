# YaAll

Весь яндексовский слой в одном месте: два официальных MCP-сервера от Яндекса и четыре
собственных инструмента — MCP под Директ и Метрику, скилл YaGEO и Wordstat-гейт.

**Это канон для всего, что лежит в `own/`.** Отдельные репозитории, из которых оно
собрано, заархивированы и указывают сюда. Разработка идёт здесь, обычными коммитами:
никаких сабмодулей, сабтри и прочей машинерии — просто файлы.

---

## `own/` — своё, MIT

| Каталог | Что это |
|---|---|
| `own/yageo/` | Скилл Claude Code: аудит сайта по ЭПОС — Экспертность, Полезность, Оригинальность, Содержательность. Оценивает, попадут ли страницы в ответы Алисы и Yandex AI Search. Питон: `epos_scorer.py`, `audit.py`, `batch_audit.py`, `json_ld_validator.py`, `yandex_crawler_check.py`, плюс четыре субагента и пять JSON-LD схем под РФ. |
| `own/yandex-direct-mcp/` | MCP-сервер Яндекс.Директа, TypeScript, 20 инструментов: кампании, группы, объявления, ключевые слова, ставки, минус-слова, статистика, баланс. Ввод-вывод в рублях, поддержка песочницы. Опубликован в npm как `@theyahia/yandex-direct-mcp`. |
| `own/yandex-metrika-mcp/` | MCP-сервер Яндекс.Метрики, TypeScript: счётчики, цели, отчёты, логи, источники трафика, топ страниц. |
| `own/wordstat-sweep/` | Скилл поверх Wordstat API: валидация спроса под нишу до разработки. Вердикт GO / MAYBE-PILOT / RED по объёму top-3 seed-фраз. Голая стандартная библиотека питона, ноль зависимостей. |

## `upstream/` — код Яндекса, Apache 2.0

| Каталог | Что это | Канон |
|---|---|---|
| `upstream/yandex-cloud-mcp/` | Десять MCP-серверов Yandex Cloud: `apigateway`, `containers`, `datacatalog-consumer`, `documentation`, `functions`, `mcpgateway`, `search`, `toolkit`, `triggers`, `workflows`. Клиент публикуется как `@yandex-cloud/mcp`. | [yandex-cloud/mcp](https://github.com/yandex-cloud/mcp) |
| `upstream/yandex-search-mcp-server/` | Отдельный сервер Yandex Search API на питоне. Два инструмента: `ai_search_post` и `web_search_post`. Есть remote-подключение по SSE, ключ и folder передаются заголовками. | [yandex/yandex-search-mcp-server](https://github.com/yandex/yandex-search-mcp-server) |

Здесь канон **не** переезжает: репозитории принадлежат Яндексу, он продолжает их
развивать. В `upstream/` лежит снимок, снятый на дату из `ИСТОЧНИКИ.md`. Править его
на месте бессмысленно — правка исчезнет при следующем обновлении снимка. Нужна
правка в Яндексе — pull request в их репозиторий.

---

## Дыра, которую закрывает `own/wordstat-sweep`

Ни в одном официальном сервере Яндекса нет статистики поисковых запросов. И
`yandex/yandex-search-mcp-server`, и `yandex-cloud/mcp/servers/search-mcp-server` отдают
ровно два инструмента веб-поиска — найти страницы в интернете, не более.

При этом сам Wordstat живёт в том же Search API: эндпоинт `v2/wordstat/topRequests`,
тот же ключ, тот же folder. Яндекс просто не завернул его в MCP. Сторонние
реализации существуют — [altrr2/yandex-tools-mcp](https://github.com/altrr2/yandex-tools-mcp),
[georgy-agaev/yandex-direct-metrica-mcp](https://github.com/georgy-agaev/yandex-direct-metrica-mcp), —
но официальной нет, и в линейке `yandex-*-mcp` это единственный незакрытый брат.

Здесь Wordstat лежит скиллом, а не MCP-сервером. Обернуть его в
`yandex-wordstat-mcp` — очевидный следующий шаг, но это отдельная работа.

---

## Ключи

Всё в `upstream/` и `own/wordstat-sweep` ходит в Yandex Cloud и требует пары
`YANDEX_SEARCH_API_KEY` + `YANDEX_FOLDER_ID`. У сервисного аккаунта нужна роль
`search-api.executor` на этот folder, а платёжный аккаунт не должен быть пустым —
403 `Permission denied` чаще означает именно пустой баланс, а не отсутствие роли.

`own/yandex-direct-mcp` и `own/yandex-metrika-mcp` работают на своих токенах,
см. README внутри каждого.

## Лицензии

Сборка и всё в `own/` — MIT, см. `LICENSE`. Код Яндекса в `upstream/` — Apache 2.0,
LICENSE-файлы сохранены внутри каждого каталога, атрибуция в `NOTICE`. Ни один
LICENSE не удалён и не переписан.

Происхождение каждого каталога, точные коммиты снимков и порядок обновления —
в `ИСТОЧНИКИ.md`.
