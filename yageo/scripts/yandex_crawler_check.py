"""
YaGEO Crawlers — проверяет доступность сайта для YandexBot и корректность sitemap.

Checks:
  - robots.txt: YandexBot / YandexAdditionalBot не заблокированы
  - sitemap.xml: найден, валиден, содержит разумное кол-во URL
  - Canonical tag: присутствует, совпадает с target URL
  - Target URL в sitemap: есть / нет

Usage:
    python scripts/yandex_crawler_check.py https://gosmax.ru/
    yageo-crawlers https://gosmax.ru/
    yageo-crawlers https://gosmax.ru/ --json
"""

from __future__ import annotations

import io
import json
import re
import sys
import warnings
from dataclasses import dataclass, field, asdict
from typing import Optional
from urllib.parse import urljoin, urlparse

warnings.filterwarnings("ignore")

import click
import requests
from bs4 import BeautifulSoup

try:
    from usp.tree import sitemap_tree_for_homepage
    USP_AVAILABLE = True
except ImportError:
    USP_AVAILABLE = False


# ---------------------------------------------------------------------------
# Data structures
# ---------------------------------------------------------------------------

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


# ---------------------------------------------------------------------------
# Build recommendations
# ---------------------------------------------------------------------------

def _build_recommendations(report: CrawlerReport) -> list[str]:
    recs = []

    rob = report.robots
    if rob:
        if not rob.found:
            recs.append("Создать robots.txt и добавить Sitemap: https://domain.ru/sitemap.xml")
        else:
            if not rob.yandexbot_allowed:
                recs.append("Разблокировать YandexBot в robots.txt — сейчас страница не индексируется")
            if not rob.yandexadditional_allowed:
                recs.append("Разблокировать YandexAdditionalBot в robots.txt — нужен для Alice AI")
            if not rob.sitemap_urls_in_robots:
                recs.append("Добавить строку 'Sitemap: https://domain.ru/sitemap.xml' в robots.txt")

    sm = report.sitemap
    if sm:
        if not sm.found:
            recs.append("Создать sitemap.xml и загрузить в Яндекс.Вебмастер")
        elif not sm.target_url_in_sitemap:
            recs.append("Добавить целевой URL в sitemap.xml — страница вне карты сайта")
        if sm.total_urls == 0:
            recs.append("sitemap.xml пуст или нечитаем — проверить формат")

    can = report.canonical
    if can:
        if not can.found:
            recs.append("Добавить <link rel='canonical' href='...'> — важно для Alice AI дедупликации")
        elif not can.matches_target:
            recs.append(f"Canonical указывает на другой URL: {can.canonical_url!r} — исправить или это намеренно?")

    return recs


# ---------------------------------------------------------------------------
# Main check function
# ---------------------------------------------------------------------------

def check_url(url: str) -> CrawlerReport:
    base = _base_url(url)
    report = CrawlerReport(url=url)

    report.robots = check_robots(base, url)
    report.sitemap = check_sitemap(base, url, report.robots.sitemap_urls_in_robots)
    report.canonical = check_canonical(url)
    report.recommendations = _build_recommendations(report)

    rob_ok = report.robots.yandexbot_allowed and report.robots.yandexadditional_allowed
    sm_ok = report.sitemap.found
    can_ok = report.canonical.found
    report.overall_ok = rob_ok and sm_ok and can_ok

    return report


# ---------------------------------------------------------------------------
# CLI output
# ---------------------------------------------------------------------------

_SYM = {"ok": "✓", "warn": "⚠", "bad": "✗"}


def _sym(condition: bool, warn_only: bool = False) -> str:
    if condition:
        return _SYM["ok"]
    return _SYM["warn"] if warn_only else _SYM["bad"]


def _print_report(r: CrawlerReport) -> None:
    click.echo()
    click.echo("YaGEO— Crawlers check")
    click.echo(f"Target: {r.url}")
    click.echo()

    # robots.txt
    rob = r.robots
    if rob:
        click.echo(f"  robots.txt")
        click.echo(f"    {_sym(rob.found, warn_only=True)} Найден: {'да' if rob.found else 'нет'}")
        click.echo(f"    {_sym(rob.yandexbot_allowed)} YandexBot разрешён")
        click.echo(f"    {_sym(rob.yandexadditional_allowed)} YandexAdditionalBot разрешён")
        if rob.sitemap_urls_in_robots:
            for sm_url in rob.sitemap_urls_in_robots:
                click.echo(f"    {_SYM['ok']} Sitemap в robots.txt: {sm_url}")
        else:
            click.echo(f"    {_SYM['warn']} Sitemap не указан в robots.txt")
        for issue in rob.issues:
            click.echo(f"    {_SYM['warn']} {issue}")

    click.echo()

    # sitemap
    sm = r.sitemap
    if sm:
        method_note = f" (метод: {sm.method})" if sm.method else ""
        click.echo(f"  sitemap.xml{method_note}")
        click.echo(f"    {_sym(sm.found)} Найден: {'да' if sm.found else 'нет'}")
        if sm.found:
            click.echo(f"    {_SYM['ok']} URL в карте: {sm.total_urls:,}")
            click.echo(f"    {_sym(sm.target_url_in_sitemap, warn_only=True)} Target URL в sitemap: {'да' if sm.target_url_in_sitemap else 'нет'}")
        for issue in sm.issues:
            click.echo(f"    {_SYM['warn']} {issue}")

    click.echo()

    # canonical
    can = r.canonical
    if can:
        click.echo(f"  Canonical")
        click.echo(f"    {_sym(can.found, warn_only=True)} Тег найден: {'да' if can.found else 'нет'}")
        if can.found:
            click.echo(f"    {_sym(can.matches_target, warn_only=True)} Совпадает с URL: {'да' if can.matches_target else 'нет'}")
            if can.canonical_url:
                click.echo(f"      → {can.canonical_url}")
        if can.issue:
            click.echo(f"    {_SYM['warn']} {can.issue}")

    click.echo()

    overall_sym = _SYM["ok"] if r.overall_ok else _SYM["warn"]
    click.echo(f"  Overall: {overall_sym} {'Всё в порядке' if r.overall_ok else 'Есть проблемы'}")

    if r.recommendations:
        click.echo()
        click.echo("Рекомендации:")
        for i, rec in enumerate(r.recommendations, 1):
            click.echo(f"  {i}. {rec}")

    click.echo()


# ---------------------------------------------------------------------------
# Click CLI
# ---------------------------------------------------------------------------

def _ensure_utf8_stdout():
    if hasattr(sys.stdout, "reconfigure"):
        try:
            sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        except Exception:
            pass


@click.command()
@click.argument("url")
@click.option("--json", "output_json", is_flag=True, help="Вывод в формате JSON")
def main(url: str, output_json: bool):
    """YaGEO Crawlers — проверка robots.txt, sitemap.xml и canonical для Яндекс индексации.

    \b
    Usage:
      yageo-crawlers https://gosmax.ru/
      yageo-crawlers https://gosmax.ru/catalog/alfa-bank/ --json
    """
    _ensure_utf8_stdout()
    click.echo(f"Checking {url} ...", err=True)
    report = check_url(url)

    if output_json:
        click.echo(json.dumps(report.to_dict(), ensure_ascii=False, indent=2))
    else:
        _print_report(report)


if __name__ == "__main__":
    main()
