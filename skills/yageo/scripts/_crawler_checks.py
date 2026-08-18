"""robots.txt / sitemap.xml / canonical checkers (extracted from yandex_crawler_check.py).

Holds the HTTP helpers plus the three independent crawler checks. Re-exported by
``scripts.yandex_crawler_check``.
"""

from __future__ import annotations

import re
from typing import Optional
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup

from scripts._crawler_types import RobotsResult, SitemapResult, CanonicalResult

try:
    from usp.tree import sitemap_tree_for_homepage
    USP_AVAILABLE = True
except ImportError:
    USP_AVAILABLE = False


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (compatible; YaGEO-checker/0.1; "
        "+https://github.com/example/yageo)"
    ),
    "Accept-Language": "ru-RU,ru;q=0.9",
}


def _get(url: str, timeout: int = 10) -> Optional[requests.Response]:
    try:
        r = requests.get(url, headers=_HEADERS, timeout=timeout, allow_redirects=True)
        return r
    except Exception:
        return None


def _base_url(url: str) -> str:
    p = urlparse(url)
    return f"{p.scheme}://{p.netloc}"


def _normalize_url(url: str) -> str:
    """Normalize URL for comparison: lowercase, strip trailing slash."""
    return url.lower().rstrip("/")


# ---------------------------------------------------------------------------
# robots.txt checker
# ---------------------------------------------------------------------------

_USERAGENT_RE = re.compile(r"^User-agent\s*:\s*(.+)$", re.IGNORECASE)
_DISALLOW_RE = re.compile(r"^Disallow\s*:\s*(.*)$", re.IGNORECASE)
_ALLOW_RE = re.compile(r"^Allow\s*:\s*(.*)$", re.IGNORECASE)
_SITEMAP_RE = re.compile(r"^Sitemap\s*:\s*(.+)$", re.IGNORECASE)

_YANDEX_AGENTS = {"yandexbot", "yandexadditionalbot", "yandex"}


def _parse_robots(robots_text: str, target_path: str = "/") -> tuple[dict, list[str]]:
    """
    Returns:
        rules: {agent_name: {"allowed": bool_for_target, "disallows": [...], "allows": [...]}}
        sitemap_urls: list of sitemap URLs found
    """
    rules: dict[str, dict] = {}
    sitemap_urls: list[str] = []
    current_agents: list[str] = []

    for raw_line in robots_text.splitlines():
        line = raw_line.strip()
        if line.startswith("#") or not line:
            if not line:
                current_agents = []
            continue

        m_ua = _USERAGENT_RE.match(line)
        if m_ua:
            agent = m_ua.group(1).strip().lower()
            current_agents.append(agent)
            if agent not in rules:
                rules[agent] = {"disallows": [], "allows": []}
            continue

        m_dis = _DISALLOW_RE.match(line)
        if m_dis and current_agents:
            path = m_dis.group(1).strip()
            for a in current_agents:
                if a not in rules:
                    rules[a] = {"disallows": [], "allows": []}
                if path:
                    rules[a]["disallows"].append(path)
            continue

        m_allow = _ALLOW_RE.match(line)
        if m_allow and current_agents:
            path = m_allow.group(1).strip()
            for a in current_agents:
                if a not in rules:
                    rules[a] = {"disallows": [], "allows": []}
                if path:
                    rules[a]["allows"].append(path)
            continue

        m_sm = _SITEMAP_RE.match(line)
        if m_sm:
            sitemap_urls.append(m_sm.group(1).strip())

    return rules, sitemap_urls


def _is_path_blocked(path: str, rules: dict, agent: str) -> bool:
    """Check if path is blocked for given agent (also checks wildcard *)."""
    agents_to_check = [agent, "*"]
    for a in agents_to_check:
        if a not in rules:
            continue
        r = rules[a]
        # Check allows first (more specific wins)
        for allow_path in r.get("allows", []):
            if path.startswith(allow_path):
                return False
        for dis_path in r.get("disallows", []):
            if dis_path and path.startswith(dis_path):
                return True
    return False


