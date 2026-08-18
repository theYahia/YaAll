"""Smoke test для PDF-генератора — offline. Требует reportlab (иначе skip)."""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest

pytest.importorskip("reportlab")  # PDF-фича опциональна

from scripts.audit import AuditReport, _aggregate_recommendations
from scripts.content_depth import analyze_html
from scripts.epos_scorer import score_html
from scripts.generate_yageo_pdf import build_pdf
from scripts.json_ld_validator import validate_html


RICH_HTML = """
<html><head>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Тест</title>
  <script type="application/ld+json">
  {"@context":"https://schema.org","@type":"Person","name":"Иван Иванов","jobTitle":"Эксперт"}
  </script>
</head>
<body>
  <h1>Главный заголовок</h1>
  <article>
    <p>Компания Яндекс разработала ЭПОС в 2024 году. Цена 1500 рублей. Подробные данные и факты.</p>
    <h2>Первый раздел</h2>
    <p>Уникальный контент с числами 42, 100, 2025 и развёрнутым описанием темы.</p>
    <h2>Второй раздел</h2>
    <ul><li>Пункт один</li><li>Пункт два</li></ul>
  </article>
</body></html>
"""


def _offline_report() -> AuditReport:
    url = "https://example.ru/"
    report = AuditReport(
        url=url,
        epos=score_html(RICH_HTML, url=url),
        depth=analyze_html(RICH_HTML, url=url),
        schema=validate_html(RICH_HTML, url=url, generate=True),
        crawlers=None,            # build_pdf корректно обрабатывает отсутствие crawlers
        elapsed_sec=1.0,
    )
    report.top_recommendations = _aggregate_recommendations(report)
    return report


def test_build_pdf_writes_valid_file(tmp_path):
    out = tmp_path / "report.pdf"
    build_pdf(_offline_report(), str(out))
    assert out.exists()
    data = out.read_bytes()
    assert len(data) > 1000              # непустой документ
    assert data[:5] == b"%PDF-"          # валидная PDF-сигнатура
