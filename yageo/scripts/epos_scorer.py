"""
YaGEOЭПОС scorer — оценивает страницу по 4 критериям Яндекс Alice AI.
Criteria: Экспертность / Полезность / Оригинальность / Содержательность (0-100 each).

Usage:
    python scripts/epos_scorer.py https://gosmax.ru/
    python scripts/epos_scorer.py https://gosmax.ru/ --json
    yageo-epos https://gosmax.ru/
"""

from __future__ import annotations

import json
import math
import re
import sys
import warnings
from dataclasses import dataclass, field, asdict
from typing import Optional
from urllib.parse import urlparse

warnings.filterwarnings("ignore")

import io

import click
import requests
import textstat
import trafilatura
from bs4 import BeautifulSoup


# ---------------------------------------------------------------------------
# Data structures
# ---------------------------------------------------------------------------

@dataclass
class Recommendation:
    action: str
    impact: int  # expected score delta
    criterion: str  # Э / П / О / С


@dataclass
class EposScore:
    url: str
    e: int = 0  # Экспертность
    p: int = 0  # Полезность
    o: int = 0  # Оригинальность
    s: int = 0  # Содержательность
    overall: int = 0
    signals: dict = field(default_factory=dict)
    recommendations: list[Recommendation] = field(default_factory=list)

    def to_dict(self) -> dict:
        d = asdict(self)
        d["recommendations"] = [asdict(r) for r in self.recommendations]
        return d


# ---------------------------------------------------------------------------
# HTML fetch & parse helpers
# ---------------------------------------------------------------------------

_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "ru-RU,ru;q=0.9",
}


def _fetch_html(url: str, timeout: int = 15) -> str:
    resp = requests.get(url, headers=_HEADERS, timeout=timeout)
    resp.raise_for_status()
    resp.encoding = resp.apparent_encoding or "utf-8"
    return resp.text


def _extract_text(html: str) -> str:
    """Extract main content text. trafilatura primary, BS4 fallback."""
    text = trafilatura.extract(
        html,
        include_comments=False,
        include_tables=True,
        no_fallback=False,
    )
    if text and len(text.strip()) > 50:
        return text.strip()
    # Fallback: strip obvious boilerplate via BS4
    soup = BeautifulSoup(html, "lxml")
    for tag in soup(["nav", "header", "footer", "aside", "script", "style", "noscript"]):
        tag.decompose()
    return soup.get_text(separator=" ", strip=True)


def _parse_soup(html: str) -> BeautifulSoup:
    return BeautifulSoup(html, "lxml")


# ---------------------------------------------------------------------------
# JSON-LD extraction
# ---------------------------------------------------------------------------

def _extract_jsonld(soup: BeautifulSoup) -> list[dict]:
    schemas = []
    for tag in soup.find_all("script", type="application/ld+json"):
        try:
            data = json.loads(tag.string or "")
            if isinstance(data, list):
                schemas.extend(data)
            else:
                schemas.append(data)
        except Exception:
            pass
    return schemas


def _has_schema_type(schemas: list[dict], *types: str) -> bool:
    type_set = {t.lower() for t in types}
    for s in schemas:
        stype = s.get("@type", "")
        if isinstance(stype, list):
            if any(t.lower() in type_set for t in stype):
                return True
        elif str(stype).lower() in type_set:
            return True
    return False


def _author_schema(schemas: list[dict]) -> Optional[dict]:
    for s in schemas:
        stype = s.get("@type", "")
        if str(stype).lower() == "person":
            return s
        if "author" in s:
            author = s["author"]
            if isinstance(author, dict):
                return author
    return None


# ---------------------------------------------------------------------------
# Natasha NER (lazy-loaded to avoid import cost when not needed)
# ---------------------------------------------------------------------------

_NER_TAGGER = None
_MORPH_TAGGER = None
_SEGMENTER = None
_EMB = None


