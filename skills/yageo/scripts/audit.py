"""
YaGEO Audit — комплексный аудит: ЭПОС + Crawlers + Schema + Content Depth.

Запускает все 4 инструмента параллельно (ThreadPoolExecutor),
агрегирует рекомендации по приоритету, генерирует markdown-отчёт через Jinja2.

Usage:
    python scripts/audit.py https://gosmax.ru/
    yageo-audit https://gosmax.ru/
    yageo-audit https://gosmax.ru/ --report          # сохранить markdown в файл
    yageo-audit https://gosmax.ru/ --report out.md   # указать путь
    yageo-audit https://gosmax.ru/ --json            # JSON всех 4 результатов
"""

from __future__ import annotations

import json
import sys
import time
import warnings
from concurrent.futures import ThreadPoolExecutor, Future
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Optional

warnings.filterwarnings("ignore")

import click
from jinja2 import Environment, FileSystemLoader, select_autoescape

# Import all 4 tools
_HERE = Path(__file__).parent
sys.path.insert(0, str(_HERE.parent))

from scripts._common import ensure_utf8_stdout as _ensure_utf8_stdout
from scripts.epos_scorer import score_url as _score_epos
from scripts.yandex_crawler_check import check_url as _check_crawlers
from scripts.content_depth import analyze_url as _analyze_depth
from scripts.json_ld_validator import validate_url as _validate_schema


# ---------------------------------------------------------------------------
# Data structures
# ---------------------------------------------------------------------------

@dataclass
class AggregatedRec:
    text: str
    source: str    # Э / П / О / С / Crawlers / Schema / Content
    impact: int    # expected pts delta
    effort: str    # LOW / MEDIUM / HIGH


@dataclass
class AuditReport:
    url: str
    epos: object = None
    crawlers: object = None
    depth: object = None
    schema: object = None
    top_recommendations: list[AggregatedRec] = field(default_factory=list)
    elapsed_sec: float = 0.0
    errors: dict = field(default_factory=dict)  # module -> error str

    def to_dict(self) -> dict:
        return {
            "url": self.url,
            "elapsed_sec": round(self.elapsed_sec, 1),
            "epos": self.epos.to_dict() if self.epos else None,
            "crawlers": self.crawlers.to_dict() if self.crawlers else None,
            "depth": self.depth.to_dict() if self.depth else None,
            "schema": self.schema.to_dict() if self.schema else None,
            "top_recommendations": [
                {"text": r.text, "source": r.source, "impact": r.impact, "effort": r.effort}
                for r in self.top_recommendations
            ],
            "errors": self.errors,
        }


# ---------------------------------------------------------------------------
# Parallel execution
# ---------------------------------------------------------------------------

def _run_parallel(url: str) -> AuditReport:
    report = AuditReport(url=url)
    start = time.time()

    tasks = {
        "epos": lambda: _score_epos(url),
        "crawlers": lambda: _check_crawlers(url),
        "depth": lambda: _analyze_depth(url),
        "schema": lambda: _validate_schema(url, generate=True),
    }

    with ThreadPoolExecutor(max_workers=4) as pool:
        futures: dict[str, Future] = {
            name: pool.submit(fn) for name, fn in tasks.items()
        }
        for name, future in futures.items():
            try:
                result = future.result(timeout=60)
                setattr(report, name, result)
            except Exception as e:
                report.errors[name] = str(e)

    report.elapsed_sec = time.time() - start
    return report


# ---------------------------------------------------------------------------
# Recommendation aggregation
# ---------------------------------------------------------------------------

_EFFORT_MAP = {
    # keyword → effort level
    "json-ld": "LOW", "schema": "LOW", "добавить": "LOW",
    "viewport": "LOW", "canonical": "LOW", "robots": "LOW",
    "h1": "LOW", "sitemap": "LOW",
    "расширить": "MEDIUM", "переписать": "MEDIUM", "добавить блок": "MEDIUM",
    "структур": "MEDIUM", "разделы": "MEDIUM", "h2": "MEDIUM",
    "статью": "HIGH", "word count": "HIGH", "уникальн": "HIGH",
}


def _estimate_effort(text: str) -> str:
    text_lower = text.lower()
    for keyword, effort in _EFFORT_MAP.items():
        if keyword in text_lower:
            return effort
    return "MEDIUM"


