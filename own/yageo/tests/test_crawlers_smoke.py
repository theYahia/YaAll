"""Smoke tests for yandex_crawler_check — no network, just HTML/text fixtures."""

import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from scripts.yandex_crawler_check import (
    _parse_robots, _is_path_blocked, check_robots,
    CrawlerReport, RobotsResult, SitemapResult, CanonicalResult,
)


ROBOTS_CLEAN = """
User-agent: *
Disallow: /admin/

User-agent: YandexBot
Allow: /

Sitemap: https://example.ru/sitemap.xml
"""

ROBOTS_BLOCKED = """
User-agent: *
Disallow: /

User-agent: Googlebot
Allow: /
"""

ROBOTS_YANDEX_BLOCKED = """
User-agent: YandexBot
Disallow: /

User-agent: *
Allow: /
"""


def test_parse_robots_clean():
    rules, sitemaps = _parse_robots(ROBOTS_CLEAN)
    assert "https://example.ru/sitemap.xml" in sitemaps
    assert "yandexbot" in rules


def test_yandexbot_not_blocked_when_allowed():
    rules, _ = _parse_robots(ROBOTS_CLEAN)
    assert not _is_path_blocked("/catalog/", rules, "yandexbot")


def test_yandexbot_blocked_when_disallow_all():
    rules, _ = _parse_robots(ROBOTS_YANDEX_BLOCKED)
    assert _is_path_blocked("/catalog/alfa-bank/", rules, "yandexbot")


def test_wildcard_blocks_all_agents():
    rules, _ = _parse_robots(ROBOTS_BLOCKED)
    assert _is_path_blocked("/", rules, "yandexbot")
    assert _is_path_blocked("/catalog/", rules, "yandexadditionalbot")


def test_crawler_report_serialization():
    report = CrawlerReport(
        url="https://example.ru/",
        robots=RobotsResult(
            url="https://example.ru/robots.txt",
            found=True,
            yandexbot_allowed=True,
            yandexadditional_allowed=True,
        ),
        sitemap=SitemapResult(found=True, total_urls=100),
        canonical=CanonicalResult(found=True, canonical_url="https://example.ru/", matches_target=True),
        overall_ok=True,
    )
    d = report.to_dict()
    assert d["overall_ok"] is True
    assert d["robots"]["yandexbot_allowed"] is True
    assert d["sitemap"]["total_urls"] == 100