def _get_ner():
    global _NER_TAGGER, _MORPH_TAGGER, _SEGMENTER, _EMB
    if _NER_TAGGER is None:
        from natasha import Segmenter, NewsEmbedding, NewsMorphTagger, NewsNERTagger
        _SEGMENTER = Segmenter()
        _EMB = NewsEmbedding()
        _MORPH_TAGGER = NewsMorphTagger(_EMB)
        _NER_TAGGER = NewsNERTagger(_EMB)
    return _SEGMENTER, _MORPH_TAGGER, _NER_TAGGER


def _run_ner(text: str) -> list[tuple[str, str]]:
    """Returns list of (type, text) for named entities. PER/ORG/LOC."""
    from natasha import Doc
    segmenter, morph_tagger, ner_tagger = _get_ner()
    # Natasha struggles with very long texts — chunk to first 8000 chars
    chunk = text[:8000]
    doc = Doc(chunk)
    doc.segment(segmenter)
    doc.tag_morph(morph_tagger)
    doc.tag_ner(ner_tagger)
    return [(span.type, span.text) for span in doc.spans]


# ---------------------------------------------------------------------------
# С — Содержательность (simplest, compute first)
# ---------------------------------------------------------------------------

def _score_s(text: str, soup: BeautifulSoup, schemas: list[dict]) -> tuple[int, dict]:
    sigs: dict = {}

    # Word count (textstat)
    words = textstat.lexicon_count(text, removepunct=True)
    sigs["word_count"] = words
    if words < 100:
        wc_score = 0
    elif words < 300:
        wc_score = 10
    elif words < 500:
        wc_score = 40
    elif words < 1500:
        wc_score = 65
    else:
        wc_score = 85

    # Heading structure
    h2s = len(soup.find_all("h2"))
    h3s = len(soup.find_all("h3"))
    sigs["h2_count"] = h2s
    sigs["h3_count"] = h3s
    heading_bonus = 0
    if h2s >= 3:
        heading_bonus = 10
    if h2s >= 6:
        heading_bonus = 15

    # Lists
    lists = len(soup.find_all(["ul", "ol"]))
    sigs["list_count"] = lists
    list_bonus = min(lists * 5, 10)

    # FAQPage / HowTo schema
    has_faq = _has_schema_type(schemas, "faqpage", "howto", "speakable")
    sigs["has_faq_schema"] = has_faq
    schema_bonus = 15 if has_faq else 0

    # Flesch readability (textstat supports RU via syllable heuristics)
    try:
        flesch = textstat.flesch_reading_ease(text)
        sigs["flesch_score"] = round(flesch, 1)
        readability_bonus = 5 if 40 <= flesch <= 70 else 0
    except Exception:
        sigs["flesch_score"] = None
        readability_bonus = 0

    raw = wc_score + heading_bonus + list_bonus + schema_bonus + readability_bonus
    score = min(100, max(0, raw))
    sigs["s_raw"] = raw
    return score, sigs


# ---------------------------------------------------------------------------
# П — Полезность
# ---------------------------------------------------------------------------

_POPUP_PATTERNS = re.compile(
    r"(z-?index\s*:\s*[1-9]\d{3,}|position\s*:\s*fixed.*overlay|modal|cookie-banner|popup|interstitial)",
    re.IGNORECASE,
)

_AUTH_DOMAINS = re.compile(
    r"\.(gov|edu|ac\.|wikipedia\.org|rbc\.ru|kommersant\.ru|habr\.com|tass\.ru|vedomosti\.ru)",
    re.IGNORECASE,
)


