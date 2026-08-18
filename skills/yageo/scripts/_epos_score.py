"""Scoring engine for the ЭПОС scorer (extracted from epos_scorer.py).

Holds the Natasha NER/morph lazy-loaders, the four criterion scorers
(С/П/Э/О), the recommendations builder, and the public ``score_html`` /
``score_url`` entrypoints. All re-exported by ``scripts.epos_scorer``.

Config + NER indirection note
-----------------------------
Tests monkeypatch ``scripts.epos_scorer.CFG`` and ``scripts.epos_scorer._run_ner``
and re-invoke ``score_html``. To honour that contract after the split, every
config read and every NER call here resolves through the *facade* module object
(``scripts.epos_scorer``) at call-time — never via a local ``CFG`` binding — so a
patched ``epos_scorer.CFG`` / ``epos_scorer._run_ner`` is seen here too.

The module-level regex / frozenset constants below are built at import from the
live ``CFG`` exactly as the original module did (same load-time semantics).
"""

from __future__ import annotations

import math
import re
from urllib.parse import urlparse

import textstat

from scripts._common import extract_text as _extract_text, fetch_html as _fetch_html
from scripts.config import CFG
from scripts._epos_types import EposScore, Recommendation
from scripts._epos_parse import (
    _bucket,
    _parse_soup,
    _extract_jsonld,
    _has_schema_type,
    _author_schema,
)


def _facade():
    """Return the facade module (scripts.epos_scorer) for live CFG / _run_ner.

    Imported lazily to avoid a circular import at module-load time; by the time
    any scorer runs, the facade is fully initialised.
    """
    import scripts.epos_scorer as _f
    return _f


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
    # Natasha struggles with very long texts — chunk to first N chars
    chunk = text[:_facade().CFG["expertise"]["ner_chunk_chars"]]
    doc = Doc(chunk)
    doc.segment(segmenter)
    doc.tag_morph(morph_tagger)
    doc.tag_ner(ner_tagger)
    return [(span.type, span.text) for span in doc.spans]


# ---------------------------------------------------------------------------
# С — Содержательность (simplest, compute first)
# ---------------------------------------------------------------------------

def _score_s(text: str, soup, schemas: list[dict]) -> tuple[int, dict]:
    c = _facade().CFG["content"]
    sigs: dict = {}

    # Word count (textstat)
    words = textstat.lexicon_count(text, removepunct=True)
    sigs["word_count"] = words
    wc_score = _bucket(words, c["word_count_thresholds"], c["word_count_scores"])

    # Heading structure
    h2s = len(soup.find_all("h2"))
    h3s = len(soup.find_all("h3"))
    sigs["h2_count"] = h2s
    sigs["h3_count"] = h3s
    heading_bonus = 0
    if h2s >= c["h2_min_low"]:
        heading_bonus = c["h2_bonus_low"]
    if h2s >= c["h2_min_high"]:
        heading_bonus = c["h2_bonus_high"]

    # Lists
    lists = len(soup.find_all(["ul", "ol"]))
    sigs["list_count"] = lists
    list_bonus = min(lists * c["list_bonus_per"], c["list_bonus_cap"])

    # FAQPage / HowTo schema
    has_faq = _has_schema_type(schemas, "faqpage", "howto", "speakable")
    sigs["has_faq_schema"] = has_faq
    schema_bonus = c["schema_bonus"] if has_faq else 0

    # Flesch readability. textstat использует англо-эвристику слогов → для русского ненадёжно;
    # бонус можно отключить (flesch_enabled=false), тогда он не влияет на С.
    if c.get("flesch_enabled", True):
        try:
            flesch = textstat.flesch_reading_ease(text)
            sigs["flesch_score"] = round(flesch, 1)
            readability_bonus = c["flesch_bonus"] if c["flesch_min"] <= flesch <= c["flesch_max"] else 0
        except Exception:
            sigs["flesch_score"] = None
            readability_bonus = 0
    else:
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
    r"\.(" + "|".join(CFG["lexicon"]["auth_domains"]) + r")",
    re.IGNORECASE,
)

# Комментарии HTML/CSS вырезаем перед сканом попапов: иначе закомментированный CSS
# (напр. `/* z-index: 9999 */`) даёт ложное срабатывание popup_detected.
_COMMENT_RE = re.compile(r"<!--.*?-->|/\*.*?\*/", re.DOTALL)


def _strip_comments(html: str) -> str:
    return _COMMENT_RE.sub(" ", html)


