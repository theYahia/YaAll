"""
YaGEOЭПОС scorer — оценивает страницу по 4 критериям Яндекс Alice AI.
Criteria: Экспертность / Полезность / Оригинальность / Содержательность (0-100 each).

Usage:
    python scripts/epos_scorer.py https://gosmax.ru/
    python scripts/epos_scorer.py https://gosmax.ru/ --json
    yageo-epos https://gosmax.ru/

Module layout (refactor 2026-06-24): this file is the public entrypoint /
facade. Scoring internals were split into cohesive sub-modules but every
previously-importable name is re-exported here, so callers and tests that do
``from scripts.epos_scorer import ...`` keep working unchanged:

    scripts/_epos_types.py  — EposScore, Recommendation
    scripts/_epos_parse.py  — _bucket, _parse_soup, _extract_jsonld, _has_schema_type, _author_schema
    scripts/_epos_score.py  — NER loaders, _score_s/_p/_e/_o, _build_recommendations, score_html, score_url

``CFG`` and ``_run_ner`` remain attributes of *this* module; the scorer
sub-module resolves them through this facade at call-time, so monkeypatching
``epos_scorer.CFG`` / ``epos_scorer._run_ner`` still takes effect (test contract).
"""

from __future__ import annotations

import json
import sys
import warnings
from typing import Optional

warnings.filterwarnings("ignore")

import click
import requests

from scripts._common import ensure_utf8_stdout as _ensure_utf8_stdout
from scripts.config import CFG

# --- Re-exported public surface (facade) -----------------------------------
from scripts._epos_types import Recommendation, EposScore
from scripts._epos_parse import (
    _bucket,
    _parse_soup,
    _extract_jsonld,
    _has_schema_type,
    _author_schema,
)
from scripts._epos_score import (
    _get_ner,
    _run_ner,
    _score_s,
    _score_p,
    _score_e,
    _score_o,
    _strip_comments,
    _tokenize_simple,
    _lemmatize_tokens,
    _get_morph_vocab,
    _build_recommendations,
    score_html,
    score_url,
    _POPUP_PATTERNS,
    _AUTH_DOMAINS,
    _COMMENT_RE,
    _RU_STOPWORDS,
    _CATALOG_BOILERPLATE,
)


# ---------------------------------------------------------------------------
# CLI output
# ---------------------------------------------------------------------------

_LEVEL_SYMBOL = {
    "green": "✓",
    "yellow": "⚠",
    "red": "✗",
}


def _level(score: int) -> str:
    cit = CFG["citability"]
    if score >= cit["level_high"]:
        return "green"
    if score >= cit["level_medium"]:
        return "yellow"
    return "red"


def _citability_label(overall: int) -> str:
    cit = CFG["citability"]
    if overall >= cit["cit_high"]:
        return "HIGH citability"
    if overall >= cit["cit_medium"]:
        return "MEDIUM citability"
    return "LOW citability"


def _format_score_line(label: str, score: int, note: str = "") -> str:
    sym = _LEVEL_SYMBOL[_level(score)]
    bar = label.ljust(20)
    note_str = f"   {sym} {note}" if note else f"   {sym}"
    return f"  {bar} {score:3d} / 100{note_str}"


def _print_report(result: EposScore) -> None:
    click.echo()
    click.echo("YaGEO— ЭПОС scorer")
    click.echo(f"Target: {result.url}")
    click.echo()

    # Per-criterion notes
    def e_note():
        if not result.signals.get("has_author_schema"):
            return "Автор не указан в JSON-LD Person schema"
        if not result.signals.get("author_has_credentials"):
            return "Person schema есть, но без credentials"
        return ""

    def p_note():
        if result.signals.get("popup_detected"):
            return "Обнаружен intrusive popup/overlay"
        if not result.signals.get("has_viewport"):
            return "Отсутствует meta viewport"
        return "UX прошёл базовые проверки"

    def o_note():
        wc = result.signals.get("word_count", 0)
        return f"TTR={result.signals.get('ttr', 0):.2f}, words={wc}"

    def s_note():
        wc = result.signals.get("word_count", 0)
        if wc < 300:
            return f"{wc} слов — ниже рекомендуемых 300-500"
        if result.signals.get("has_faq_schema"):
            return f"{wc} слов + FAQPage schema ✓"
        return f"{wc} слов"

    click.echo(_format_score_line("Э Экспертность:", result.e, e_note()))
    click.echo(_format_score_line("П Полезность:", result.p, p_note()))
    click.echo(_format_score_line("О Оригинальность:", result.o, o_note()))
    click.echo(_format_score_line("С Содержательность:", result.s, s_note()))
    click.echo()

    click.echo(f"  Overall: {result.overall} / 100 — {_citability_label(result.overall)}")
    click.echo()

    if result.recommendations:
        click.echo("Quick wins:")
        for i, rec in enumerate(result.recommendations, 1):
            click.echo(f"  {i}. [{rec.criterion}] {rec.action} (+{rec.impact} pts)")

    click.echo()
    o_note_full = result.signals.get("o_note", "")
    if o_note_full:
        click.echo(f"  * {o_note_full}")
    click.echo()


# ---------------------------------------------------------------------------
# Click CLI
# ---------------------------------------------------------------------------

@click.command()
@click.argument("url", required=False)
@click.option("--json", "output_json", is_flag=True, help="Вывод в формате JSON")
@click.option("--html", "html_file", type=click.Path(exists=True), help="Локальный HTML файл")
@click.option("--signals", is_flag=True, help="Показать все сигналы (debug)")
def main(url: Optional[str], output_json: bool, html_file: Optional[str], signals: bool):
    """YaGEO— ЭПОС scorer для страниц под Яндекс Alice AI.

    \b
    Usage:
      yageo-epos https://gosmax.ru/
      yageo-epos https://gosmax.ru/ --json
      yageo-epos --html page.html
    """
    _ensure_utf8_stdout()
    if not url and not html_file:
        click.echo("Укажи URL или --html файл. Пример: yageo-epos https://gosmax.ru/")
        sys.exit(1)

    try:
        if html_file:
            with open(html_file, encoding="utf-8", errors="replace") as f:
                html_content = f.read()
            result = score_html(html_content, url=html_file)
        else:
            click.echo(f"Fetching {url} ...", err=True)
            result = score_url(url)
    except requests.HTTPError as e:
        click.echo(f"HTTP error: {e}", err=True)
        sys.exit(1)
    except requests.ConnectionError:
        click.echo(f"Cannot connect to {url}", err=True)
        sys.exit(1)
    except Exception as e:
        click.echo(f"Error: {e}", err=True)
        sys.exit(1)

    if output_json:
        click.echo(json.dumps(result.to_dict(), ensure_ascii=False, indent=2))
    else:
        _print_report(result)
        if signals:
            click.echo("--- Signals ---")
            click.echo(json.dumps(result.signals, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