def _score_p(html: str, soup: BeautifulSoup, url: str, text: str) -> tuple[int, dict]:
    sigs: dict = {}

    # HTTPS
    is_https = url.startswith("https://")
    sigs["is_https"] = is_https
    https_pts = 10 if is_https else 0

    # Mobile viewport
    viewport = soup.find("meta", attrs={"name": re.compile(r"viewport", re.I)})
    sigs["has_viewport"] = bool(viewport)
    viewport_pts = 15 if viewport else 0

    # H1 exists
    h1 = soup.find("h1")
    sigs["has_h1"] = bool(h1)
    h1_pts = 10 if h1 else 0

    # Answer-first heuristic: first 1500 chars of text is substantial
    first_chunk = text[:1500].strip()
    sigs["first_chunk_len"] = len(first_chunk)
    answer_first_pts = 20 if len(first_chunk) >= 200 else 0

    # Intrusive popup check (inline CSS pattern scan)
    raw_html_chunk = html[:50000]
    popup_detected = bool(_POPUP_PATTERNS.search(raw_html_chunk))
    sigs["popup_detected"] = popup_detected
    popup_pts = -20 if popup_detected else 20

    # Content not pathologically thin
    words = textstat.lexicon_count(text, removepunct=True)
    thin_penalty = -30 if words < 100 else 0
    sigs["thin_penalty"] = thin_penalty

    # External authoritative links
    ext_links = [
        a.get("href", "") for a in soup.find_all("a", href=True)
        if a["href"].startswith("http") and urlparse(url).netloc not in a["href"]
    ]
    auth_links = [l for l in ext_links if _AUTH_DOMAINS.search(l)]
    sigs["external_links"] = len(ext_links)
    sigs["authoritative_links"] = len(auth_links)

    raw = https_pts + viewport_pts + h1_pts + answer_first_pts + popup_pts + thin_penalty
    score = min(100, max(0, raw))
    sigs["p_raw"] = raw
    return score, sigs


# ---------------------------------------------------------------------------
# Э — Экспертность
# ---------------------------------------------------------------------------

def _score_e(text: str, soup: BeautifulSoup, schemas: list[dict]) -> tuple[int, dict]:
    sigs: dict = {}

    # Person schema with credentials
    author = _author_schema(schemas)
    sigs["has_author_schema"] = bool(author)
    author_pts = 0
    if author:
        author_pts = 30
        has_credentials = bool(
            author.get("jobTitle") or author.get("affiliation") or
            author.get("description") or author.get("sameAs")
        )
        sigs["author_has_credentials"] = has_credentials
        if has_credentials:
            author_pts = 50  # author + credentials together
    else:
        sigs["author_has_credentials"] = False

    # Organization schema
    has_org = _has_schema_type(schemas, "organization", "localbusiness", "brand")
    sigs["has_org_schema"] = has_org
    org_pts = 15 if has_org else 0

    # NER: named entities and numeric facts
    try:
        entities = _run_ner(text)
        ner_types = [e[0] for e in entities]
        words = max(1, textstat.lexicon_count(text, removepunct=True))
        per_count = ner_types.count("PER")
        org_count = ner_types.count("ORG")
        loc_count = ner_types.count("LOC")
        sigs["ner_per"] = per_count
        sigs["ner_org"] = org_count
        sigs["ner_loc"] = loc_count

        # Numeric facts: digits in text / 100 words
        numeric_count = len(re.findall(r"\b\d+[.,]?\d*\b", text))
        numeric_density = numeric_count / (words / 100)
        sigs["numeric_density"] = round(numeric_density, 2)

        # NER density per 100 words
        entity_density = len(entities) / (words / 100)
        sigs["entity_density"] = round(entity_density, 2)

        # Numeric fact score (0-20)
        numeric_pts = min(20, int(numeric_density * 4))
        # Entity density score (0-20)
        entity_pts = min(20, int(entity_density * 5))

    except Exception as exc:
        sigs["ner_error"] = str(exc)
        numeric_pts = 0
        entity_pts = 0

    # External authoritative links (reuse from П is not available here, recalc)
    ext_links = [
        a.get("href", "") for a in soup.find_all("a", href=True)
        if a.get("href", "").startswith("http")
    ]
    auth_links = [l for l in ext_links if _AUTH_DOMAINS.search(l)]
    sigs["e_auth_links"] = len(auth_links)
    auth_pts = min(15, len(auth_links) * 5)

    raw = author_pts + org_pts + numeric_pts + entity_pts + auth_pts
    score = min(100, max(0, raw))
    sigs["e_raw"] = raw
    return score, sigs


# ---------------------------------------------------------------------------
# О — Оригинальность (lexical-only for v0.1, semantic similarity in v0.2)
# ---------------------------------------------------------------------------

