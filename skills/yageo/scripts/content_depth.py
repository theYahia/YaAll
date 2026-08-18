"""
YaGEO Content Depth — детальный анализ структуры и глубины контента.

Выходит за рамки базового ЭПОС-скоринга и даёт посекционный отчёт:
  - Word count per H2 section
  - Heading hierarchy depth
  - FAQ-style Q&A detection
  - Content gaps vs Ashmanov checklist
  - LSI keyword density (по доменным терминам)

Usage:
    python scripts/content_depth.py https://gosmax.ru/catalog/alfa-bank/
    yageo-content-depth https://gosmax.ru/
    yageo-content-depth https://gosmax.ru/ --json
"""

from __future__ import annotations

import json
import re
import sys
import warnings
from dataclasses import dataclass, field, asdict
from typing import Optional

warnings.filterwarnings("ignore")

import click
import textstat
from bs4 import BeautifulSoup, Tag

from scripts._common import (
    ensure_utf8_stdout as _ensure_utf8_stdout,
    extract_text as _extract_text,
    fetch_html as _fetch_html,
    STATUS_SYMBOLS as _SYM,
    status_symbol as _sym,
)
from scripts.config import CFG


# ---------------------------------------------------------------------------
# Data structures
# ---------------------------------------------------------------------------

@dataclass
class Section:
    heading: str
    heading_level: int  # 2, 3, 4
    word_count: int
    sentences: int
    has_list: bool
    has_numeric_facts: bool
    subheadings: list[str] = field(default_factory=list)


@dataclass
class ContentDepthReport:
    url: str
    total_words: int = 0
    total_sections: int = 0
    sections: list[Section] = field(default_factory=list)
    heading_depth: int = 0          # max heading level found (2, 3, 4)
    has_faq_block: bool = False      # H2/H3 with вопросительным знаком или "FAQ"
    faq_answers_avg_words: int = 0   # avg words per FAQ answer
    has_speakable_content: bool = False  # short, direct-answer paragraphs
    intro_word_count: int = 0        # words before first H2
    lsi_coverage: float = 0.0        # fraction of domain keywords present
    lsi_found: list[str] = field(default_factory=list)
    lsi_missing: list[str] = field(default_factory=list)
    issues: list[str] = field(default_factory=list)
    recommendations: list[str] = field(default_factory=list)

    def to_dict(self) -> dict:
        d = asdict(self)
        d["sections"] = [asdict(s) for s in self.sections]
        return d


# ---------------------------------------------------------------------------
# Section extraction (fetch/extract live in scripts._common)
# ---------------------------------------------------------------------------

_HEADING_TAGS = {"h1", "h2", "h3", "h4"}
_NUMERIC_RE = re.compile(r"\b\d+[.,]?\d*\b")
_QUESTION_RE = re.compile(r"[?？]|^(что|как|когда|где|почему|зачем|кто|какой|можно ли|стоит ли)", re.I)


def _count_words(text: str) -> int:
    return textstat.lexicon_count(text, removepunct=True)


