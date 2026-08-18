---
name: yageo-epos
description: ЭПОС scorer — оценивает страницу сайта по 4 критериям Яндекс Alice AI (Экспертность/Полезность/Оригинальность/Содержательность), 0-100 каждый, с конкретными рекомендациями.
---

# /yageo epos <url>

Анализирует URL и выдаёт оценку ЭПОС с рекомендациями по улучшению видимости в Яндекс Alice AI.

## Использование

```
/yageo epos https://example.ru/page/
/yageo epos https://example.ru/page/ --json
```

## Что делает

1. Загружает страницу через `requests`
2. Извлекает main content через `trafilatura` (fallback: BeautifulSoup)
3. Прогоняет через Natasha NER — находит сущности (PER/ORG/LOC), числовые факты
4. Вычисляет 4 критерия ЭПОС (0-100 каждый):
   - **Э** Экспертность — автор, credentials, NER-плотность, внешние ссылки
   - **П** Полезность — HTTPS, mobile viewport, H1, answer-first, отсутствие попапов
   - **О** Оригинальность — vocab diversity, numeric facts density, sentence variance
   - **С** Содержательность — word count, H2-H4 структура, списки, FAQPage schema
5. Генерирует топ-5 quick wins с ожидаемым приростом баллов

## Запуск (bash)

```bash
source .venv/Scripts/activate   # Windows
source .venv/bin/activate        # macOS/Linux
yageo-epos <url>
```

Или напрямую:
```bash
python scripts/epos_scorer.py <url>
```

## Примечание

Семантическое сравнение с конкурентами (sentence-transformers) — v0.2.
Веса критериев — baseline heuristic, будут откалиброваны на pilot gosmax.ru.
