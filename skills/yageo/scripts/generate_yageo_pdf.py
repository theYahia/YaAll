"""
YaGEO PDF Report Generator — конвертирует AuditReport в стилизованный PDF.

Usage:
    python scripts/generate_yageo_pdf.py https://gosmax.ru/ -o report.pdf
    yageo-pdf https://gosmax.ru/
    yageo-pdf https://gosmax.ru/ -o my_report.pdf
"""

from __future__ import annotations

import sys
import os
from datetime import datetime
from pathlib import Path
from typing import Optional

sys.path.insert(0, str(Path(__file__).parent.parent))

import click

# ReportLab imports
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, KeepTogether,
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

from scripts.audit import audit_url, AuditReport, AggregatedRec

# ---------------------------------------------------------------------------
# Palette
# ---------------------------------------------------------------------------
_BRAND   = colors.HexColor("#1A56DB")   # Яндекс-синий
_SUCCESS = colors.HexColor("#0E9F6E")
_WARN    = colors.HexColor("#E3A008")
_DANGER  = colors.HexColor("#E02424")
_LIGHT   = colors.HexColor("#F9FAFB")
_GRAY    = colors.HexColor("#6B7280")
_DARK    = colors.HexColor("#111827")
_WHITE   = colors.white

_EFFORT_COLOR = {"LOW": _SUCCESS, "MEDIUM": _WARN, "HIGH": _DANGER}
_LEVEL_COLOR  = {"HIGH": _SUCCESS, "MEDIUM": _WARN, "LOW": _DANGER}


# ---------------------------------------------------------------------------
# Font registration (falls back to Helvetica if no Cyrillic font found)
# ---------------------------------------------------------------------------
def _register_fonts() -> str:
    """Return base font name. Try DejaVu (ships with many systems) first."""
    candidates = [
        # Windows paths
        r"C:\Windows\Fonts\DejaVuSans.ttf",
        r"C:\Windows\Fonts\arial.ttf",
        r"C:\Windows\Fonts\tahoma.ttf",
        # Linux / macOS
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
    ]
    for path in candidates:
        if os.path.exists(path):
            try:
                pdfmetrics.registerFont(TTFont("YaGEO", path))
                return "YaGEO"
            except Exception:
                continue
    return "Helvetica"


# ---------------------------------------------------------------------------
# Style factory
# ---------------------------------------------------------------------------
def _make_styles(font: str) -> dict:
    base = getSampleStyleSheet()
    def S(name, **kw):
        if "fontName" not in kw:
            kw["fontName"] = font
        return ParagraphStyle(name, **kw)

    return {
        "title":    S("T", fontSize=22, textColor=_BRAND, spaceAfter=4, leading=26),
        "subtitle": S("ST", fontSize=11, textColor=_GRAY, spaceAfter=12),
        "h2":       S("H2", fontSize=14, textColor=_DARK, spaceBefore=14, spaceAfter=6,
                      leading=18),
        "h3":       S("H3", fontSize=11, textColor=_DARK, spaceBefore=8, spaceAfter=4,
                      leading=14),
        "body":     S("B", fontSize=9, textColor=_DARK, leading=13),
        "small":    S("SM", fontSize=8, textColor=_GRAY, leading=11),
        "mono":     S("MN", fontSize=8, textColor=_DARK, leading=11,
                      fontName="Courier"),
        "badge_ok": S("BOK", fontSize=8, textColor=_SUCCESS, leading=11),
        "badge_warn":S("BWN", fontSize=8, textColor=_WARN, leading=11),
        "badge_err": S("BER", fontSize=8, textColor=_DANGER, leading=11),
    }


# ---------------------------------------------------------------------------
# Helper: score badge text
# ---------------------------------------------------------------------------
def _level(score: int) -> str:
    if score >= 70: return "HIGH"
    if score >= 40: return "MEDIUM"
    return "LOW"


def _citability(score: int) -> str:
    if score >= 70: return "HIGH"
    if score >= 50: return "MEDIUM"
    return "LOW"


