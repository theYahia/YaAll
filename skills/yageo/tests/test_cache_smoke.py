"""Тесты файлового HTTP-кэша (scripts/cache.py) — offline."""

import os
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from scripts import _common, cache


def test_disabled_by_default(monkeypatch):
    monkeypatch.delenv("YAGEO_CACHE", raising=False)
    monkeypatch.delenv("YAGEO_CACHE_DIR", raising=False)
    assert cache.enabled() is False
    assert cache.get("https://x.ru/") is None


def test_roundtrip(tmp_path, monkeypatch):
    monkeypatch.setenv("YAGEO_CACHE_DIR", str(tmp_path))
    assert cache.enabled() is True
    cache.put("https://x.ru/a", "<html>hi</html>")
    assert cache.get("https://x.ru/a") == "<html>hi</html>"
    assert cache.get("https://x.ru/other") is None   # промах по другому URL


def test_ttl_expiry(tmp_path, monkeypatch):
    monkeypatch.setenv("YAGEO_CACHE_DIR", str(tmp_path))
    monkeypatch.setenv("YAGEO_CACHE_TTL", "100")
    cache.put("https://x.ru/a", "data")
    p = cache._path_for("https://x.ru/a")
    old = time.time() - 500           # «состарим» файл за пределы TTL
    os.utime(p, (old, old))
    assert cache.get("https://x.ru/a") is None


def test_fetch_html_serves_second_from_cache(tmp_path, monkeypatch):
    monkeypatch.setenv("YAGEO_CACHE_DIR", str(tmp_path))
    calls = []

    class _Resp:
        def __init__(self):
            self.text = "<html>net</html>"
            self.apparent_encoding = "utf-8"
            self.encoding = "utf-8"

        def raise_for_status(self):
            pass

    def fake_get(url, **kw):
        calls.append(url)
        return _Resp()

    monkeypatch.setattr(_common.requests, "get", fake_get)
    h1 = _common.fetch_html("https://x.ru/p")
    h2 = _common.fetch_html("https://x.ru/p")
    assert h1 == h2 == "<html>net</html>"
    assert len(calls) == 1            # второй вызов обслужен из кэша, без сети