def _extract_sections(soup: BeautifulSoup) -> tuple[list[Section], int]:
    """
    Returns (sections, intro_word_count).
    intro_word_count = words in the page before the first H2.
    """
    # Find main content area — body or article
    content = soup.find("article") or soup.find("main") or soup.find("body")
    if not content:
        return [], 0

    sections: list[Section] = []
    current_section: Optional[Section] = None
    current_text_parts: list[str] = []
    intro_parts: list[str] = []
    past_first_h2 = False

    for elem in content.descendants:
        if not isinstance(elem, Tag):
            continue
        tag_name = elem.name.lower() if elem.name else ""

        if tag_name in ("h2", "h3", "h4"):
            # Save previous section
            if current_section is not None:
                section_text = " ".join(current_text_parts)
                current_section.word_count = _count_words(section_text)
                current_section.sentences = len(
                    [s for s in re.split(r"[.!?]", section_text) if len(s.strip()) > 5]
                )
                current_section.has_numeric_facts = bool(_NUMERIC_RE.search(section_text))
                sections.append(current_section)
                current_text_parts = []
            elif not past_first_h2 and tag_name == "h2":
                # Save intro text
                pass

            heading_text = elem.get_text(strip=True)
            level = int(tag_name[1])

            if tag_name == "h2":
                past_first_h2 = True
                current_section = Section(
                    heading=heading_text,
                    heading_level=level,
                    word_count=0,
                    sentences=0,
                    has_list=False,
                    has_numeric_facts=False,
                )
            elif current_section and tag_name in ("h3", "h4"):
                current_section.subheadings.append(heading_text)

        elif tag_name in ("p", "li", "td", "dd"):
            text = elem.get_text(strip=True)
            if not text:
                continue
            if current_section is not None:
                current_text_parts.append(text)
                if tag_name in ("li",):
                    current_section.has_list = True
            elif not past_first_h2:
                intro_parts.append(text)

        elif tag_name in ("ul", "ol") and current_section is not None:
            current_section.has_list = True

    # Save last section
    if current_section is not None:
        section_text = " ".join(current_text_parts)
        current_section.word_count = _count_words(section_text)
        current_section.sentences = len(
            [s for s in re.split(r"[.!?]", section_text) if len(s.strip()) > 5]
        )
        current_section.has_numeric_facts = bool(_NUMERIC_RE.search(section_text))
        sections.append(current_section)

    intro_word_count = _count_words(" ".join(intro_parts))
    return sections, intro_word_count


# ---------------------------------------------------------------------------
# FAQ detection
# ---------------------------------------------------------------------------

def _detect_faq(sections: list[Section], soup: BeautifulSoup) -> tuple[bool, int]:
    """Returns (has_faq_block, avg_answer_words)."""
    faq_sections = [
        s for s in sections
        if _QUESTION_RE.search(s.heading) or "faq" in s.heading.lower()
    ]

    # Also check for dl/dt/dd pattern (definition list = FAQ)
    dl_items = soup.find_all("dt")
    if dl_items:
        faq_sections_extra = len(dl_items)
    else:
        faq_sections_extra = 0

    if not faq_sections and not faq_sections_extra:
        return False, 0

    answer_words = [s.word_count for s in faq_sections if s.word_count > 0]
    avg = round(sum(answer_words) / len(answer_words)) if answer_words else 0
    return True, avg


# ---------------------------------------------------------------------------
# Speakable content detection
# ---------------------------------------------------------------------------

def _detect_speakable(soup: BeautifulSoup, text: str) -> bool:
    """
    Heuristic: page has short, direct-answer paragraphs (15-60 words)
    that start with a capital letter and end with a period.
    Alice prefers these for voice answers.
    """
    # Check for speakable schema
    for script in soup.find_all("script", type="application/ld+json"):
        try:
            data = json.loads(script.string or "")
            if isinstance(data, dict) and "speakable" in str(data).lower():
                return True
        except Exception:
            pass

    # Heuristic: count short definitive paragraphs
    paras = [p.get_text(strip=True) for p in soup.find_all("p")]
    short_definitive = [
        p for p in paras
        if 15 <= _count_words(p) <= 60 and p.endswith(".")
    ]
    return len(short_definitive) >= 2


# ---------------------------------------------------------------------------
# LSI keyword coverage
# ---------------------------------------------------------------------------

# LSI-наборы (base / catalog), доменные маркеры URL и пороги — в scripts/config.py
# (секция [lsi], дублируется в yageo/epos_config.toml). Под свой сайт замени списки в TOML.


def _compute_lsi(text: str, url: str) -> tuple[float, list[str], list[str]]:
    lsi = CFG["lsi"]
    text_lower = text.lower()
    # Доменный профиль: первый, чей url_marker встретился в URL; иначе набор по умолчанию.
    keywords = lsi["default_keywords"]
    for profile in lsi.get("profiles", []):
        if any(marker in url for marker in profile.get("url_markers", [])):
            keywords = profile["keywords"]
            break

    found = [kw for kw in keywords if kw in text_lower]
    missing = [kw for kw in keywords if kw not in text_lower]
    coverage = len(found) / max(1, len(keywords))
    return round(coverage, 2), found, missing


