"""Data structures for the Yandex crawler check (extracted from yandex_crawler_check.py).

Pure dataclasses, no network dependency. Re-exported by
``scripts.yandex_crawler_check`` so existing imports keep working unchanged.
"""

from __future__ import annotations

from dataclasses import dataclass, field, asdict
from typing import Optional


@dataclass
class RobotsResult:
    url: str
    found: bool
    yandexbot_allowed: bool
    yandexadditional_allowed: bool
    sitemap_urls_in_robots: list[str] = field(default_factory=list)
    issues: list[str] = field(default_factory=list)
    raw_snippet: str = ""


@dataclass
class SitemapResult:
    found: bool
    sitemap_urls_found: list[str] = field(default_factory=list)
    total_urls: int = 0
    target_url_in_sitemap: bool = False
    issues: list[str] = field(default_factory=list)
    method: str = ""  # "usp" or "manual"


@dataclass
class CanonicalResult:
    found: bool
    canonical_url: str = ""
    matches_target: bool = False
    issue: str = ""


@dataclass
class CrawlerReport:
    url: str
    robots: Optional[RobotsResult] = None
    sitemap: Optional[SitemapResult] = None
    canonical: Optional[CanonicalResult] = None
    overall_ok: bool = False
    recommendations: list[str] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {
            "url": self.url,
            "robots": asdict(self.robots) if self.robots else None,
            "sitemap": asdict(self.sitemap) if self.sitemap else None,
            "canonical": asdict(self.canonical) if self.canonical else None,
            "overall_ok": self.overall_ok,
            "recommendations": self.recommendations,
        }