def _aggregate_recommendations(report: AuditReport) -> list[AggregatedRec]:
    recs: list[AggregatedRec] = []
    seen: set[str] = set()

    def add(text: str, source: str, impact: int):
        key = text[:60].lower()
        if key in seen:
            return
        seen.add(key)
        recs.append(AggregatedRec(
            text=text,
            source=source,
            impact=impact,
            effort=_estimate_effort(text),
        ))

    # ЭПОС recommendations
    if report.epos:
        for rec in report.epos.recommendations:
            add(rec.action, rec.criterion, rec.impact)

    # Crawlers recommendations
    if report.crawlers:
        for rec in report.crawlers.recommendations:
            add(rec, "Crawlers", 20)

    # Schema recommendations
    if report.schema:
        for rec in report.schema.recommendations:
            # Extract type hint from rec text
            source = "Schema"
            if "[" in rec and "]" in rec:
                source = rec[rec.find("[") + 1:rec.find("]")]
                rec = rec[rec.find("]") + 2:].strip()
            add(rec, source, 15)

    # Content depth recommendations
    if report.depth:
        for rec in report.depth.recommendations:
            add(rec, "Content", 10)

    # Sort: effort LOW first, then by impact desc
    effort_order = {"LOW": 0, "MEDIUM": 1, "HIGH": 2}
    recs.sort(key=lambda r: (effort_order.get(r.effort, 1), -r.impact))
    return recs[:12]


# ---------------------------------------------------------------------------
# Jinja2 report rendering
# ---------------------------------------------------------------------------

_TEMPLATES_DIR = Path(__file__).parent.parent / "yageo" / "templates"


def _level(score: int) -> str:
    if score >= 70:
        return "HIGH"
    if score >= 40:
        return "MEDIUM"
    return "LOW"


def _citability(score: int) -> str:
    if score >= 70:
        return "HIGH — страница хорошо цитируется Alice AI"
    if score >= 50:
        return "MEDIUM — есть потенциал, нужны quick wins"
    return "LOW — требует серьёзной доработки"


def _epos_note(epos, field: str) -> str:
    sigs = epos.signals if epos else {}
    if field == "e_note":
        if not sigs.get("has_author_schema"):
            return "Автор не указан в JSON-LD"
        if not sigs.get("author_has_credentials"):
            return "Нет credentials у автора"
        return ""
    if field == "p_note":
        if sigs.get("popup_detected"):
            return "Обнаружен intrusive popup"
        if not sigs.get("has_viewport"):
            return "Нет meta viewport"
        return ""
    return ""


def render_report(report: AuditReport) -> str:
    env = Environment(
        loader=FileSystemLoader(str(_TEMPLATES_DIR)),
        autoescape=select_autoescape([]),
        trim_blocks=True,
        lstrip_blocks=True,
    )
    env.filters["tojson"] = lambda v: json.dumps(v, ensure_ascii=False, indent=2)
    env.globals["level"] = _level

    template = env.get_template("audit_report.md.j2")

    epos = report.epos
    crawlers = report.crawlers
    depth = report.depth
    schema = report.schema

    ctx = {
        "url": report.url,
        "generated_at": datetime.now().strftime("%Y-%m-%d %H:%M"),
        "elapsed_sec": round(report.elapsed_sec, 1),
        "epos": epos,
        "crawlers": crawlers,
        "depth": depth,
        "schema": schema,
        "top_recommendations": report.top_recommendations,
        "epos_status": _level(epos.overall) if epos else "ERROR",
        "citability": _citability(epos.overall) if epos else "N/A",
        "crawlers_status": ("✓" if (crawlers and crawlers.overall_ok) else "⚠"),
        "epos_signals": {
            "e_note": _epos_note(epos, "e_note"),
            "p_note": _epos_note(epos, "p_note"),
        },
    }

    return template.render(**ctx)


# ---------------------------------------------------------------------------
# CLI summary output
# ---------------------------------------------------------------------------

_SYM = {"HIGH": "✓", "MEDIUM": "⚠", "LOW": "✗"}
_EFFORT_LABEL = {"LOW": "быстро", "MEDIUM": "средне", "HIGH": "сложно"}