def _score_p(html: str, soup, url: str, text: str) -> tuple[int, dict]:
    u = _facade().CFG["usefulness"]
    sigs: dict = {}

    # HTTPS
    is_https = url.startswith("https://")
    sigs["is_https"] = is_https
    https_pts = u["https_pts"] if is_https else 0

    # Mobile viewport
    viewport = soup.find("meta", attrs={"name": re.compile(r"viewport", re.I)})
    sigs["has_viewport"] = bool(viewport)
    viewport_pts = u["viewport_pts"] if viewport else 0

    # H1 exists
    h1 = soup.find("h1")
    sigs["has_h1"] = bool(h1)
    h1_pts = u["h1_pts"] if h1 else 0

    # Answer-first heuristic: first N chars of text is substantial
    first_chunk = text[:u["answer_first_slice"]].strip()
    sigs["first_chunk_len"] = len(first_chunk)
    answer_first_pts = u["answer_first_pts"] if len(first_chunk) >= u["answer_first_min_chars"] else 0

    # Intrusive popup check (inline CSS pattern scan; комментарии вырезаны → меньше false-positive)
    raw_html_chunk = _strip_comments(html[:u["popup_scan_chars"]])
    popup_detected = bool(_POPUP_PATTERNS.search(raw_html_chunk))
    sigs["popup_detected"] = popup_detected
    popup_pts = u["popup_detected_pts"] if popup_detected else u["popup_clean_pts"]

    # Content not pathologically thin
    words = textstat.lexicon_count(text, removepunct=True)
    thin_penalty = u["thin_penalty"] if words < u["thin_word_threshold"] else 0
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

def _score_e(text: str, soup, schemas: list[dict]) -> tuple[int, dict]:
    x = _facade().CFG["expertise"]
    sigs: dict = {}

    # Person schema with credentials
    author = _author_schema(schemas)
    sigs["has_author_schema"] = bool(author)
    author_pts = 0
    if author:
        author_pts = x["author_pts"]
        has_credentials = bool(
            author.get("jobTitle") or author.get("affiliation") or
            author.get("description") or author.get("sameAs")
        )
        sigs["author_has_credentials"] = has_credentials
        if has_credentials:
            author_pts = x["author_with_creds_pts"]  # author + credentials together
    else:
        sigs["author_has_credentials"] = False

    # Organization schema
    has_org = _has_schema_type(schemas, "organization", "localbusiness", "brand")
    sigs["has_org_schema"] = has_org
    org_pts = x["org_pts"] if has_org else 0

    words = max(1, textstat.lexicon_count(text, removepunct=True))

    # Numeric facts: digits / 100 words. Это regex, НЕ зависит от Natasha — считаем всегда,
    # чтобы сбой загрузки NER-модели не обнулял заодно и numeric_pts.
    numeric_count = len(re.findall(r"\b\d+[.,]?\d*\b", text))
    numeric_density = numeric_count / (words / 100)
    sigs["numeric_density"] = round(numeric_density, 2)
    numeric_pts = min(x["numeric_density_cap"], int(numeric_density * x["numeric_density_mult"]))

    # Named entities (Natasha NER). При сбое загрузки модели — graceful: entity_pts=0, numeric уцелел.
    try:
        entities = _facade()._run_ner(text)
        ner_types = [e[0] for e in entities]
        sigs["ner_per"] = ner_types.count("PER")
        sigs["ner_org"] = ner_types.count("ORG")
        sigs["ner_loc"] = ner_types.count("LOC")

        # NER density per 100 words
        entity_density = len(entities) / (words / 100)
        sigs["entity_density"] = round(entity_density, 2)
        entity_pts = min(x["entity_density_cap"], int(entity_density * x["entity_density_mult"]))

    except Exception as exc:
        sigs["ner_error"] = str(exc)
        sigs["entity_density"] = 0
        entity_pts = 0

    # External authoritative links (reuse from П is not available here, recalc)
    ext_links = [
        a.get("href", "") for a in soup.find_all("a", href=True)
        if a.get("href", "").startswith("http")
    ]
    auth_links = [l for l in ext_links if _AUTH_DOMAINS.search(l)]
    sigs["e_auth_links"] = len(auth_links)
    auth_pts = min(x["auth_link_cap"], len(auth_links) * x["auth_link_pts_per"])

    raw = author_pts + org_pts + numeric_pts + entity_pts + auth_pts
    score = min(100, max(0, raw))
    sigs["e_raw"] = raw
    return score, sigs


# ---------------------------------------------------------------------------
# О — Оригинальность (lexical-only for v0.1, semantic similarity in v0.2)
# ---------------------------------------------------------------------------

_RU_STOPWORDS = frozenset(CFG["lexicon"]["stopwords"])

# Generic catalog boilerplate bigrams (for gosmax-style pages)
_CATALOG_BOILERPLATE = frozenset(CFG["lexicon"]["catalog_boilerplate"])


def _tokenize_simple(text: str) -> list[str]:
    """Simple whitespace + punctuation tokenizer for RU text."""
    tokens = re.findall(r"[а-яёА-ЯЁa-zA-Z0-9]+", text.lower())
    return [t for t in tokens if len(t) > 2 and t not in _RU_STOPWORDS]


