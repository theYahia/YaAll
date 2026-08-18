# YaGEO — Yandex / Alice AI Generative Engine Optimization

Open-source Claude Code skill для оптимизации сайтов под **Яндекс.Поиск** и **Alice AI**, заточенный под критерии **ЭПОС** (Экспертность, Полезность, Оригинальность, Содержательность) и Webmaster-инструмент «Видимость сайта в Алисе AI».

[![Python 3.12+](https://img.shields.io/badge/python-3.12%2B-blue)](https://www.python.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![v0.1.0](https://img.shields.io/badge/version-0.1.0-orange)](https://github.com/theYahia/YaAll/tree/main/skills/yageo)

## Что делает

| Команда | Что проверяет |
|---------|--------------|
| `yageo-epos <url>` | ЭПОС-скоринг (Э/П/О/С 0–100) + рекомендации |
| `yageo-crawlers <url>` | robots.txt, YandexBot, sitemap, canonical |
| `yageo-content-depth <url>` | структура, LSI, FAQ, speakable |
| `yageo-schema <url>` | JSON-LD валидация + генерация RU-шаблонов |
| `yageo-audit <url>` | Всё вместе, параллельно, Markdown-отчёт |
| `yageo-pdf <url>` | PDF-отчёт (ReportLab) |
| `yageo-batch <url>` | ЭПОС по всему sitemap.xml → CSV |

## Быстрый старт

```bash
git clone https://github.com/theYahia/YaAll.git
cd YaAll/skills/yageo

# Windows (Git Bash)
bash install-win.sh

# macOS / Linux
bash install.sh

source .venv/Scripts/activate   # Windows
source .venv/bin/activate        # macOS/Linux

# Полный аудит
yageo-audit https://example.ru/

# Сохранить Markdown-отчёт
yageo-audit https://example.ru/ --report

# PDF-отчёт
yageo-pdf https://example.ru/ -o report.pdf

# Batch: весь сайт по sitemap
yageo-batch https://example.ru/ --workers 5 --limit 50
```

## MCP-сервер (Claude Code / Cursor / Claude Desktop)

YaGEO поднимается как **MCP-сервер** (Model Context Protocol, stdio) — тогда тулкит вызывается из
любого MCP-клиента как набор инструментов, а не только из CLI. Бонус: persistent-процесс держит
Natasha NER **тёплой** между вызовами (CLI грузит ~200-500MB модели на каждый запуск).

```bash
pip install -e ".[mcp]"     # доп. зависимость: mcp (FastMCP)
yageo-mcp                    # запуск stdio-сервера (обычно его поднимает MCP-клиент сам)
```

### Инструменты

| Tool | Параметры | Что возвращает |
|------|-----------|----------------|
| `yageo_epos` | `url` | ЭПОС-скоринг (Э/П/О/С 0-100) + рекомендации |
| `yageo_score_html` | `html`, `url=""` | ЭПОС по готовому HTML (без загрузки страницы) |
| `yageo_crawlers` | `url` | robots.txt / YandexBot / sitemap / canonical |
| `yageo_content_depth` | `url` | секции, LSI, FAQ, speakable |
| `yageo_schema` | `url`, `generate=true` | валидация JSON-LD + генерация RU-шаблонов |
| `yageo_audit` | `url` | полный аудит (4 модуля), ~30-90с |
| `yageo_audit_markdown` | `url` | полный аудит + Markdown-отчёт |
| `yageo_batch` | `sitemap_url`, `limit=20`, `workers=5` | ЭПОС по sitemap, минуты (limit≤50, workers≤10) |
| `yageo_pdf` | `url`, `out_path=""` | PDF-отчёт (нужен extra `pdf`) |

### Регистрация в Claude Code (project scope)

Создай `.mcp.json` в корне проекта (укажи реальный путь к python из `.venv`):

```jsonc
{
  "mcpServers": {
    "yageo": {
      "command": ".venv/Scripts/python.exe",   // Windows; macOS/Linux: ".venv/bin/python"
      "args": ["-m", "scripts.mcp_server"],
      "cwd": "D:/Yahia/active/YaGEO"            // абсолютный путь к репозиторию
    }
  }
}
```

**Claude Desktop** (`claude_desktop_config.json`) и **Cursor** (`.cursor/mcp.json`) — та же форма, но
`command` укажи **абсолютным** путём к `.venv` python.

> Заметки: сервер логирует в **stderr** (stdout зарезервирован под JSON-RPC); на старте ~5-15с разогрев
> Natasha; для клиентов с ~60с timeout держи `yageo_batch` на `limit≤20`. Переменные `${...}` в `.mcp.json`
> в текущих версиях Claude Code не разворачиваются — пиши конкретные пути.

### Установка как плагин

```
/plugin marketplace add theYahia/YaGEO
/plugin install yageo@yageo
```
Плагин при первом запуске сам создаёт `.venv` и ставит зависимости (~77MB natasha, разово — может занять
пару минут; если клиент отвалился по таймауту, переподключи MCP). Требует `python` 3.12+ в PATH.

## ЭПОС — что это

**ЭПОС** — официальная система критериев Яндекса для ранжирования контента в генеративных ответах и Alice AI:

| Буква | Критерий | Что смотрим |
|-------|----------|-------------|
| Э | Экспертность | Author schema, NER-плотность, numeric facts |
| П | Полезность | HTTPS, viewport, H1, answer-first, popup |
| О | Оригинальность | TTR, n-gram uniqueness, sentence variance |
| С | Содержательность | Word count, H2-структура, FAQ, списки |

Overall = среднее четырёх критериев. Целевой порог для Alice AI citability — **70+**.

### Калибровка порогов

Все веса и пороги ЭПОС (бакеты word-count, TTR, Flesch-окно, бонусы за schema/H2, доменные
boilerplate/LSI-списки) вынесены в **`yageo/epos_config.toml`** — калибруй скоринг под свой сайт
**без правки кода**. Удаление любого ключа безопасно: движок берёт встроенный дефолт. Свой файл —
через env `YAGEO_CONFIG=path`. Парсинг — stdlib `tomllib`, без новых зависимостей.

Полезные переключатели:
- `[content].flesch_enabled` — отключить ненадёжный для русского Flesch-бонус;
- `[originality].lemmatize_ttr` — считать TTR по леммам (Natasha), а не словоформам;
- `[[lsi.profiles]]` — доменные LSI-профили (выбор по `url_markers`) + `default_keywords`. Так
  доменная специфика (напр. каталог ботов) живёт в данных, а не в коде.

### Кэш загрузок (opt-in)

Повторные аудиты тех же URL можно не тянуть из сети — включи файловый кэш (по умолчанию **выключен**):
- `YAGEO_CACHE=1` — кэш в `~/.cache/yageo`; либо `YAGEO_CACHE_DIR=/path`;
- `YAGEO_CACHE_TTL=<сек>` — срок жизни (по умолчанию 3600).

Ключ кэша — только URL (без заголовков/кук), поэтому не используй для авторизованных страниц.

## Структура репо

```
YaGEO/
├── scripts/
│   ├── epos_scorer.py          # ЭПОС (Э/П/О/С 0-100)
│   ├── yandex_crawler_check.py # robots/sitemap/canonical
│   ├── content_depth.py        # per-section NLP анализ
│   ├── json_ld_validator.py    # JSON-LD валидатор + генератор
│   ├── audit.py                # параллельный оркестратор (4 модуля)
│   ├── generate_yageo_pdf.py   # PDF-отчёт (ReportLab)
│   ├── batch_audit.py          # batch ЭПОС по sitemap
│   ├── config.py               # загрузчик порогов из epos_config.toml
│   ├── cache.py                # opt-in файловый кэш загрузок (YAGEO_CACHE)
│   └── mcp_server.py           # MCP-сервер (FastMCP, stdio) — 9 тулов
├── schema/                     # RU JSON-LD шаблоны (Organization, Person, FAQ, ...)
├── agents/                     # Claude Code subagent specs
├── yageo/
│   ├── SKILL.md                # Claude Code skill manifest
│   ├── epos_config.toml        # пороги/веса ЭПОС (калибровка без правки кода)
│   └── templates/
│       └── audit_report.md.j2  # Jinja2 Markdown шаблон
├── plugin/                     # Claude Code plugin (MCP) — .mcp.json + bootstrap
├── tests/                      # 61 offline тестов
├── install.sh / install-win.sh
└── pyproject.toml
```

## Требования

- Python 3.12+
- CPU-only, без GPU — Natasha NLP (~77MB) работает офлайн
- Интернет только для аудита живых страниц

## Опциональные зависимости

```bash
pip install -e ".[pdf]"   # PDF-отчёты (reportlab)
pip install -e ".[dev]"   # тесты (pytest)
```

## Лицензия

MIT
