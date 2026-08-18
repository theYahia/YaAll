"""
Простой файловый кэш загруженного HTML — чтобы не перезагружать те же URL между прогонами
(batch по одному sitemap, повторные аудиты, итеративная калибровка).

OPT-IN, по умолчанию ВЫКЛЮЧЕН (поведение и тесты не меняются). Включение:
  * ``YAGEO_CACHE_DIR=/path``  — кэш в указанной папке;
  * ``YAGEO_CACHE=1``          — кэш в ``~/.cache/yageo``.
TTL (сек) — ``YAGEO_CACHE_TTL`` (по умолчанию 3600; <0 = бессрочно).

Ключ = sha256(url). Хранится сырой HTML. Любая ошибка ввода-вывода — тихий промах (никогда не
ломает аудит). Кэш не учитывает заголовки/куки — не использовать для авторизованных страниц.
"""

from __future__ import annotations

import hashlib
import os
import time
from pathlib import Path

_TRUE = {"1", "true", "yes", "on"}


def _cache_dir() -> Path | None:
    explicit = os.environ.get("YAGEO_CACHE_DIR")
    if explicit:
        return Path(explicit)
    if os.environ.get("YAGEO_CACHE", "").lower() in _TRUE:
        return Path.home() / ".cache" / "yageo"
    return None


def _ttl_seconds() -> int:
    try:
        return int(os.environ.get("YAGEO_CACHE_TTL", "3600"))
    except ValueError:
        return 3600


def enabled() -> bool:
    return _cache_dir() is not None


def _path_for(url: str) -> Path | None:
    d = _cache_dir()
    if d is None:
        return None
    key = hashlib.sha256(url.encode("utf-8")).hexdigest()
    return d / f"{key}.html"


def get(url: str) -> str | None:
    """Возвращает кэшированный HTML или None (выключено / промах / просрочено / ошибка)."""
    path = _path_for(url)
    if path is None or not path.exists():
        return None
    ttl = _ttl_seconds()
    if ttl >= 0 and (time.time() - path.stat().st_mtime) > ttl:
        return None
    try:
        return path.read_text(encoding="utf-8")
    except Exception:
        return None


def put(url: str, html: str) -> None:
    """Сохраняет HTML в кэш (no-op если выключено; ошибки ввода-вывода проглатываются)."""
    path = _path_for(url)
    if path is None:
        return
    try:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(html, encoding="utf-8")
    except Exception:
        pass