_MORPH_VOCAB = None


def _get_morph_vocab():
    global _MORPH_VOCAB
    if _MORPH_VOCAB is None:
        from natasha import MorphVocab
        _MORPH_VOCAB = MorphVocab()
    return _MORPH_VOCAB


def _lemmatize_tokens(text: str) -> list[str]:
    """Леммы значимых токенов через Natasha — для TTR по леммам (opt-in: lemmatize_ttr).

    «жил/жила/жили» → одна лемма, поэтому TTR честнее отражает разнообразие. Фолбэк на словоформы
    (_tokenize_simple) при любой ошибке Natasha — О не должна зависеть от загрузки модели.
    """
    try:
        from natasha import Doc
        segmenter, morph_tagger, _ = _get_ner()
        morph_vocab = _get_morph_vocab()
        doc = Doc(text[:_facade().CFG["expertise"]["ner_chunk_chars"]])
        doc.segment(segmenter)
        doc.tag_morph(morph_tagger)
        lemmas: list[str] = []
        for token in doc.tokens:
            token.lemmatize(morph_vocab)
            lemma = (token.lemma or token.text).lower()
            if len(lemma) > 2 and lemma not in _RU_STOPWORDS:
                lemmas.append(lemma)
        return lemmas or _tokenize_simple(text)
    except Exception:
        return _tokenize_simple(text)


def _score_o(text: str) -> tuple[int, dict]:
    o = _facade().CFG["originality"]
    sigs: dict = {}

    tokens = _lemmatize_tokens(text) if o.get("lemmatize_ttr") else _tokenize_simple(text)
    if len(tokens) < o["min_tokens"]:
        sigs["o_note"] = "text too short for originality scoring"
        return o["short_text_score"], sigs

    total_tokens = len(tokens)
    unique_tokens = len(set(tokens))
    sigs["total_tokens"] = total_tokens
    sigs["unique_tokens"] = unique_tokens

    # Type-token ratio (TTR) — higher = more diverse vocabulary
    ttr = unique_tokens / total_tokens
    sigs["ttr"] = round(ttr, 3)
    ttr_pts = min(o["ttr_cap"], int(ttr * o["ttr_mult"]))  # TTR 0.5 → 30 pts

    # Trigram uniqueness: fraction of trigrams NOT in catalog boilerplate
    trigrams: set[str] = set()
    text_lower = text.lower()
    for phrase in _CATALOG_BOILERPLATE:
        if phrase in text_lower:
            trigrams.add(phrase)
    boilerplate_hits = len(trigrams)
    sigs["boilerplate_hits"] = boilerplate_hits
    # More boilerplate = less original
    uniqueness_pts = max(0, o["boilerplate_base"] - boilerplate_hits * o["boilerplate_penalty_per"])

    # Numeric facts density as proxy for "own data"
    numeric_count = len(re.findall(r"\b\d+[.,]?\d*\b", text))
    numeric_pts = min(o["numeric_cap"], numeric_count * o["numeric_mult"])
    sigs["numeric_count"] = numeric_count

    # Sentence length variance — formulaic pages have low variance
    sentences = [s.strip() for s in re.split(r"[.!?]", text) if len(s.strip()) > 10]
    sigs["sentence_count"] = len(sentences)
    if len(sentences) >= o["min_sentences_for_variance"]:
        lengths = [len(s.split()) for s in sentences]
        mean_len = sum(lengths) / len(lengths)
        variance = sum((l - mean_len) ** 2 for l in lengths) / len(lengths)
        std_dev = math.sqrt(variance)
        sigs["sentence_std_dev"] = round(std_dev, 1)
        variance_pts = min(o["sentence_std_cap"], int(std_dev * o["sentence_std_mult"]))
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
    r = _facade().CFG["recommendations"]
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
    if sigs.get("numeric_density", 0) < r["numeric_density_min"]:
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
    if sigs.get("ttr", 0) < r["ttr_min"]:
        recs.append(Recommendation(
            "Обогатить текст синонимами и LSI-словами — TTR ниже 0.3 сигнализирует об однообразии",
            15, "О"
        ))
    if sigs.get("boilerplate_hits", 0) > r["boilerplate_max"]:
        recs.append(Recommendation(
            "Переписать шаблонные фразы своими словами / добавить уникальные кейсы",
            15, "О"
        ))

    # С recommendations
    word_count = sigs.get("word_count", 0)
    if word_count < r["word_count_min"]:
        delta = max(20, 40 - score.s)
        recs.append(Recommendation(
            f"Расширить текст до минимум 300-500 слов (сейчас {word_count} слов) — добавить описание, FAQ, кейсы",
            delta, "С"
        ))
    if sigs.get("h2_count", 0) < r["h2_min"]:
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
