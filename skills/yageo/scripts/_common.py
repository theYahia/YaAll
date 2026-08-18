"""
Shared helpers for YaGEO scorer scripts.

Consolidates code that was previously duplicated across epos_scorer.py,
content_depth.py, json_ld_validator.py, audit.py and batch_audit.py:
  - _ensure_utf8_stdout: force UTF-8 stdout on Windows (default CP1251)
  - BROWSER_HEADERS: Chrome-like request headers with ru-RU Accept-Language
  - fetch_html: GET a URL and return decoded HTML
  - extract_text: main-content text extraction (trafilatura primary, BS4 fallback)
"""

from __future__ import annotations

import sys

import requests
import trafilatura
from bs4 import BeautifulSoup

from scripts.cache import get as _cache_get, put as _cache_put


# Chrome-like headers used by the page-scoring scripts (epos / content_depth /
# json_ld_validator). The crawler check uses its own bot-identifying UA.
BROWSER_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "ru-RU,ru;q=0.9",
}


def ensure_utf8_stdout() -> None:
    """Force UTF-8 output on Windows where the default console is CP1251."""
    if hasattr(sys.stdout, "reconfigure"):
        try:
            sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        except Exception:
            pass


# OK / WARN / BAD glyphs shared by the CLI reports (content_depth, crawler check).
# json_ld_validator extends this with an extra "info" key; audit uses a different
# HIGH/MEDIUM/LOW set — those keep their own local maps.
STATUS_SYMBOLS = {"ok": "✓", "warn": "⚠", "bad": "✗"}


def status_symbol(condition: bool, warn_only: bool = False) -> str:
    """✓ if condition else ⚠ (warn_only) / ✗. Shared CLI status glyph helper."""
    if condition:
        return STATUS_SYMBOLS["ok"]
    return STATUS_SYMBOLS["warn"] if warn_only else STATUS_SYMBOLS["bad"]


def fetch_html(url: str, timeout: int = 15) -> str:
    """GET ``url`` with browser headers and return the decoded HTML body.

    Если включён файловый кэш (см. ``scripts.cache``, opt-in через env), повторные загрузки того же
    URL берутся из кэша вместо сети. По умолчанию кэш выключен — поведение не меняется.
    """
    cached = _cache_get(url)
    if cached is not None:
        return cached
    resp = requests.get(url, headers=BROWSER_HEADERS, timeout=timeout)
    resp.raise_for_status()
    resp.encoding = resp.apparent_encoding or "utf-8"
    html = resp.text
    _cache_put(url, html)
    return html


def extract_text(html: str) -> str:
    """Extract main content text. trafilatura primary, BeautifulSoup fallback."""
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
