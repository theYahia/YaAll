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
"""

from __future__ import annotations

import json
import re
import sys
import warnings
from dataclasses import dataclass, field, asdict
from typing import Optional
from urllib.parse import urlparse

warnings.filterwarnings("ignore")

import click
import requests
import textstat
from bs4 import BeautifulSoup


# ---------------------------------------------------------------------------
# Data structures
# ---------------------------------------------------------------------------

@dataclass
class SchemaIssue:
    schema_type: str
    severity: str       # "error" | "warning" | "info"
    field: str
    message: str


@dataclass
class SchemaInfo:
    schema_type: str
    fields_present: list[str]
    issues: list[SchemaIssue]
    score: int          # 0-100 completeness


@dataclass
class SchemaReport:
    url: str
    found_schemas: list[SchemaInfo] = field(default_factory=list)
    missing_recommended: list[str] = field(default_factory=list)
    generated: list[dict] = field(default_factory=list)  # ready-to-paste JSON-LD
    overall_score: int = 0    # 0-100 weighted schema completeness
    recommendations: list[str] = field(default_factory=list)

    def to_dict(self) -> dict:
        d = asdict(self)
        d["found_schemas"] = [asdict(s) for s in self.found_schemas]
        return d


# ---------------------------------------------------------------------------
# HTTP helpers
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
    r = requests.get(url, headers=_HEADERS, timeout=timeout)
    r.raise_for_status()
    r.encoding = r.apparent_encoding or "utf-8"
    return r.text


# ---------------------------------------------------------------------------
# JSON-LD extraction
# ---------------------------------------------------------------------------

def _extract_jsonld(soup: BeautifulSoup) -> list[dict]:
    schemas = []
    for tag in soup.find_all("script", type="application/ld+json"):
        try:
            raw = tag.string or ""
            data = json.loads(raw)
            if isinstance(data, list):
                schemas.extend(data)
            elif isinstance(data, dict):
                # Handle @graph
                if "@graph" in data:
                    schemas.extend(data["@graph"])
                else:
                    schemas.append(data)
        except Exception:
            pass
    return schemas


def _schema_type(schema: dict) -> str:
    t = schema.get("@type", "")
    if isinstance(t, list):
        return t[0] if t else ""
    return str(t)


def _schemas_by_type(schemas: list[dict]) -> dict[str, list[dict]]:
    by_type: dict[str, list[dict]] = {}
    for s in schemas:
        t = _schema_type(s).lower()
        by_type.setdefault(t, []).append(s)
    return by_type


# ---------------------------------------------------------------------------
# Page metadata helpers
# ---------------------------------------------------------------------------

def _page_meta(soup: BeautifulSoup, url: str) -> dict:
    title_tag = soup.find("title")
    title = title_tag.get_text(strip=True) if title_tag else ""

    h1_tag = soup.find("h1")
    h1 = h1_tag.get_text(strip=True) if h1_tag else ""

    meta_desc = soup.find("meta", attrs={"name": re.compile(r"description", re.I)})
    description = meta_desc.get("content", "") if meta_desc else ""

    og_image = soup.find("meta", property="og:image")
    image_url = og_image.get("content", "") if og_image else ""

    meta_pubdate = soup.find("meta", attrs={"name": re.compile(r"date|pubdate|article:published", re.I)})
    pub_date = meta_pubdate.get("content", "") if meta_pubdate else ""

    parsed = urlparse(url)
    domain = f"{parsed.scheme}://{parsed.netloc}"

    return {
        "title": title,
        "h1": h1,
        "description": description,
        "image_url": image_url,
        "pub_date": pub_date,
        "url": url,
        "domain": domain,
        "path": parsed.path,
    }


# ---------------------------------------------------------------------------
# Page type detection
# ---------------------------------------------------------------------------

_APP_SIGNALS = re.compile(
    r"(приложение|скачать|установить|бот|чат-бот|chatbot|telegram|vk mini|mini app|"
    r"расширение|плагин|plugin|extension|webhook|api)",
    re.I,
)
_ARTICLE_SIGNALS = re.compile(
    r"(статья|автор|редакция|опубликовано|дата публикации|blog|article|пост)",
    re.I,
)
_LOCAL_SIGNALS = re.compile(
    r"(адрес|телефон|часы работы|режим работы|контакты|как добраться|карта|схема проезда)",
    re.I,
)
_FAQ_SIGNALS = re.compile(
    r"(часто задаваемые|вопросы и ответы|faq|вопрос.*ответ|как.*\?|что.*\?|можно ли)",
    re.I,
)


def _detect_page_types(soup: BeautifulSoup, text: str, url: str, meta: dict) -> list[str]:
    """Returns list of recommended schema types for this page."""
    types = []
    full_text = (meta.get("title", "") + " " + text).lower()
    path = url.lower()

    # Organization — always recommend for homepage or /about pages
    if (
        urlparse(url).path in ("/", "", "/about", "/about/", "/o-nas", "/o-nas/")
        or not urlparse(url).path.strip("/")
    ):
        types.append("organization")

    # Article + Person — blog/article pages
    if _ARTICLE_SIGNALS.search(full_text) or re.search(r"/(blog|article|post|news|stati)/", path):
        types.append("article")
        types.append("person")

    # LocalBusiness
    if _LOCAL_SIGNALS.search(full_text) or re.search(r"/(contact|kontakt|kontakty)/", path):
        types.append("localbusiness")

    # SoftwareApplication — bot catalog pages
    if _APP_SIGNALS.search(full_text) or re.search(r"/(catalog|app|bot|extension|plugin)/", path):
        types.append("softwareapplication")

    # FAQPage — always useful
    if _FAQ_SIGNALS.search(full_text):
        types.append("faqpage")

    # Always include FAQPage as recommended if not already there
    if "faqpage" not in types:
        types.append("faqpage")

    return list(dict.fromkeys(types))  # deduplicate, preserve order


# ---------------------------------------------------------------------------
# Schema validators
# ---------------------------------------------------------------------------

def _validate_organization(s: dict) -> SchemaInfo:
    issues: list[SchemaIssue] = []
    present = list(s.keys())

    for req in ("name", "url"):
        if req not in s or not s[req]:
            issues.append(SchemaIssue("Organization", "error", req, f"Обязательное поле '{req}' отсутствует"))

    for rec in ("logo", "sameAs", "description"):
        if rec not in s:
            issues.append(SchemaIssue("Organization", "warning", rec, f"Рекомендуемое поле '{rec}' отсутствует"))

    # Check RU sameAs
    same_as = s.get("sameAs", [])
    if isinstance(same_as, str):
        same_as = [same_as]
    ru_platforms = {"vk.com", "ok.ru", "t.me", "dzen.ru", "rutube.ru"}
    found_ru = {p for p in ru_platforms if any(p in url for url in same_as)}
    if len(found_ru) < 2:
        issues.append(SchemaIssue(
            "Organization", "warning", "sameAs",
            f"RU-платформы в sameAs: {found_ru or 'нет'}. Рекомендуется VK + Telegram + Dzen"
        ))

    score = max(0, 100 - len([i for i in issues if i.severity == "error"]) * 30
                - len([i for i in issues if i.severity == "warning"]) * 10)
    return SchemaInfo("Organization", present, issues, score)


def _validate_person(s: dict) -> SchemaInfo:
    issues = []
    present = list(s.keys())

    if not s.get("name"):
        issues.append(SchemaIssue("Person", "error", "name", "Имя автора обязательно"))

    for rec in ("jobTitle", "affiliation", "sameAs", "url"):
        if rec not in s:
            issues.append(SchemaIssue("Person", "warning", rec,
                                      f"Рекомендуемое поле '{rec}' отсутствует — снижает Э (Экспертность)"))

    score = max(0, 100 - len([i for i in issues if i.severity == "error"]) * 40
                - len([i for i in issues if i.severity == "warning"]) * 10)
    return SchemaInfo("Person", present, issues, score)


def _validate_article(s: dict) -> SchemaInfo:
    issues = []
    present = list(s.keys())

    for req in ("headline", "author", "datePublished"):
        if req not in s or not s[req]:
            issues.append(SchemaIssue("Article", "error", req, f"Обязательное поле '{req}' отсутствует"))

    for rec in ("dateModified", "image", "publisher", "description", "mainEntityOfPage"):
        if rec not in s:
            issues.append(SchemaIssue("Article", "warning", rec, f"Рекомендуемое: '{rec}'"))

    # Author completeness
    author = s.get("author", {})
    if isinstance(author, dict):
        if not author.get("jobTitle") and not author.get("affiliation"):
            issues.append(SchemaIssue("Article", "warning", "author.jobTitle",
                                      "Автор без jobTitle/affiliation — снижает Экспертность"))

    score = max(0, 100 - len([i for i in issues if i.severity == "error"]) * 25
                - len([i for i in issues if i.severity == "warning"]) * 8)
    return SchemaInfo("Article", present, issues, score)


def _validate_faqpage(s: dict) -> SchemaInfo:
    issues = []
    present = list(s.keys())

    entities = s.get("mainEntity", [])
    if not entities:
        issues.append(SchemaIssue("FAQPage", "error", "mainEntity",
                                  "Нет вопросов в mainEntity"))
        return SchemaInfo("FAQPage", present, issues, 0)

    if not isinstance(entities, list):
        entities = [entities]

    short_answers = []
    long_answers = []
    for i, q in enumerate(entities):
        if not isinstance(q, dict):
            continue
        if not q.get("name"):
            issues.append(SchemaIssue("FAQPage", "error", f"mainEntity[{i}].name", "Вопрос без текста"))
        answer = q.get("acceptedAnswer", {})
        if isinstance(answer, dict):
            answer_text = answer.get("text", "")
            wc = textstat.lexicon_count(answer_text, removepunct=True)
            if wc < 20:
                short_answers.append(i)
            elif wc > 120:
                long_answers.append(i)

    if short_answers:
        issues.append(SchemaIssue("FAQPage", "warning", "acceptedAnswer.text",
                                  f"Ответы #{short_answers} слишком короткие (<20 слов). Alice предпочитает 40-60."))
    if long_answers:
        issues.append(SchemaIssue("FAQPage", "warning", "acceptedAnswer.text",
                                  f"Ответы #{long_answers} слишком длинные (>120 слов). Сократить до 40-60."))

    score = max(0, 100 - len([i for i in issues if i.severity == "error"]) * 30
                - len([i for i in issues if i.severity == "warning"]) * 10)
    return SchemaInfo("FAQPage", present, issues, score)


def _validate_localbusiness(s: dict) -> SchemaInfo:
    issues = []
    present = list(s.keys())

    for req in ("name", "address", "telephone"):
        if req not in s or not s[req]:
            issues.append(SchemaIssue("LocalBusiness", "error", req, f"Обязательное: '{req}'"))

    address = s.get("address", {})
    if isinstance(address, dict):
        for addr_field in ("streetAddress", "addressLocality", "postalCode"):
            if not address.get(addr_field):
                issues.append(SchemaIssue("LocalBusiness", "warning", f"address.{addr_field}",
                                          f"Поле адреса '{addr_field}' пустое"))

    for rec in ("geo", "openingHoursSpecification", "sameAs"):
        if rec not in s:
            issues.append(SchemaIssue("LocalBusiness", "warning", rec, f"Рекомендуемое: '{rec}'"))

    # Check Yandex Maps in sameAs
    same_as = s.get("sameAs", [])
    if isinstance(same_as, str):
        same_as = [same_as]
    has_yandex_maps = any("yandex" in u.lower() and ("maps" in u.lower() or "org" in u.lower())
                          for u in same_as)
    if not has_yandex_maps:
        issues.append(SchemaIssue("LocalBusiness", "warning", "sameAs",
                                  "Добавить ссылку на Яндекс.Карты в sameAs"))

    score = max(0, 100 - len([i for i in issues if i.severity == "error"]) * 25
                - len([i for i in issues if i.severity == "warning"]) * 8)
    return SchemaInfo("LocalBusiness", present, issues, score)


def _validate_softwareapplication(s: dict) -> SchemaInfo:
    issues = []
    present = list(s.keys())

    for req in ("name", "applicationCategory", "operatingSystem"):
        if req not in s or not s[req]:
            issues.append(SchemaIssue("SoftwareApplication", "error", req, f"Обязательное: '{req}'"))

    for rec in ("offers", "aggregateRating", "description", "author"):
        if rec not in s:
            issues.append(SchemaIssue("SoftwareApplication", "warning", rec, f"Рекомендуемое: '{rec}'"))

    score = max(0, 100 - len([i for i in issues if i.severity == "error"]) * 30
                - len([i for i in issues if i.severity == "warning"]) * 8)
    return SchemaInfo("SoftwareApplication", present, issues, score)


_VALIDATORS = {
    "organization": _validate_organization,
    "localbusiness": _validate_localbusiness,
    "person": _validate_person,
    "article": _validate_article,
    "newsarticle": _validate_article,
    "blogposting": _validate_article,
    "faqpage": _validate_faqpage,
    "softwareapplication": _validate_softwareapplication,
}


# ---------------------------------------------------------------------------
# Schema generators (produce ready-to-paste JSON-LD from page data)
# ---------------------------------------------------------------------------

def _gen_organization(meta: dict) -> dict:
    name = meta.get("title", "").split(" — ")[0].split(" | ")[0].strip() or "Название организации"
    return {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": name,
        "url": meta.get("domain", meta.get("url", "")),
        "logo": {
            "@type": "ImageObject",
            "url": meta.get("domain", "") + "/logo.png",
            "width": 600,
            "height": 60,
        },
        "description": meta.get("description", ""),
        "sameAs": [
            "https://vk.com/YOUR_PAGE",
            "https://t.me/YOUR_CHANNEL",
            "https://ok.ru/YOUR_PAGE",
            "https://dzen.ru/YOUR_CHANNEL",
        ],
    }


def _gen_person(meta: dict) -> dict:
    return {
        "@context": "https://schema.org",
        "@type": "Person",
        "name": "Имя Автора",
        "jobTitle": "Эксперт / Должность",
        "url": meta.get("domain", "") + "/author/",
        "sameAs": [
            "https://vk.com/YOUR_PROFILE",
            "https://t.me/YOUR_PROFILE",
        ],
        "affiliation": {
            "@type": "Organization",
            "name": meta.get("title", "").split(" | ")[-1].strip() or "Название компании",
        },
    }


def _gen_faqpage(soup: BeautifulSoup) -> dict:
    """Try to auto-detect questions on page, fallback to template."""
    questions = []

    # Look for heading+paragraph FAQ pattern
    for tag in soup.find_all(["h2", "h3"]):
        heading = tag.get_text(strip=True)
        if not re.search(r"[?？]|^(что|как|когда|где|почему|зачем|кто|можно ли)", heading, re.I):
            continue
        # Get the next sibling paragraph as answer
        answer_parts = []
        for sibling in tag.next_siblings:
            if not hasattr(sibling, "name"):
                continue
            if sibling.name in ("h2", "h3", "h4"):
                break
            if sibling.name in ("p", "div"):
                text = sibling.get_text(strip=True)
                if text:
                    answer_parts.append(text)
            if len(answer_parts) >= 2:
                break
        answer_text = " ".join(answer_parts[:2])
        if answer_text:
            questions.append({
                "@type": "Question",
                "name": heading,
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": answer_text[:500],
                },
            })
        if len(questions) >= 5:
            break

    if not questions:
        questions = [
            {
                "@type": "Question",
                "name": "Вопрос 1?",
                "acceptedAnswer": {"@type": "Answer", "text": "Ответ на вопрос 1 (40-60 слов)."},
            },
            {
                "@type": "Question",
                "name": "Вопрос 2?",
                "acceptedAnswer": {"@type": "Answer", "text": "Ответ на вопрос 2 (40-60 слов)."},
            },
        ]

    return {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": questions,
    }


def _gen_software_app(meta: dict) -> dict:
    name = meta.get("h1") or meta.get("title", "").split(" — ")[0].strip()
    return {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": name,
        "description": meta.get("description", ""),
        "url": meta.get("url", ""),
        "applicationCategory": "Utility",
        "operatingSystem": "Web, Android, iOS",
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "RUB",
        },
        "author": {
            "@type": "Organization",
            "name": meta.get("domain", "").replace("https://", "").replace("http://", ""),
        },
    }


def _gen_article(meta: dict) -> dict:
    return {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": meta.get("h1") or meta.get("title", ""),
        "description": meta.get("description", ""),
        "url": meta.get("url", ""),
        "datePublished": meta.get("pub_date") or "2026-01-01",
        "dateModified": meta.get("pub_date") or "2026-01-01",
        "image": meta.get("image_url", ""),
        "author": {
            "@type": "Person",
            "name": "Имя Автора",
            "jobTitle": "Должность",
        },
        "publisher": {
            "@type": "Organization",
            "name": meta.get("domain", "").replace("https://", ""),
        },
        "mainEntityOfPage": {"@type": "WebPage", "@id": meta.get("url", "")},
    }


_GENERATORS = {
    "organization": lambda meta, soup: _gen_organization(meta),
    "person": lambda meta, soup: _gen_person(meta),
    "faqpage": lambda meta, soup: _gen_faqpage(soup),
    "softwareapplication": lambda meta, soup: _gen_software_app(meta),
    "article": lambda meta, soup: _gen_article(meta),
}


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

def _ensure_utf8_stdout():
    if hasattr(sys.stdout, "reconfigure"):
        try:
            sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        except Exception:
            pass


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
