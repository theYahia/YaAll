"""HTML / JSON-LD parse helpers for the ЭПОС scorer (extracted from epos_scorer.py).

Config-free, network-free pure functions. Re-exported by ``scripts.epos_scorer``.
"""

from __future__ import annotations

import json
from typing import Optional

from bs4 import BeautifulSoup


def _bucket(value: float, thresholds: list, scores: list):
    """score = первый scores[i], чей thresholds[i] > value; иначе последний score."""
    for threshold, score in zip(thresholds, scores):
        if value < threshold:
            return score
    return scores[-1]


def _parse_soup(html: str) -> BeautifulSoup:
    return BeautifulSoup(html, "lxml")


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
