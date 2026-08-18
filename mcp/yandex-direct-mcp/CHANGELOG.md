# Changelog

Все значимые изменения проекта документируются в этом файле.
Формат основан на [Keep a Changelog](https://keepachangelog.com/ru/1.1.0/), версионирование — [SemVer](https://semver.org/lang/ru/).

## [5.0.0] — 2026-08-18

Вклад **[Maxim (DrSeedon)](https://github.com/DrSeedon)** — исходный pull request
[theYahia/yandex-direct-mcp#7](https://github.com/theYahia/yandex-direct-mcp/pull/7)
(репозиторий заархивирован, код перенесён в монорепозиторий YaAll вручную).
Расширено с 20 до 48 инструментов.

### ⚠️ Breaking changes
- **Все ID — строки.** Параметры `campaign_id(s)`, `ad_group_id(s)`, `ad_id(s)`, `keyword_id(s)`, `region_ids` и остальные идентификаторы принимаются как десятичные строки (`"1915016273214320641"`), а не числа. 64-битные ID Яндекс.Директа не помещаются в `Number` без потери точности, поэтому старый числовой формат больше не принимается.
- Ответы API парсятся через `json-bigint` (`storeAsString: true`): большие ID возвращаются строками, а не округлённым `Number`.

### Added
- 28 инструментов (20 → 48):
  - **Кампании и стратегии**: `manage_campaigns`, `get_strategy`, `set_strategy`.
  - **Объявления**: `moderate_ads`.
  - **Минус-фразы**: `get_campaign_negative_keywords`, `list_negative_keyword_shared_sets`, `manage_negative_keyword_shared_sets`, `link_negative_keyword_sets`.
  - **Ассеты**: `list_sitelinks`, `set_sitelinks`, `list_ad_extensions`, `add_ad_extensions`, `delete_ad_extensions`, `manage_ad_images`, `list_vcards`, `add_vcard`.
  - **Ставки**: `get_bid_adjustments`, `set_bid_adjustments`.
  - **Аудитории и цели**: `list_retargeting_lists`, `add_retargeting_list`, `list_audience_targets`, `set_audience_targets`, `list_dynamic_targets`, `manage_dynamic_targets`.
  - **Данные аккаунта**: `get_search_queries`, `get_changes`, `list_feeds`, `list_businesses`.
- Зависимость `json-bigint` + хелперы `src/id.ts` (`idField`, `apiId`, `apiIds`) для валидации и сериализации ID.
- Денежные ключи `WeeklySpendLimit` и `BidCeiling` конвертируются в рубли на выводе.
- Тесты: `src/__tests__/lossless-and-new-tools.test.ts`, `src/__tests__/remaining-tools.test.ts` (всего 48 тестов).

## [4.0.1] — 2026-06-23

### Fixed
- Гигиена публикуемого пакета: сборка теперь чистит `dist/` перед `tsc` (скрипт `clean`), поэтому в tarball не попадают устаревшие артефакты (ранее тащился stale `dist/types.js` от удалённого исходника).
- Тесты исключены из публикуемой сборки: `tsconfig.json` `exclude` += `src/**/__tests__/**` (тесты по-прежнему гоняются через vitest, но `dist/__tests__/` больше не публикуется).

Изменений в поведении инструментов нет — чисто упаковочный патч.

## [4.0.0] — 2026-06-23

Крупное обновление: исправлены баги корректности, добавлены ключевые PPC-операции, песочница и агентский режим. Расширено с 12 до 20 инструментов.

### ⚠️ Breaking changes
- **Деньги — в рублях.** Параметры `daily_budget` (`create_campaign`/`update_campaign`) и ставки теперь принимаются и возвращаются в рублях/валюте аккаунта; сервер сам конвертирует в микроединицы API. Денежные поля в выводе (`Amount`, `Bid`, `ContextBid`) тоже отдаются в рублях. Ранее ожидались микроединицы.
- `get_account_balance` теперь возвращает реальный баланс через Live API v4 (`AccountManagement.Get`), а не справочники.

### Added
- **`set_keyword_bids`** — установка ставок (поиск/сети) на уровне фраз, групп или кампаний (сервис Bids).
- **`set_campaign_negative_keywords` / `set_ad_group_negative_keywords`** — минус-фразы.
- **`update_text_ad`** — обновление текстового объявления.
- **`manage_ads`** — suspend/resume/archive/unarchive/moderate/delete объявлений.
- **`manage_keywords`** — suspend/resume/delete ключевых фраз.
- **`delete_ad_groups`** — удаление групп.
- **`get_regions`** — справочник кодов регионов (GeoRegions) с фильтром.
- **Песочница**: `YANDEX_DIRECT_SANDBOX=1` переключает все эндпоинты (v5 + Live v4) на api-sandbox.
- **Агентский режим**: `YANDEX_DIRECT_LOGIN` → заголовок `Client-Login`.
- **Пагинация** (`limit`/`offset`) в `list_*` + подсказка `LimitedBy` для следующей страницы.
- **MCP-аннотации** (readOnly/destructive/idempotent/openWorld + title) на всех инструментах.
- Логирование баллов API (заголовок `Units`) в stderr.

### Fixed
- **Детект ошибок API**: ошибки уровня запроса возвращаются в теле с HTTP 200 — теперь распознаются и бросаются с понятным сообщением (ранее молча уходили в ответ).
- **Ошибки per-item** операций add/update/delete (`*Results[].Errors`/`Warnings`) выводятся в шапке результата (частичный успех сохраняется).
- **ReportService**: обработка кодов 201/202 с поллингом по заголовку `retryIn` (ранее возвращался служебный ответ «отчёт формируется»).
- **`update_campaign`**: при одновременной передаче `status` и `name`/`daily_budget` выполняются оба действия (ранее поля молча терялись).
- **Лимиты текста объявления** обновлены: Title ≤56, Title2 ≤30, Text ≤81 (zod-валидация).
- Версия сервера читается из `package.json` (ранее была захардкожена `2.0.0`).
- Валидация формата дат (`YYYY-MM-DD`).

### Removed
- Неиспользуемый `src/types.ts` (мёртвый код; вывод нормализуется generic-форматтером).

### Internal
- Новые модули: `src/format.ts` (нормализация вывода, конверсия денег), `src/pagination.ts`.
- `@modelcontextprotocol/sdk` → `^1.29.0`; регистрация инструментов через `registerTool`.
- Тесты расширены до 27 (детект ошибок, конверсия денег, поллинг, sandbox, Client-Login, новые инструменты).

## [3.0.2]
- Добавлено поле `mcpName` для MCP Registry.

## [3.0.0]
- Первый публичный релиз: 12 инструментов API Яндекс.Директ v5.