def check_robots(base: str, target_url: str) -> RobotsResult:
    robots_url = base.rstrip("/") + "/robots.txt"
    r = _get(robots_url)
    parsed = urlparse(target_url)
    target_path = parsed.path or "/"

    if not r or r.status_code != 200:
        return RobotsResult(
            url=robots_url,
            found=False,
            yandexbot_allowed=True,  # если robots нет — всё разрешено
            yandexadditional_allowed=True,
            issues=["robots.txt не найден или недоступен (HTTP %s)" % (r.status_code if r else "timeout")],
        )

    text = r.text
    snippet = text[:500]
    rules, sitemap_urls = _parse_robots(text, target_path)

    yb_blocked = _is_path_blocked(target_path, rules, "yandexbot")
    ya_blocked = _is_path_blocked(target_path, rules, "yandexadditionalbot")

    issues = []
    if yb_blocked:
        issues.append(f"YandexBot заблокирован для пути {target_path!r}")
    if ya_blocked:
        issues.append(f"YandexAdditionalBot заблокирован для пути {target_path!r}")
    if not sitemap_urls:
        issues.append("Sitemap не указан в robots.txt (рекомендуется добавить Sitemap: https://...)")

    return RobotsResult(
        url=robots_url,
        found=True,
        yandexbot_allowed=not yb_blocked,
        yandexadditional_allowed=not ya_blocked,
        sitemap_urls_in_robots=sitemap_urls,
        issues=issues,
        raw_snippet=snippet,
    )


# ---------------------------------------------------------------------------
# Sitemap checker
# ---------------------------------------------------------------------------

def _manual_sitemap_check(base: str, target_url: str) -> SitemapResult:
    """Fallback: fetch /sitemap.xml manually, count URLs via regex."""
    sitemap_url = base.rstrip("/") + "/sitemap.xml"
    r = _get(sitemap_url, timeout=15)
    if not r or r.status_code != 200:
        return SitemapResult(
            found=False,
            issues=["sitemap.xml не найден по %s" % sitemap_url],
            method="manual",
        )

    content = r.text
    # Count <loc> entries
    locs = re.findall(r"<loc>\s*(.*?)\s*</loc>", content, re.IGNORECASE)
    target_norm = _normalize_url(target_url)
    in_sitemap = any(_normalize_url(loc) == target_norm for loc in locs)

    issues = []
    if len(locs) == 0:
        issues.append("sitemap.xml найден, но не содержит <loc> — возможно, это sitemap index без парсинга")

    return SitemapResult(
        found=True,
        sitemap_urls_found=[sitemap_url],
        total_urls=len(locs),
        target_url_in_sitemap=in_sitemap,
        issues=issues,
        method="manual",
    )


def check_sitemap(
    base: str, target_url: str, robots_sitemap_urls: list[str]
) -> SitemapResult:
    if USP_AVAILABLE:
        try:
            tree = sitemap_tree_for_homepage(base)
            all_pages = list(tree.all_pages())
            page_urls = [p.url for p in all_pages if p.url]
            target_norm = _normalize_url(target_url)
            in_sitemap = any(_normalize_url(u) == target_norm for u in page_urls)

            issues = []
            if len(page_urls) == 0:
                issues.append("Sitemap не содержит страниц или недоступен")

            return SitemapResult(
                found=len(page_urls) > 0,
                sitemap_urls_found=list({p.url for p in all_pages}),
                total_urls=len(page_urls),
                target_url_in_sitemap=in_sitemap,
                issues=issues,
                method="usp",
            )
        except Exception as e:
            pass  # fall through to manual

    return _manual_sitemap_check(base, target_url)


# ---------------------------------------------------------------------------
# Canonical checker
# ---------------------------------------------------------------------------

def check_canonical(url: str) -> CanonicalResult:
    r = _get(url)
    if not r or r.status_code != 200:
        return CanonicalResult(found=False, issue="Страница недоступна")

    soup = BeautifulSoup(r.text, "lxml")
    canonical_tag = soup.find("link", rel=re.compile(r"canonical", re.I))
    if not canonical_tag:
        # Check HTTP header too
        link_header = r.headers.get("Link", "")
        if 'rel="canonical"' in link_header or "rel=canonical" in link_header:
            m = re.search(r'<([^>]+)>;\s*rel=["\']?canonical', link_header)
            if m:
                return CanonicalResult(
                    found=True,
                    canonical_url=m.group(1),
                    matches_target=_normalize_url(m.group(1)) == _normalize_url(url),
                )
        return CanonicalResult(
            found=False,
            issue="Canonical тег отсутствует",
        )

    canonical_href = canonical_tag.get("href", "")
    if not canonical_href.startswith("http"):
        canonical_href = urljoin(url, canonical_href)

    matches = _normalize_url(canonical_href) == _normalize_url(url)
    issue = "" if matches else (
        f"Canonical указывает на другой URL: {canonical_href!r}"
    )

    return CanonicalResult(
        found=True,
        canonical_url=canonical_href,
        matches_target=matches,
        issue=issue,
    )
