"""Page analysis + JSON-LD generators for the validator (extracted from json_ld_validator.py).

Holds page-metadata extraction, recommended page-type detection, and the
ready-to-paste schema generators. Re-exported by ``scripts.json_ld_validator``.
"""

from __future__ import annotations

import re
from urllib.parse import urlparse

from bs4 import BeautifulSoup


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