# ---------------------------------------------------------------------------
# PDF builder
# ---------------------------------------------------------------------------
def build_pdf(report: AuditReport, out_path: str) -> None:
    font = _register_fonts()
    S = _make_styles(font)

    doc = SimpleDocTemplate(
        out_path,
        pagesize=A4,
        leftMargin=2*cm, rightMargin=2*cm,
        topMargin=2*cm, bottomMargin=2*cm,
        title=f"YaGEO Audit — {report.url}",
        author="YaGEO v0.1",
    )

    story = []
    epos = report.epos
    crawlers = report.crawlers
    depth = report.depth
    schema = report.schema

    # --- Header ---
    story.append(Paragraph("YaGEO Audit Report", S["title"]))
    story.append(Paragraph(
        f"<b>URL:</b> {report.url} &nbsp;|&nbsp; "
        f"<b>Дата:</b> {datetime.now().strftime('%Y-%m-%d %H:%M')} &nbsp;|&nbsp; "
        f"<b>Время анализа:</b> {report.elapsed_sec:.1f}с",
        S["subtitle"]
    ))
    story.append(HRFlowable(width="100%", thickness=1, color=_BRAND, spaceAfter=10))

    # --- Summary table ---
    story.append(Paragraph("Сводка", S["h2"]))

    def score_cell(val, level):
        c = _LEVEL_COLOR.get(level, _GRAY)
        return Paragraph(f'<font color="#{c.hexval()[2:]}"><b>{val}</b></font>', S["body"])

    overall_level = _level(epos.overall) if epos else "LOW"
    summary_data = [
        [Paragraph("<b>Модуль</b>", S["body"]),
         Paragraph("<b>Показатель</b>", S["body"]),
         Paragraph("<b>Статус</b>", S["body"])],
    ]
    if epos:
        summary_data += [
            ["ЭПОС Overall", f"{epos.overall}/100", score_cell(overall_level, overall_level)],
            ["  Э Экспертность", f"{epos.e}/100", score_cell(_level(epos.e), _level(epos.e))],
            ["  П Полезность", f"{epos.p}/100", score_cell(_level(epos.p), _level(epos.p))],
            ["  О Оригинальность", f"{epos.o}/100", score_cell(_level(epos.o), _level(epos.o))],
            ["  С Содержательность", f"{epos.s}/100", score_cell(_level(epos.s), _level(epos.s))],
        ]
    crawlers_ok = crawlers and crawlers.overall_ok
    summary_data.append([
        "Crawlers",
        "OK" if crawlers_ok else "FAIL",
        score_cell("HIGH" if crawlers_ok else "LOW", "HIGH" if crawlers_ok else "LOW"),
    ])
    if schema:
        summary_data.append(["Schema", f"{schema.overall_score}/100",
                              score_cell(_level(schema.overall_score), _level(schema.overall_score))])
    if depth:
        wlevel = "HIGH" if depth.total_words >= 500 else ("MEDIUM" if depth.total_words >= 300 else "LOW")
        summary_data.append(["Content (слов)", str(depth.total_words), score_cell(wlevel, wlevel)])

    tbl = Table(summary_data, colWidths=[5.5*cm, 3.5*cm, 3.5*cm])
    tbl.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,0), _BRAND),
        ("TEXTCOLOR",  (0,0), (-1,0), _WHITE),
        ("FONTNAME",   (0,0), (-1,0), font),
        ("FONTSIZE",   (0,0), (-1,-1), 9),
        ("ROWBACKGROUNDS", (0,1), (-1,-1), [_LIGHT, _WHITE]),
        ("GRID",       (0,0), (-1,-1), 0.3, _GRAY),
        ("TOPPADDING", (0,0), (-1,-1), 4),
        ("BOTTOMPADDING",(0,0),(-1,-1), 4),
        ("LEFTPADDING", (0,0), (-1,-1), 6),
    ]))
    story.append(tbl)
    story.append(Spacer(1, 6))

    cit = _citability(epos.overall) if epos else "LOW"
    cit_text = {
        "HIGH": "HIGH — страница хорошо цитируется Alice AI",
        "MEDIUM": "MEDIUM — есть потенциал, нужны quick wins",
        "LOW": "LOW — требует серьёзной доработки",
    }[cit]
    story.append(Paragraph(f"<b>Alice AI citability:</b> {cit_text}", S["body"]))
    story.append(Spacer(1, 10))

    # --- ЭПОС Breakdown ---
    if epos:
        story.append(HRFlowable(width="100%", thickness=0.5, color=_GRAY, spaceAfter=4))
        story.append(Paragraph("ЭПОС Scoring", S["h2"]))

        epos_data = [
            [Paragraph("<b>Критерий</b>", S["body"]),
             Paragraph("<b>Балл</b>", S["body"]),
             Paragraph("<b>Ключевые сигналы</b>", S["body"])],
            ["Э Экспертность", f"{epos.e}/100",
             f"Author schema: {'да' if epos.signals.get('has_author_schema') else 'нет'} | "
             f"Org schema: {'да' if epos.signals.get('has_org_schema') else 'нет'} | "
             f"NER: {epos.signals.get('entity_density', 0):.1f}/100sl"],
            ["П Полезность", f"{epos.p}/100",
             f"HTTPS: {'да' if epos.signals.get('is_https') else 'нет'} | "
             f"Viewport: {'да' if epos.signals.get('has_viewport') else 'нет'} | "
             f"H1: {'да' if epos.signals.get('has_h1') else 'нет'}"],
            ["О Оригинальность", f"{epos.o}/100",
             f"TTR: {epos.signals.get('ttr', 0):.2f} | "
             f"First chunk: {epos.signals.get('first_chunk_len', 0)} sym"],
            ["С Содержательность", f"{epos.s}/100",
             f"Слов: {epos.signals.get('word_count', 0)} | "
             f"Numeric density: {epos.signals.get('numeric_density', 0):.1f}/100sl"],
        ]
        etbl = Table(epos_data, colWidths=[4.5*cm, 2.5*cm, 9.5*cm])
        etbl.setStyle(TableStyle([
            ("BACKGROUND", (0,0), (-1,0), _DARK),
            ("TEXTCOLOR",  (0,0), (-1,0), _WHITE),
            ("FONTNAME",   (0,0), (-1,-1), font),
            ("FONTSIZE",   (0,0), (-1,-1), 8),
            ("ROWBACKGROUNDS", (0,1), (-1,-1), [_LIGHT, _WHITE]),
            ("GRID", (0,0), (-1,-1), 0.3, _GRAY),
            ("TOPPADDING", (0,0), (-1,-1), 4),
            ("BOTTOMPADDING", (0,0), (-1,-1), 4),
            ("LEFTPADDING", (0,0), (-1,-1), 6),
        ]))
        story.append(etbl)
        story.append(Spacer(1, 10))

    # --- Recommendations ---
    if report.top_recommendations:
        story.append(HRFlowable(width="100%", thickness=0.5, color=_GRAY, spaceAfter=4))
        story.append(Paragraph("Топ рекомендаций", S["h2"]))

        rec_data = [
            [Paragraph("<b>#</b>", S["body"]),
             Paragraph("<b>Рекомендация</b>", S["body"]),
             Paragraph("<b>Источник</b>", S["body"]),
             Paragraph("<b>Impact</b>", S["body"]),
             Paragraph("<b>Усилия</b>", S["body"])],
        ]
        for i, rec in enumerate(report.top_recommendations, 1):
            ec = _EFFORT_COLOR.get(rec.effort, _GRAY)
            effort_p = Paragraph(
                f'<font color="#{ec.hexval()[2:]}"><b>{rec.effort}</b></font>', S["body"]
            )
            rec_data.append([
                str(i),
                Paragraph(rec.text, S["body"]),
                rec.source,
                f"+{rec.impact}",
                effort_p,
            ])

        rtbl = Table(rec_data, colWidths=[0.7*cm, 9*cm, 2*cm, 1.3*cm, 1.5*cm])
        rtbl.setStyle(TableStyle([
            ("BACKGROUND", (0,0), (-1,0), _BRAND),
            ("TEXTCOLOR",  (0,0), (-1,0), _WHITE),
            ("FONTNAME",   (0,0), (-1,-1), font),
            ("FONTSIZE",   (0,0), (-1,-1), 8),
            ("ROWBACKGROUNDS", (0,1), (-1,-1), [_LIGHT, _WHITE]),
            ("GRID", (0,0), (-1,-1), 0.3, _GRAY),
            ("TOPPADDING", (0,0), (-1,-1), 4),
            ("BOTTOMPADDING", (0,0), (-1,-1), 4),
            ("LEFTPADDING", (0,0), (-1,-1), 4),
            ("VALIGN", (0,0), (-1,-1), "TOP"),
        ]))
        story.append(rtbl)
        story.append(Spacer(1, 10))

    # --- Technical details ---
    story.append(HRFlowable(width="100%", thickness=0.5, color=_GRAY, spaceAfter=4))
    story.append(Paragraph("Технический аудит", S["h2"]))

    if crawlers:
        story.append(Paragraph("Crawlers", S["h3"]))
        cr = crawlers
        crawl_items = [
            f"robots.txt: {'найден' if cr.robots.found else 'НЕ НАЙДЕН'}",
            f"YandexBot: {'разрешён' if cr.robots.yandexbot_allowed else 'ЗАБЛОКИРОВАН'}",
            f"Sitemap: {'найден, %d URL' % cr.sitemap.total_urls if cr.sitemap.found else 'не найден'}",
            f"URL в sitemap: {'да' if cr.sitemap.target_url_in_sitemap else 'нет'}",
            f"Canonical: {'корректный' if (cr.canonical.found and cr.canonical.matches_target) else 'проблема'}",
        ]
        for item in crawl_items:
            story.append(Paragraph(f"• {item}", S["body"]))
        story.append(Spacer(1, 6))

    if schema:
        story.append(Paragraph("Schema.org", S["h3"]))
        if schema.found_schemas:
            for fs in schema.found_schemas:
                story.append(Paragraph(
                    f"• <b>{fs.schema_type}</b>: {fs.score}/100"
                    + (f" ({len(fs.issues)} замечаний)" if fs.issues else ""),
                    S["body"]
                ))
        else:
            story.append(Paragraph("• JSON-LD разметка отсутствует", S["badge_err"]))
        if schema.missing_recommended:
            story.append(Paragraph(
                f"Отсутствуют: {', '.join(schema.missing_recommended)}", S["small"]
            ))
        story.append(Spacer(1, 6))

    if depth:
        story.append(Paragraph("Контент", S["h3"]))
        depth_items = [
            f"Слов: {depth.total_words}",
            f"Разделов H2: {depth.total_sections}",
            f"FAQ-блок: {'да' if depth.has_faq_block else 'нет'}",
            f"LSI-покрытие: {depth.lsi_coverage*100:.0f}%",
            f"LSI найдено: {', '.join(depth.lsi_found[:5]) if depth.lsi_found else '—'}",
        ]
        for item in depth_items:
            story.append(Paragraph(f"• {item}", S["body"]))
        story.append(Spacer(1, 6))

    # --- Generated JSON-LD ---
    if schema and schema.generated:
        story.append(HRFlowable(width="100%", thickness=0.5, color=_GRAY, spaceAfter=4))
        story.append(Paragraph("Сгенерированные JSON-LD блоки", S["h2"]))
        story.append(Paragraph(
            "Добавить в &lt;head&gt; страницы:", S["body"]
        ))
        story.append(Spacer(1, 4))

        import json as _json
        for block in schema.generated[:3]:  # max 3 to keep PDF compact
            btype = block.get("@type", "Schema")
            story.append(Paragraph(f"<b>{btype}</b>", S["h3"]))
            code = _json.dumps(block, ensure_ascii=False, indent=2)
            # Wrap long lines
            for line in code.split("\n")[:25]:  # max 25 lines per block
                story.append(Paragraph(line.replace(" ", "&nbsp;"), S["mono"]))
            story.append(Spacer(1, 6))

    # --- Footer ---
    story.append(Spacer(1, 14))
    story.append(HRFlowable(width="100%", thickness=0.5, color=_GRAY))
    story.append(Paragraph(
        "Сгенерировано YaGEO v0.1 — open-source Claude Code skill для Яндекс ЭПОС + Alice AI",
        S["small"]
    ))

    doc.build(story)


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------
def _ensure_utf8_stdout():
    if hasattr(sys.stdout, "reconfigure"):
        try:
            sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        except Exception:
            pass