_RU_STOPWORDS = frozenset([
    "и", "в", "не", "на", "с", "что", "а", "по", "это", "из",
    "как", "к", "от", "но", "за", "то", "так", "его", "для", "же",
    "все", "о", "об", "из", "или", "при", "он", "она", "они", "мы",
    "я", "ты", "вы", "был", "была", "было", "были", "есть", "будет",
    "свой", "своей", "своего", "этот", "эта", "эти", "того", "той",
])

# Generic catalog boilerplate bigrams (for gosmax-style pages)
_CATALOG_BOILERPLATE = frozenset([
    "бот для", "в мессенджере", "скачать приложение", "установить бесплатно",
    "перейти к", "официальный сайт", "подробнее о", "читать далее",
    "все боты", "каталог ботов",
])


def _tokenize_simple(text: str) -> list[str]:
    """Simple whitespace + punctuation tokenizer for RU text."""
    tokens = re.findall(r"[а-яёА-ЯЁa-zA-Z0-9]+", text.lower())
    return [t for t in tokens if len(t) > 2 and t not in _RU_STOPWORDS]


def _score_o(text: str) -> tuple[int, dict]:
    sigs: dict = {}

    tokens = _tokenize_simple(text)
    if len(tokens) < 10:
        sigs["o_note"] = "text too short for originality scoring"
        return 10, sigs

    total_tokens = len(tokens)
    unique_tokens = len(set(tokens))
    sigs["total_tokens"] = total_tokens
    sigs["unique_tokens"] = unique_tokens

    # Type-token ratio (TTR) — higher = more diverse vocabulary
    ttr = unique_tokens / total_tokens
    sigs["ttr"] = round(ttr, 3)
    ttr_pts = min(30, int(ttr * 60))  # TTR 0.5 → 30 pts

    # Trigram uniqueness: fraction of trigrams NOT in catalog boilerplate
    trigrams: set[str] = set()
    text_lower = text.lower()
    for phrase in _CATALOG_BOILERPLATE:
        if phrase in text_lower:
            trigrams.add(phrase)
    boilerplate_hits = len(trigrams)
    sigs["boilerplate_hits"] = boilerplate_hits
    # More boilerplate = less original
    uniqueness_pts = max(0, 30 - boilerplate_hits * 5)

    # Numeric facts density as proxy for "own data"
    numeric_count = len(re.findall(r"\b\d+[.,]?\d*\b", text))
    numeric_pts = min(25, numeric_count * 2)
    sigs["numeric_count"] = numeric_count

    # Sentence length variance — formulaic pages have low variance
    sentences = [s.strip() for s in re.split(r"[.!?]", text) if len(s.strip()) > 10]
    sigs["sentence_count"] = len(sentences)
    if len(sentences) >= 3:
        lengths = [len(s.split()) for s in sentences]
        mean_len = sum(lengths) / len(lengths)
        variance = sum((l - mean_len) ** 2 for l in lengths) / len(lengths)
        std_dev = math.sqrt(variance)
        sigs["sentence_std_dev"] = round(std_dev, 1)
        variance_pts = min(15, int(std_dev * 1.5))
    else:
        sigs["sentence_std_dev"] = 0
        variance_pts = 0

    raw = ttr_pts + uniqueness_pts + numeric_pts + variance_pts
    score = min(100, max(0, raw))
    sigs["o_raw"] = raw
    sigs["o_note"] = "v0.1: lexical heuristics only. Semantic comparison vs competitors — v0.2"
    return score, sigs


# ---------------------------------------------------------------------------
# Recommendations engine
# ---------------------------------------------------------------------------

