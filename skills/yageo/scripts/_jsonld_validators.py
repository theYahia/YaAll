"""Schema.org validators for the JSON-LD validator (extracted from json_ld_validator.py).

Each ``_validate_*`` returns a ``SchemaInfo`` (issues + completeness score).
Also holds JSON-LD extraction helpers. Re-exported by ``scripts.json_ld_validator``.
"""

from __future__ import annotations

import json

import textstat
from bs4 import BeautifulSoup

from scripts._jsonld_types import SchemaIssue, SchemaInfo


# ---------------------------------------------------------------------------
# JSON-LD extraction (HTTP fetch lives in scripts._common)
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
