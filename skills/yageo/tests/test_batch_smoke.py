"""Smoke tests для batch_audit — offline (score_url и usp замоканы)."""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from scripts import batch_audit
from scripts.batch_audit import _run_batch, _score_page, _save_csv, _fetch_sitemap_urls, PageResult
from scripts.epos_scorer import EposScore


def _fake_score(url: str) -> EposScore:
    return EposScore(url=url, e=50, p=60, o=70, s=80, overall=65)


def test_score_page_success(monkeypatch):
    monkeypatch.setattr(batch_audit, "score_url", _fake_score)
    r = _score_page("https://x.ru/a")
    assert r.url == "https://x.ru/a"
    assert r.overall == 65
    assert r.error == ""


def test_score_page_error_is_caught(monkeypatch):
    def boom(url):
        raise RuntimeError("network down")
    monkeypatch.setattr(batch_audit, "score_url", boom)
    r = _score_page("https://x.ru/a")
    assert r.error          # ошибка попала в поле, не выброшена
    assert r.overall == 0


def test_run_batch_parallel(monkeypatch):
    monkeypatch.setattr(batch_audit, "score_url", _fake_score)
    urls = [f"https://x.ru/page{i}" for i in range(5)]
    results = _run_batch(urls, workers=3)
    assert len(results) == 5
    assert {r.url for r in results} == set(urls)   # все обработаны, ничего не потеряно
    assert all(r.overall == 65 for r in results)


def test_save_csv(tmp_path):
    results = [
        PageResult(url="https://x.ru/a", e=1, p=2, o=3, s=4, overall=2),
        PageResult(url="https://x.ru/b", error="boom"),
    ]
    out = tmp_path / "r.csv"
    _save_csv(results, str(out))
    content = out.read_text(encoding="utf-8")
    assert "url,e,p,o,s,overall,error" in content
    assert "https://x.ru/a" in content
    assert "boom" in content


def test_fetch_sitemap_fallback_on_error(monkeypatch):
    import usp.tree

    def boom(url):
        raise RuntimeError("no sitemap")
    monkeypatch.setattr(usp.tree, "sitemap_tree_for_homepage", boom)
    urls = _fetch_sitemap_urls("https://x.ru/", limit=10)
    assert urls == ["https://x.ru/"]   # fallback на домашнюю страницу


def test_fetch_sitemap_success_and_limit(monkeypatch):
    import usp.tree

    class _Page:
        def __init__(self, u):
            self.url = u

    class _Tree:
        def all_pages(self):
            return [_Page("https://x.ru/a"), _Page("https://x.ru/b"), _Page("")]

    monkeypatch.setattr(usp.tree, "sitemap_tree_for_homepage", lambda url: _Tree())
    urls = _fetch_sitemap_urls("https://x.ru/", limit=None)
    assert urls == ["https://x.ru/a", "https://x.ru/b"]   # пустой url отфильтрован
    assert _fetch_sitemap_urls("https://x.ru/", limit=1) == ["https://x.ru/a"]
