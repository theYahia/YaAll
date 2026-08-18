"""Smoke tests for audit orchestrator — offline only."""

import sys, os, json
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from scripts.audit import _aggregate_recommendations, AuditReport, AggregatedRec, render_report
from scripts.epos_scorer import EposScore, Recommendation as EposRec
from scripts.yandex_crawler_check import CrawlerReport, RobotsResult, SitemapResult, CanonicalResult
from scripts.content_depth import ContentDepthReport
from scripts.json_ld_validator import SchemaReport


def _make_mock_report() -> AuditReport:
    """Build a minimal AuditReport with mock data (no network)."""
    epos = EposScore(
        url="https://example.ru/",
        e=24, p=75, o=73, s=50, overall=56,
        signals={
            "has_author_schema": False, "has_org_schema": False,
            "numeric_density": 1.5, "entity_density": 2.0,
            "has_viewport": True, "is_https": True, "has_h1": True,
            "popup_detected": False, "word_count": 439,
            "ttr": 0.78, "first_chunk_len": 350,
        },
        recommendations=[
            EposRec("Добавить JSON-LD Person schema с автором", 30, "Э"),
            EposRec("Добавить FAQPage schema", 15, "С"),
        ],
    )

    crawlers = CrawlerReport(
        url="https://example.ru/",
        robots=RobotsResult(
            url="https://example.ru/robots.txt",
            found=True,
            yandexbot_allowed=True,
            yandexadditional_allowed=True,
            sitemap_urls_in_robots=["https://example.ru/sitemap.xml"],
        ),
        sitemap=SitemapResult(found=True, total_urls=381, target_url_in_sitemap=True),
        canonical=CanonicalResult(found=True, canonical_url="https://example.ru/", matches_target=True),
        overall_ok=True,
        recommendations=[],
    )

    depth = ContentDepthReport(
        url="https://example.ru/",
        total_words=439,
        total_sections=0,
        heading_depth=0,
        has_faq_block=False,
        lsi_coverage=0.19,
        lsi_found=["бот", "мессенджер"],
        lsi_missing=["команда", "функция", "api"],
        recommendations=[
            "Нет H2-заголовков — разбить текст на разделы",
            "Добавить FAQ блок",
        ],
    )

    schema = SchemaReport(
        url="https://example.ru/",
        found_schemas=[],
        missing_recommended=["organization", "faqpage", "person"],
        generated=[{"@context": "https://schema.org", "@type": "Organization", "name": "Test"}],
        overall_score=0,
        recommendations=[
            "Добавить Organization schema",
            "Добавить FAQPage schema",
        ],
    )

    report = AuditReport(
        url="https://example.ru/",
        epos=epos,
        crawlers=crawlers,
        depth=depth,
        schema=schema,
        elapsed_sec=12.5,
    )
    return report


def test_aggregation_deduplicates():
    report = _make_mock_report()
    report.top_recommendations = _aggregate_recommendations(report)
    texts = [r.text for r in report.top_recommendations]
    # No duplicates
    assert len(texts) == len(set(texts[:len(texts)]))


def test_aggregation_sorts_low_effort_first():
    report = _make_mock_report()
    recs = _aggregate_recommendations(report)
    assert len(recs) >= 3
    # LOW-effort recs should appear before HIGH-effort
    efforts = [r.effort for r in recs[:6]]
    # Should not start with HIGH
    assert efforts[0] in ("LOW", "MEDIUM"), f"First rec has effort {efforts[0]}"


def test_aggregation_returns_max_12():
    report = _make_mock_report()
    recs = _aggregate_recommendations(report)
    assert len(recs) <= 12


def test_render_report_no_crash():
    report = _make_mock_report()
    report.top_recommendations = _aggregate_recommendations(report)
    md = render_report(report)
    assert "YaGEO Audit Report" in md
    assert "gosmax" not in md  # mock uses example.ru
    assert "ЭПОС" in md
    assert "рекомендации" in md


def test_render_report_contains_scores():
    report = _make_mock_report()
    report.top_recommendations = _aggregate_recommendations(report)
    md = render_report(report)
    assert "56" in md     # overall
    assert "24" in md     # Э
    assert "75" in md     # П


def test_audit_report_json_serialization():
    report = _make_mock_report()
    report.top_recommendations = _aggregate_recommendations(report)
    d = report.to_dict()
    json_str = json.dumps(d, ensure_ascii=False)
    assert "top_recommendations" in json_str
    assert "elapsed_sec" in json_str