# ---------------------------------------------------------------------------
# Build recommendations
# ---------------------------------------------------------------------------

def _build_recommendations(report: ContentDepthReport) -> list[str]:
    recs = []

    # Word count
    if report.total_words < 300:
        recs.append(
            f"Расширить контент: сейчас {report.total_words} слов. "
            "Цель — минимум 500 слов для хорошей видимости в Alice AI"
        )

    # Thin sections
    thin = [s for s in report.sections if s.word_count < 50 and s.word_count > 0]
    if thin:
        names = ", ".join(f'"{s.heading}"' for s in thin[:3])
        recs.append(f"Разделы {names} содержат <50 слов — добавить детали, примеры, факты")

    # No sections at all
    if report.total_sections == 0:
        recs.append(
            "Нет H2-заголовков — разбить текст на разделы с H2 (Яндекс использует структуру для Alice AI блендера)"
        )

    # Heading depth
    if report.heading_depth < 3 and report.total_words > 500:
        recs.append("Добавить H3-подзаголовки внутри H2-разделов для более глубокой структуры")

    # FAQ
    if not report.has_faq_block:
        recs.append(
            "Добавить блок FAQ (вопросы пользователей + ответы 40-60 слов) — "
            "Alice AI часто берёт ответы из FAQ"
        )
    elif report.faq_answers_avg_words > 100:
        recs.append(
            f"FAQ-ответы слишком длинные (avg {report.faq_answers_avg_words} слов). "
            "Alice AI предпочитает краткие ответы 40-60 слов"
        )
    elif report.faq_answers_avg_words < 20 and report.has_faq_block:
        recs.append("FAQ-ответы слишком короткие (<20 слов) — добавить деталей")

    # Speakable
    if not report.has_speakable_content:
        recs.append(
            "Добавить 2-3 коротких абзаца (15-60 слов) с прямым ответом на ключевой вопрос — "
            "Alice использует их для голосовых ответов"
        )

    # LSI
    if report.lsi_coverage < CFG["lsi"]["coverage_min"] and report.lsi_missing:
        top_missing = report.lsi_missing[:5]
        recs.append(f"Низкое LSI-покрытие ({report.lsi_coverage:.0%}). Добавить: {', '.join(top_missing)}")

    # Intro
    if report.intro_word_count < 80:
        recs.append(
            "Вступление слишком короткое — написать 80-150 слов с главным ответом "
            "ДО первого H2 (answer-first для Alice)"
        )

    return recs[:6]


# ---------------------------------------------------------------------------
# Main analysis
# ---------------------------------------------------------------------------

def analyze_html(html: str, url: str = "") -> ContentDepthReport:
    report = ContentDepthReport(url=url)
    soup = BeautifulSoup(html, "lxml")
    text = _extract_text(html)

    report.total_words = _count_words(text)
    sections, intro_word_count = _extract_sections(soup)
    report.sections = sections
    report.total_sections = len(sections)
    report.intro_word_count = intro_word_count

    if sections:
        report.heading_depth = max(s.heading_level for s in sections)
        max_sub_depth = max(
            (3 if s.subheadings else 2) for s in sections
        )
        report.heading_depth = max(report.heading_depth, max_sub_depth)

    report.has_faq_block, report.faq_answers_avg_words = _detect_faq(sections, soup)
    report.has_speakable_content = _detect_speakable(soup, text)
    report.lsi_coverage, report.lsi_found, report.lsi_missing = _compute_lsi(text, url)
    report.recommendations = _build_recommendations(report)

    return report


def analyze_url(url: str) -> ContentDepthReport:
    html = _fetch_html(url)
    return analyze_html(html, url=url)