def _print_summary(report: AuditReport) -> None:
    epos = report.epos
    crawlers = report.crawlers
    depth = report.depth
    schema = report.schema

    click.echo()
    click.echo("YaGEO— Полный аудит")
    click.echo(f"Target: {report.url}")
    click.echo(f"Время: {report.elapsed_sec:.1f}с")
    click.echo()

    # Summary table
    click.echo("  Модуль               Балл    Статус")
    click.echo("  " + "-" * 45)

    def row(label, score_str, level_str):
        sym = _SYM.get(level_str, "?")
        click.echo(f"  {label:<20} {score_str:<8} {sym} {level_str}")

    if epos:
        row("ЭПОС Overall", f"{epos.overall}/100", _level(epos.overall))
        row("  Э Экспертность", f"{epos.e}/100", _level(epos.e))
        row("  П Полезность", f"{epos.p}/100", _level(epos.p))
        row("  О Оригинальность", f"{epos.o}/100", _level(epos.o))
        row("  С Содержательность", f"{epos.s}/100", _level(epos.s))
    else:
        click.echo(f"  {'ЭПОС':<20} {'ERROR':<8} ✗")

    crawlers_ok = crawlers and crawlers.overall_ok
    row("Crawlers", "OK" if crawlers_ok else "FAIL", "HIGH" if crawlers_ok else "LOW")

    if schema:
        row("Schema", f"{schema.overall_score}/100", _level(schema.overall_score))
    else:
        click.echo(f"  {'Schema':<20} {'ERROR':<8} ✗")

    if depth:
        row("Content (слов)", str(depth.total_words), "HIGH" if depth.total_words >= 500 else ("MEDIUM" if depth.total_words >= 300 else "LOW"))
    else:
        click.echo(f"  {'Content':<20} {'ERROR':<8} ✗")

    click.echo()
    if epos:
        click.echo(f"  Alice AI citability: {_citability(epos.overall)}")

    click.echo()

    if report.top_recommendations:
        click.echo("Топ рекомендаций (по приоритету):")
        for i, rec in enumerate(report.top_recommendations[:8], 1):
            effort = _EFFORT_LABEL.get(rec.effort, rec.effort)
            click.echo(f"  {i:2}. [{rec.source}] {rec.text}")
            click.echo(f"      +{rec.impact} pts, усилия: {effort}")

    if report.errors:
        click.echo()
        click.echo("Ошибки:")
        for module, err in report.errors.items():
            click.echo(f"  ✗ {module}: {err}")

    click.echo()


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def audit_url(url: str) -> AuditReport:
    report = _run_parallel(url)
    report.top_recommendations = _aggregate_recommendations(report)
    return report


# ---------------------------------------------------------------------------
# Click CLI
# ---------------------------------------------------------------------------

@click.command()
@click.argument("url")
@click.option("--report", "report_path", is_flag=False, flag_value="auto",
              default=None, help="Сохранить markdown-отчёт (опционально: указать путь)")
@click.option("--json", "output_json", is_flag=True, help="JSON-вывод всех 4 результатов")
def main(url: str, report_path: Optional[str], output_json: bool):
    """YaGEO Audit — полный аудит: ЭПОС + Crawlers + Schema + Content (параллельно).

    \b
    Usage:
      yageo-audit https://gosmax.ru/
      yageo-audit https://gosmax.ru/ --report
      yageo-audit https://gosmax.ru/ --report audit.md
      yageo-audit https://gosmax.ru/ --json
    """
    _ensure_utf8_stdout()
    click.echo(f"Запускаю полный аудит {url} (4 модуля параллельно)...", err=True)

    report = audit_url(url)

    if output_json:
        click.echo(json.dumps(report.to_dict(), ensure_ascii=False, indent=2))
        return

    _print_summary(report)

    if report_path is not None:
        try:
            md = render_report(report)
            if report_path == "auto":
                # Auto-generate filename from URL
                from urllib.parse import urlparse
                parsed = urlparse(url)
                safe_host = parsed.netloc.replace(".", "_")
                safe_path = parsed.path.strip("/").replace("/", "_") or "home"
                fname = f"yageo_audit_{safe_host}_{safe_path}.md"
                report_path = fname
            with open(report_path, "w", encoding="utf-8") as f:
                f.write(md)
            click.echo(f"Отчёт сохранён: {report_path}")
        except Exception as e:
            click.echo(f"Ошибка сохранения отчёта: {e}", err=True)


if __name__ == "__main__":
    main()