@click.command()
@click.argument("url")
@click.option("-o", "--output", "out_path", default=None,
              help="Путь к PDF (по умолчанию: auto из URL)")
@click.option("--json-in", "json_path", default=None,
              help="Читать AuditReport из JSON вместо живого аудита")
def main(url: str, out_path: Optional[str], json_path: Optional[str]):
    """YaGEO PDF — генерирует PDF-отчёт по результатам аудита."""
    _ensure_utf8_stdout()

    if out_path is None:
        from urllib.parse import urlparse
        parsed = urlparse(url)
        safe_host = parsed.netloc.replace(".", "_")
        safe_path = parsed.path.strip("/").replace("/", "_") or "home"
        out_path = f"yageo_audit_{safe_host}_{safe_path}.pdf"

    if json_path:
        import json as _json
        click.echo(f"Читаю отчёт из {json_path}...", err=True)
        with open(json_path, encoding="utf-8") as f:
            data = _json.load(f)
        # Re-build report from JSON for PDF (simplified — just use audit_url)
        click.echo("Перезапускаю аудит (JSON-in ещё не реализован полностью)...", err=True)
        report = audit_url(url)
    else:
        click.echo(f"Запускаю аудит {url}...", err=True)
        report = audit_url(url)

    click.echo(f"Генерирую PDF → {out_path}...", err=True)
    build_pdf(report, out_path)
    click.echo(f"PDF сохранён: {out_path}")


if __name__ == "__main__":
    main()