# ---------------------------------------------------------------------------
# CLI output  (_SYM / _sym are shared helpers imported from scripts._common)
# ---------------------------------------------------------------------------

def _print_report(r: ContentDepthReport) -> None:
    click.echo()
    click.echo("YaGEO— Content Depth")
    click.echo(f"Target: {r.url}")
    click.echo()

    click.echo(f"  Слов всего:        {r.total_words:4d}")
    click.echo(f"  Вступление:        {r.intro_word_count:4d} слов")
    click.echo(f"  Разделов (H2):     {r.total_sections:4d}")
    click.echo(f"  Глубина заголовков:   H{r.heading_depth}")
    click.echo()

    # Sections table
    if r.sections:
        click.echo("  Разделы:")
        click.echo(f"    {'Заголовок':<35} {'Слов':>5}  {'Сп.':>4}  {'Числа':>5}  {'Списки':>7}")
        click.echo("    " + "-" * 60)
        for s in r.sections:
            heading_short = s.heading[:33] + ".." if len(s.heading) > 33 else s.heading
            num_mark = _SYM["ok"] if s.has_numeric_facts else "-"
            list_mark = _SYM["ok"] if s.has_list else "-"
            thin_mark = " ⚠" if s.word_count < 50 and s.word_count > 0 else "  "
            click.echo(
                f"    {heading_short:<35} {s.word_count:>5}{thin_mark} "
                f"{s.sentences:>4}  {num_mark:>5}  {list_mark:>7}"
            )
        click.echo()

    # Special features
    click.echo("  Особенности контента:")
    click.echo(f"    {_sym(r.has_faq_block, warn_only=True)} FAQ-блок: {'да' if r.has_faq_block else 'нет'}", nl=False)
    if r.has_faq_block and r.faq_answers_avg_words:
        click.echo(f" (avg ответ: {r.faq_answers_avg_words} слов)")
    else:
        click.echo()
    click.echo(f"    {_sym(r.has_speakable_content, warn_only=True)} Speakable-абзацы: {'да' if r.has_speakable_content else 'нет'}")
    click.echo(f"    {_sym(r.lsi_coverage >= 0.5, warn_only=True)} LSI-покрытие: {r.lsi_coverage:.0%}")
    if r.lsi_found:
        click.echo(f"      Найдено: {', '.join(r.lsi_found[:8])}")
    if r.lsi_missing:
        click.echo(f"      Отсутствует: {', '.join(r.lsi_missing[:5])}")

    click.echo()

    if r.recommendations:
        click.echo("Рекомендации:")
        for i, rec in enumerate(r.recommendations, 1):
            click.echo(f"  {i}. {rec}")

    click.echo()


# ---------------------------------------------------------------------------
# Click CLI
# ---------------------------------------------------------------------------

@click.command()
@click.argument("url", required=False)
@click.option("--json", "output_json", is_flag=True, help="Вывод в JSON")
@click.option("--html", "html_file", type=click.Path(exists=True), help="Локальный HTML")
def main(url: Optional[str], output_json: bool, html_file: Optional[str]):
    """YaGEO Content Depth — посекционный анализ структуры контента для Alice AI.

    \b
    Usage:
      yageo-content-depth https://gosmax.ru/
      yageo-content-depth https://gosmax.ru/catalog/alfa-bank/ --json
    """
    _ensure_utf8_stdout()
    if not url and not html_file:
        click.echo("Укажи URL или --html файл.")
        sys.exit(1)

    try:
        if html_file:
            with open(html_file, encoding="utf-8", errors="replace") as f:
                html_content = f.read()
            result = analyze_html(html_content, url=html_file)
        else:
            click.echo(f"Fetching {url} ...", err=True)
            result = analyze_url(url)
    except Exception as e:
        click.echo(f"Error: {e}", err=True)
        sys.exit(1)

    if output_json:
        click.echo(json.dumps(result.to_dict(), ensure_ascii=False, indent=2))
    else:
        _print_report(result)


if __name__ == "__main__":
    main()
