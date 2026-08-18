# YaGEO — Yandex / Alice AI Generative Engine Optimization

Open-source Claude Code skill для оптимизации сайтов под **Яндекс.Поиск** и **Alice AI**, заточенный под критерии **ЭПОС** (Экспертность, Полезность, Оригинальность, Содержательность) и Webmaster-инструмент «Видимость сайта в Алисе AI».

[![Python 3.12+](https://img.shields.io/badge/python-3.12%2B-blue)](https://www.python.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![v0.1.0](https://img.shields.io/badge/version-0.1.0-orange)](https://github.com/theYahia/YaGEO/releases/tag/v0.1.0)

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

## ЭПОС — что это

**ЭПОС** — официальная система критериев Яндекса для ранжирования контента в генеративных ответах и Alice AI:

| Буква | Критерий | Что смотрим |
|-------|----------|-------------|
| Э | Экспертность | Author schema, NER-плотность, numeric facts |
| П | Полезность | HTTPS, viewport, H1, answer-first, popup |
| О | Оригинальность | TTR, n-gram uniqueness, sentence variance |
| С | Содержательность | Word count, H2-структура, FAQ, списки |

Overall = среднее четырёх критериев. Целевой порог для Alice AI citability — **70+**.

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
│   └── batch_audit.py          # batch ЭПОС по sitemap
├── schema/                     # RU JSON-LD шаблоны (Organization, Person, FAQ, ...)
├── agents/                     # Claude Code subagent specs
├── yageo/
│   ├── SKILL.md                # Claude Code skill manifest
│   └── templates/
│       └── audit_report.md.j2  # Jinja2 Markdown шаблон
├── tests/                      # 28 offline тестов
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
