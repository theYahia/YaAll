"""
Smoke tests for epos_scorer.
No ground-truth thresholds — just verifies scores are in range and scorer doesn't crash.
"""

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
from scripts.epos_scorer import score_html, EposScore


MINIMAL_HTML = """
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Тест страница</title>
</head>
<body>
  <h1>Заголовок страницы</h1>
  <article>
    <p>Это тестовый текст на русском языке. Компания Яндекс разработала алгоритм ЭПОС в 2024 году.</p>
    <p>Критерии включают экспертность, полезность, оригинальность и содержательность.</p>
    <h2>Подраздел первый</h2>
    <p>Дополнительная информация о продукте. Цена составляет 1500 рублей. Иван Иванов, эксперт компании.</p>
    <h2>Подраздел второй</h2>
    <p>Ещё один параграф с уникальным контентом для проверки scoring'а.</p>
  </article>
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Test Org",
    "url": "https://example.ru"
  }
  </script>
</body>
</html>
"""

RICH_HTML = MINIMAL_HTML + """
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "Иван Иванов",
  "jobTitle": "SEO-эксперт",
  "affiliation": {"@type": "Organization", "name": "Test Corp"}
}
</script>
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Что такое ЭПОС?",
      "acceptedAnswer": {"@type": "Answer", "text": "ЭПОС — критерии качества Яндекс для AI-поиска."}
    }
  ]
}
</script>
"""


def _assert_valid_score(score: EposScore):
    assert isinstance(score.e, int), "e должен быть int"
    assert isinstance(score.p, int), "p должен быть int"
    assert isinstance(score.o, int), "o должен быть int"
    assert isinstance(score.s, int), "s должен быть int"
    assert isinstance(score.overall, int), "overall должен быть int"
    assert 0 <= score.e <= 100, f"Э out of range: {score.e}"
    assert 0 <= score.p <= 100, f"П out of range: {score.p}"
    assert 0 <= score.o <= 100, f"О out of range: {score.o}"
    assert 0 <= score.s <= 100, f"С out of range: {score.s}"
    assert 0 <= score.overall <= 100, f"Overall out of range: {score.overall}"
    expected_overall = round((score.e + score.p + score.o + score.s) / 4)
    assert score.overall == expected_overall, f"Overall mismatch: {score.overall} != {expected_overall}"
    assert isinstance(score.recommendations, list)
    assert len(score.recommendations) >= 1, "Должна быть хотя бы 1 recommendation"
    for rec in score.recommendations:
        assert rec.criterion in ("Э", "П", "О", "С"), f"Неверный criterion: {rec.criterion}"
        assert isinstance(rec.impact, int) and rec.impact > 0


def test_minimal_html_scores_in_range():
    score = score_html(MINIMAL_HTML, url="https://example.ru/test/")
    _assert_valid_score(score)


def test_rich_html_scores_higher():
    minimal = score_html(MINIMAL_HTML, url="https://example.ru/")
    rich = score_html(RICH_HTML, url="https://example.ru/")
    _assert_valid_score(rich)
    # Rich has Person schema + FAQPage — Э and С should be higher or equal
    assert rich.e >= minimal.e, f"Rich Э ({rich.e}) должен быть >= minimal ({minimal.e})"
    assert rich.s >= minimal.s, f"Rich С ({rich.s}) должен быть >= minimal ({minimal.s})"


def test_empty_page_doesnt_crash():
    score = score_html("<html><body></body></html>", url="")
    _assert_valid_score(score)


def test_json_serialization():
    score = score_html(MINIMAL_HTML)
    d = score.to_dict()
    import json
    json_str = json.dumps(d, ensure_ascii=False)
    assert "overall" in json_str
    assert "recommendations" in json_str
