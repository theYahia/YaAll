"""
YaGEO Schema — валидация и генерация JSON-LD разметки для Яндекс Alice AI.

Validates existing schema.org markup on page, detects missing schemas,
and generates ready-to-paste JSON-LD blocks for:
  Organization (RU: VK/Telegram/Dzen sameAs)
  Article + Person (author with credentials)
  FAQPage (Alice AI Q&A)
  LocalBusiness (Yandex Maps sameAs)
  SoftwareApplication

Usage:
    python scripts/json_ld_validator.py https://gosmax.ru/
    yageo-schema https://gosmax.ru/
    yageo-schema https://gosmax.ru/catalog/alfa-bank/ --generate
    yageo-schema https://gosmax.ru/ --json

Module layout (refactor 2026-06-24): this file is the public entrypoint /
facade. Validation, generation and page-detection internals were split into
cohesive sub-modules but every previously-importable name is re-exported here,
so callers/tests doing ``from scripts.json_ld_validator import ...`` are
unchanged:

    scripts/_jsonld_types.py       — SchemaIssue, SchemaInfo, SchemaReport
    scripts/_jsonld_validators.py  — _validate_* + _VALIDATORS + JSON-LD extraction
    scripts/_jsonld_generators.py  — _page_meta, _detect_page_types, _gen_* + _GENERATORS
"""

from __future__ import annotations

import json
import sys
import warnings
from typing import Optional

warnings.filterwarnings("ignore")

import click
import requests
from bs4 import BeautifulSoup

from scripts._common import (
    ensure_utf8_stdout as _ensure_utf8_stdout,
    fetch_html as _fetch_html,
)

# --- Re-exported public surface (facade) -----------------------------------
from scripts._jsonld_types import SchemaIssue, SchemaInfo, SchemaReport
from scripts._jsonld_validators import (
    _extract_jsonld,
    _schema_type,
    _schemas_by_type,
    _validate_organization,
    _validate_person,
    _validate_article,
    _validate_faqpage,
    _validate_localbusiness,
    _validate_softwareapplication,
    _VALIDATORS,
)
from scripts._jsonld_generators import (
    _page_meta,
    _detect_page_types,
    _gen_organization,
    _gen_person,
    _gen_faqpage,
    _gen_software_app,
    _gen_article,
    _GENERATORS,
)


# ---------------------------------------------------------------------------
# Recommendations builder
# ---------------------------------------------------------------------------

def _build_recommendations(
    found_types: set[str],
    missing: list[str],
    found_schemas: list[SchemaInfo],
) -> list[str]:
    recs = []

    for schema_info in found_schemas:
        errors = [i for i in schema_info.issues if i.severity == "error"]
        warnings = [i for i in schema_info.issues if i.severity == "warning"]
        if errors:
            for e in errors[:2]:
                recs.append(f"[{schema_info.schema_type}] Исправить: {e.message}")
        elif warnings:
            top_warn = warnings[0]
            recs.append(f"[{schema_info.schema_type}] Улучшить: {top_warn.message}")

    for m in missing:
        type_labels = {
            "organization": "Organization — название/лого/sameAs RU-платформ (+15 Э)",
            "person": "Person — автор с credentials, jobTitle, sameAs (+30 Э)",
            "faqpage": "FAQPage — вопросы/ответы для Alice AI голосовых ответов (+15 С)",
            "article": "Article — headline/author/datePublished для статейных страниц",
            "softwareapplication": "SoftwareApplication — для страниц приложений и ботов",
            "localbusiness": "LocalBusiness — адрес/телефон + Яндекс.Карты sameAs",
        }
        label = type_labels.get(m, m)
        recs.append(f"Добавить {label}")

    return recs[:6]


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def validate_html(html: str, url: str = "", generate: bool = True) -> SchemaReport:
    soup = BeautifulSoup(html, "lxml")
    schemas = _extract_jsonld(soup)
    by_type = _schemas_by_type(schemas)
    meta = _page_meta(soup, url)

    text_tag = soup.find("body")
    text = text_tag.get_text(separator=" ", strip=True)[:5000] if text_tag else ""

    # Validate found schemas
    found_schemas: list[SchemaInfo] = []
    found_types: set[str] = set()
    for type_key, validator in _VALIDATORS.items():
        if type_key in by_type:
            for s in by_type[type_key]:
                info = validator(s)
                found_schemas.append(info)
                found_types.add(type_key)

    # Detect recommended schema types
    recommended = _detect_page_types(soup, text, url, meta)
    missing = [t for t in recommended if t not in found_types]

    # Generate missing schemas
    generated: list[dict] = []
    if generate:
        for t in missing:
            if t in _GENERATORS:
                try:
                    gen = _GENERATORS[t](meta, soup)
                    generated.append(gen)
                except Exception:
                    pass

    # Overall score: avg of found schema scores, penalized for missing critical ones
    if found_schemas:
        avg_score = sum(s.score for s in found_schemas) // len(found_schemas)
    else:
        avg_score = 0

    critical_missing = {"person", "organization"} & set(missing)
    penalty = len(critical_missing) * 15
    overall = max(0, avg_score - penalty)

    recommendations = _build_recommendations(found_types, missing, found_schemas)

    return SchemaReport(
        url=url,
        found_schemas=found_schemas,
        missing_recommended=missing,
        generated=generated,
        overall_score=overall,
        recommendations=recommendations,
    )