def _build_recommendations(score: EposScore) -> list[Recommendation]:
    recs: list[Recommendation] = []
    sigs = score.signals

    # Э recommendations
    if not sigs.get("has_author_schema"):
        recs.append(Recommendation(
            "Добавить JSON-LD Person schema с автором и credentials (jobTitle, sameAs)",
            30, "Э"
        ))
    elif not sigs.get("author_has_credentials"):
        recs.append(Recommendation(
            "Добавить jobTitle/affiliation/sameAs к существующей Person schema",
            15, "Э"
        ))
    if sigs.get("numeric_density", 0) < 2:
        recs.append(Recommendation(
            "Добавить конкретные цифры, факты, статистику в текст (+2 pts на каждые 10 фактов)",
            10, "Э"
        ))
    if sigs.get("e_auth_links", 0) == 0:
        recs.append(Recommendation(
            "Добавить ссылки на авторитетные источники (Habr, Wikipedia, gov.ru, официальные исследования)",
            10, "Э"
        ))

    # П recommendations
    if not sigs.get("has_viewport"):
        recs.append(Recommendation(
            "Добавить <meta name='viewport' content='width=device-width, initial-scale=1'>",
            15, "П"
        ))
    if not sigs.get("has_h1"):
        recs.append(Recommendation(
            "Добавить тег H1 с основным ключевым запросом страницы",
            10, "П"
        ))
    if sigs.get("popup_detected"):
        recs.append(Recommendation(
            "Убрать навязчивые попапы / оверлеи (Alice снижает полезность страниц с intrusive interstitials)",
            20, "П"
        ))
    if sigs.get("first_chunk_len", 0) < 200:
        recs.append(Recommendation(
            "Перенести ответ на ключевой вопрос в первые 1-2 абзаца (answer-first структура)",
            15, "П"
        ))

    # О recommendations
    if sigs.get("ttr", 0) < 0.3:
        recs.append(Recommendation(
            "Обогатить текст синонимами и LSI-словами — TTR ниже 0.3 сигнализирует об однообразии",
            15, "О"
        ))
    if sigs.get("boilerplate_hits", 0) > 2:
        recs.append(Recommendation(
            "Переписать шаблонные фразы своими словами / добавить уникальные кейсы",
            15, "О"
        ))

    # С recommendations
    word_count = sigs.get("word_count", 0)
    if word_count < 300:
        delta = max(20, 40 - score.s)
        recs.append(Recommendation(
            f"Расширить текст до минимум 300-500 слов (сейчас {word_count} слов) — добавить описание, FAQ, кейсы",
            delta, "С"
        ))
    if sigs.get("h2_count", 0) < 2:
        recs.append(Recommendation(
            "Добавить структуру H2-H4 — Alice лучше индексирует страницы с явной иерархией заголовков",
            10, "С"
        ))
    if not sigs.get("has_faq_schema"):
        recs.append(Recommendation(
            "Добавить блок FAQ + JSON-LD FAQPage schema (Яндекс рекомендует для Alice AI, +15 С)",
            15, "С"
        ))

    # Sort by impact desc, return top 5
    recs.sort(key=lambda r: r.impact, reverse=True)
    return recs[:5]


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def score_html(html: str, url: str = "") -> EposScore:
    result = EposScore(url=url)
    soup = _parse_soup(html)
    schemas = _extract_jsonld(soup)
    text = _extract_text(html)

    s_score, s_sigs = _score_s(text, soup, schemas)
    p_score, p_sigs = _score_p(html, soup, url, text)
    e_score, e_sigs = _score_e(text, soup, schemas)
    o_score, o_sigs = _score_o(text)

    result.s = s_score
    result.p = p_score
    result.e = e_score
    result.o = o_score
    result.overall = round((e_score + p_score + o_score + s_score) / 4)
    result.signals = {**s_sigs, **p_sigs, **e_sigs, **o_sigs}
    result.recommendations = _build_recommendations(result)
    return result


def score_url(url: str) -> EposScore:
    html = _fetch_html(url)
    return score_html(html, url=url)


# ---------------------------------------------------------------------------
# CLI output
# ---------------------------------------------------------------------------

_LEVEL_SYMBOL = {
    "green": "✓",
    "yellow": "⚠",
    "red": "✗",
}


def _level(score: int) -> str:
    if score >= 70:
        return "green"
    if score >= 40:
        return "yellow"
    return "red"


def _citability_label(overall: int) -> str:
    if overall >= 70:
        return "HIGH citability"
    if overall >= 50:
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

    overall_sym = _LEVEL_SYMBOL[_level(result.overall)]
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

def _ensure_utf8_stdout():
    """Force UTF-8 output on Windows where default is CP1251."""
    if hasattr(sys.stdout, "reconfigure"):
        try:
            sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        except Exception:
            pass


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
