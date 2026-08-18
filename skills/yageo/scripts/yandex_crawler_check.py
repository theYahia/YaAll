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

Module layout (refactor 2026-06-24): this file is the public entrypoint /
facade. The robots/sitemap/canonical checkers and data structures were split
into sub-modules but every previously-importable name is re-exported here, so
callers/tests doing ``from scripts.yandex_crawler_check import ...`` are
unchanged:

    scripts/_crawler_types.py   — RobotsResult, SitemapResult, CanonicalResult, CrawlerReport
    scripts/_crawler_checks.py  — _parse_robots, _is_path_blocked, check_robots, check_sitemap, check_canonical
"""

from __future__ import annotations

import json
import warnings

warnings.filterwarnings("ignore")

import click

from scripts._common import (
    ensure_utf8_stdout as _ensure_utf8_stdout,
    STATUS_SYMBOLS as _SYM,
    status_symbol as _sym,
)

# --- Re-exported public surface (facade) -----------------------------------
from scripts._crawler_types import (
    RobotsResult,
    SitemapResult,
    CanonicalResult,
    CrawlerReport,
)
from scripts._crawler_checks import (
    USP_AVAILABLE,
    _get,
    _base_url,
    _normalize_url,
    _parse_robots,
    _is_path_blocked,
    check_robots,
    _manual_sitemap_check,
    check_sitemap,
    check_canonical,
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
# CLI output  (_SYM / _sym are shared helpers imported from scripts._common)
# ---------------------------------------------------------------------------

def _print_report(r: CrawlerReport) -> None:
    click.echo()
    click.echo("YaGEO— Crawlers check")
    click.echo(f"Target: {r.url}")
    click.echo()

    # robots.txt
    rob = r.robots
    if rob:
        click.echo("  robots.txt")
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
        click.echo("  Canonical")
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