def validate_url(url: str, generate: bool = True) -> SchemaReport:
    html = _fetch_html(url)
    return validate_html(html, url=url, generate=generate)


# ---------------------------------------------------------------------------
# CLI output
# ---------------------------------------------------------------------------

_SYM = {"ok": "✓", "warn": "⚠", "bad": "✗", "info": "i"}
_SEVERITY_SYM = {"error": "✗", "warning": "⚠", "info": "i"}


def _score_bar(score: int, width: int = 20) -> str:
    filled = round(score / 100 * width)
    return "[" + "#" * filled + "." * (width - filled) + "]"


def _print_report(r: SchemaReport, show_generated: bool = False) -> None:
    click.echo()
    click.echo("YaGEO— Schema validator")
    click.echo(f"Target: {r.url}")
    click.echo()

    if r.found_schemas:
        click.echo("  Найденные схемы:")
        for s in r.found_schemas:
            sym = _SYM["ok"] if s.score >= 70 else (_SYM["warn"] if s.score >= 40 else _SYM["bad"])
            click.echo(f"    {sym} {s.schema_type:<25} {s.score:3d}/100  {_score_bar(s.score, 15)}")
            for issue in s.issues[:3]:
                isym = _SEVERITY_SYM.get(issue.severity, "i")
                click.echo(f"        {isym} [{issue.field}] {issue.message}")
    else:
        click.echo(f"  {_SYM['bad']} JSON-LD schema.org разметка не найдена")

    click.echo()

    if r.missing_recommended:
        click.echo("  Рекомендуемые (отсутствуют):")
        for t in r.missing_recommended:
            click.echo(f"    {_SYM['warn']} {t}")

    click.echo()

    sym = _SYM["ok"] if r.overall_score >= 70 else (_SYM["warn"] if r.overall_score >= 40 else _SYM["bad"])
    click.echo(f"  Overall: {sym} {r.overall_score}/100  {_score_bar(r.overall_score)}")

    click.echo()

    if r.recommendations:
        click.echo("Рекомендации:")
        for i, rec in enumerate(r.recommendations, 1):
            click.echo(f"  {i}. {rec}")
        click.echo()

    if show_generated and r.generated:
        click.echo("=" * 60)
        click.echo("Сгенерированные JSON-LD блоки (добавить в <head> страницы):")
        click.echo("=" * 60)
        for block in r.generated:
            click.echo()
            click.echo(f"<!-- {block.get('@type', 'Schema')} -->")
            click.echo("<script type=\"application/ld+json\">")
            click.echo(json.dumps(block, ensure_ascii=False, indent=2))
            click.echo("</script>")
        click.echo()


# ---------------------------------------------------------------------------
# Click CLI
# ---------------------------------------------------------------------------

@click.command()
@click.argument("url", required=False)
@click.option("--json", "output_json", is_flag=True, help="Вывод в JSON")
@click.option("--generate", is_flag=True, default=False, help="Показать сгенерированные JSON-LD блоки")
@click.option("--html", "html_file", type=click.Path(exists=True), help="Локальный HTML файл")
def main(url: Optional[str], output_json: bool, generate: bool, html_file: Optional[str]):
    """YaGEO Schema — валидация и генерация JSON-LD для Яндекс Alice AI.

    \b
    Usage:
      yageo-schema https://gosmax.ru/
      yageo-schema https://gosmax.ru/ --generate
      yageo-schema https://gosmax.ru/catalog/alfa-bank/ --json
    """
    _ensure_utf8_stdout()
    if not url and not html_file:
        click.echo("Укажи URL или --html файл.")
        sys.exit(1)

    try:
        if html_file:
            with open(html_file, encoding="utf-8", errors="replace") as f:
                html_content = f.read()
            result = validate_html(html_content, url=html_file, generate=True)
        else:
            click.echo(f"Fetching {url} ...", err=True)
            result = validate_url(url, generate=True)
    except requests.HTTPError as e:
        click.echo(f"HTTP error: {e}", err=True)
        sys.exit(1)
    except Exception as e:
        click.echo(f"Error: {e}", err=True)
        sys.exit(1)

    if output_json:
        click.echo(json.dumps(result.to_dict(), ensure_ascii=False, indent=2))
    else:
        _print_report(result, show_generated=generate)


if __name__ == "__main__":
    main()
