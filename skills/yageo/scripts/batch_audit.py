"""
YaGEO Batch Audit — массовый ЭПОС-скоринг по sitemap.xml.

Читает sitemap.xml целевого сайта, запускает yageo-epos на каждой странице
через ThreadPoolExecutor(workers), сохраняет результаты в CSV + summary.

Usage:
    yageo-batch https://gosmax.ru/
    yageo-batch https://gosmax.ru/ --workers 10 --limit 50
    yageo-batch https://gosmax.ru/ --workers 5 -o results.csv
    python scripts/batch_audit.py https://gosmax.ru/ --limit 20
"""

from __future__ import annotations

import csv
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass
from pathlib import Path
from typing import Optional
from urllib.parse import urlparse

sys.path.insert(0, str(Path(__file__).parent.parent))

import click
import warnings
warnings.filterwarnings("ignore")

from scripts._common import ensure_utf8_stdout as _ensure_utf8_stdout
from scripts.epos_scorer import score_url


@dataclass
class PageResult:
    url: str
    e: int = 0
    p: int = 0
    o: int = 0
    s: int = 0
    overall: int = 0
    error: str = ""


def _fetch_sitemap_urls(site_url: str, limit: Optional[int] = None) -> list[str]:
    """Читает sitemap.xml и возвращает список URL."""
    from usp.tree import sitemap_tree_for_homepage

    try:
        tree = sitemap_tree_for_homepage(site_url)
        urls = [p.url for p in tree.all_pages() if p.url]
        if limit:
            urls = urls[:limit]
        return urls
    except Exception as e:
        click.echo(f"Ошибка чтения sitemap: {e}", err=True)
        # Fallback: just return the homepage
        return [site_url]


def _score_page(url: str) -> PageResult:
    try:
        score = score_url(url)
        return PageResult(
            url=url, e=score.e, p=score.p, o=score.o, s=score.s, overall=score.overall
        )
    except Exception as ex:
        return PageResult(url=url, error=str(ex)[:80])


def _run_batch(urls: list[str], workers: int) -> list[PageResult]:
    results: list[PageResult] = []
    total = len(urls)

    with ThreadPoolExecutor(max_workers=workers) as pool:
        futures = {pool.submit(_score_page, url): url for url in urls}
        done = 0
        for future in as_completed(futures):
            done += 1
            res = future.result()
            results.append(res)
            status = f"E={res.e} P={res.p} O={res.o} S={res.s} Overall={res.overall}"
            if res.error:
                status = f"ERROR: {res.error}"
            click.echo(f"  [{done:3}/{total}] {res.url[-60:]:<60} {status}", err=True)

    return results


def _save_csv(results: list[PageResult], out_path: str) -> None:
    with open(out_path, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["url", "e", "p", "o", "s", "overall", "error"])
        for r in results:
            w.writerow([r.url, r.e, r.p, r.o, r.s, r.overall, r.error])


def _print_summary(results: list[PageResult], elapsed: float) -> None:
    ok = [r for r in results if not r.error]
    errors = [r for r in results if r.error]

    if not ok:
        click.echo("Нет успешных результатов.")
        return

    avg = lambda field: round(sum(getattr(r, field) for r in ok) / len(ok))
    p90 = lambda field: sorted(getattr(r, field) for r in ok)[int(len(ok)*0.9)]

    click.echo()
    click.echo(f"Batch Audit Summary — {len(results)} страниц за {elapsed:.0f}с")
    click.echo(f"  Успешно: {len(ok)}  |  Ошибок: {len(errors)}")
    click.echo()
    click.echo("  Средние баллы:")
    click.echo(f"    Э Экспертность:      avg={avg('e'):3}   p90={p90('e'):3}")
    click.echo(f"    П Полезность:        avg={avg('p'):3}   p90={p90('p'):3}")
    click.echo(f"    О Оригинальность:    avg={avg('o'):3}   p90={p90('o'):3}")
    click.echo(f"    С Содержательность:  avg={avg('s'):3}   p90={p90('s'):3}")
    click.echo(f"    Overall:             avg={avg('overall'):3}   p90={p90('overall'):3}")
    click.echo()

    # Distribution
    buckets = {"LOW (<40)": 0, "MEDIUM (40-69)": 0, "HIGH (70+)": 0}
    for r in ok:
        if r.overall >= 70:
            buckets["HIGH (70+)"] += 1
        elif r.overall >= 40:
            buckets["MEDIUM (40-69)"] += 1
        else:
            buckets["LOW (<40)"] += 1
    click.echo("  Распределение Overall:")
    for label, count in buckets.items():
        pct = count / len(ok) * 100
        click.echo(f"    {label}: {count} ({pct:.0f}%)")
    click.echo()

    # Top 5 worst pages
    worst = sorted(ok, key=lambda r: r.overall)[:5]
    click.echo("  Топ-5 страниц для оптимизации (низкий Overall):")
    for r in worst:
        click.echo(f"    {r.overall:3}/100  {r.url}")
    click.echo()

    # Top 5 best pages
    best = sorted(ok, key=lambda r: -r.overall)[:5]
    click.echo("  Топ-5 лучших страниц (высокий Overall):")
    for r in best:
        click.echo(f"    {r.overall:3}/100  {r.url}")

    if errors:
        click.echo()
        click.echo(f"  Ошибки ({len(errors)}):")
        for r in errors[:5]:
            click.echo(f"    {r.url}: {r.error}")


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

@click.command()
@click.argument("url")
@click.option("--workers", default=5, show_default=True,
              help="Параллельных воркеров (осторожно с rate-limiting)")
@click.option("--limit", default=None, type=int,
              help="Макс. страниц из sitemap (по умолчанию все)")
@click.option("-o", "--output", "out_path", default=None,
              help="CSV файл для результатов (по умолчанию: auto из URL)")
def main(url: str, workers: int, limit: Optional[int], out_path: Optional[str]):
    """YaGEO Batch — ЭПОС-скоринг всех страниц сайта из sitemap.xml.

    \b
    Usage:
      yageo-batch https://gosmax.ru/
      yageo-batch https://gosmax.ru/ --workers 10 --limit 50
      yageo-batch https://gosmax.ru/ -o results.csv
    """
    _ensure_utf8_stdout()

    if out_path is None:
        parsed = urlparse(url)
        safe = parsed.netloc.replace(".", "_")
        out_path = f"yageo_batch_{safe}.csv"

    click.echo(f"Читаю sitemap {url}...", err=True)
    urls = _fetch_sitemap_urls(url, limit=limit)
    click.echo(f"Найдено URL: {len(urls)}{f' (ограничено {limit})' if limit else ''}", err=True)

    if not urls:
        click.echo("Нет URL для анализа.", err=True)
        sys.exit(1)

    click.echo(f"Запускаю ЭПОС-скоринг ({workers} воркеров)...", err=True)
    start = time.time()
    results = _run_batch(urls, workers=workers)
    elapsed = time.time() - start

    _save_csv(results, out_path)
    click.echo(f"\nCSV сохранён: {out_path}")

    _print_summary(results, elapsed)


if __name__ == "__main__":
    main()
