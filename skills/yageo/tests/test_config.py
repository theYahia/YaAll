"""Тесты конфига ЭПОС (scripts/config.py) — offline.

Гарантируют: shipped TOML == DEFAULTS (нет дрейфа), фолбэк на дефолты при отсутствии/порче файла,
и что кастомный конфиг реально меняет скоринг (а не игнорируется).
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import copy
from pathlib import Path

from scripts.config import DEFAULTS, load_config
from scripts.epos_scorer import _bucket, score_html


_REPO = Path(__file__).resolve().parent.parent
_SHIPPED_TOML = _REPO / "yageo" / "epos_config.toml"

MINIMAL_HTML = (
    "<html><head><meta name='viewport' content='width=device-width, initial-scale=1'></head>"
    "<body><h1>Заголовок</h1><article>"
    "<p>Текст на русском. Компания Яндекс сделала ЭПОС в 2024 году. Цена 1500 рублей. Иван Иванов.</p>"
    "<h2>Раздел</h2><p>Ещё абзац с уникальным контентом и числами 42, 100.</p>"
    "</article></body></html>"
)


def test_shipped_toml_matches_defaults():
    """yageo/epos_config.toml не должен дрейфовать от встроенных DEFAULTS."""
    assert _SHIPPED_TOML.exists(), "shipped epos_config.toml отсутствует"
    merged = load_config(_SHIPPED_TOML)
    assert merged == DEFAULTS, "TOML разошёлся с DEFAULTS — синхронизируй config.py и epos_config.toml"


def test_defaults_used_when_file_missing():
    cfg = load_config(_REPO / "does-not-exist.toml")
    assert cfg == DEFAULTS


def test_corrupt_toml_falls_back_to_defaults(tmp_path):
    bad = tmp_path / "bad.toml"
    bad.write_text("this is = = not valid toml [[[", encoding="utf-8")
    cfg = load_config(bad)
    assert cfg == DEFAULTS  # повреждённый файл не должен ронять скоринг


def test_partial_override_deep_merges(tmp_path):
    part = tmp_path / "part.toml"
    part.write_text("[usefulness]\nhttps_pts = 99\n", encoding="utf-8")
    cfg = load_config(part)
    assert cfg["usefulness"]["https_pts"] == 99          # переопределилось
    assert cfg["usefulness"]["viewport_pts"] == DEFAULTS["usefulness"]["viewport_pts"]  # остальное из дефолтов
    assert cfg["content"] == DEFAULTS["content"]         # другие секции нетронуты


def test_bucket_helper():
    thresholds = [100, 300, 500, 1500]
    scores = [0, 10, 40, 65, 85]
    assert _bucket(50, thresholds, scores) == 0
    assert _bucket(100, thresholds, scores) == 10   # >= порога → следующий бакет
    assert _bucket(299, thresholds, scores) == 10
    assert _bucket(300, thresholds, scores) == 40
    assert _bucket(1499, thresholds, scores) == 65
    assert _bucket(5000, thresholds, scores) == 85


def test_custom_config_changes_scoring(monkeypatch):
    """Скоринг реально читает CFG: обнуление https_pts уменьшает p_raw ровно на дефолтные 10."""
    from scripts import epos_scorer

    base_raw = score_html(MINIMAL_HTML, "https://x.ru/").signals["p_raw"]

    custom = copy.deepcopy(DEFAULTS)
    custom["usefulness"]["https_pts"] = 0
    monkeypatch.setattr(epos_scorer, "CFG", custom)

    new_raw = score_html(MINIMAL_HTML, "https://x.ru/").signals["p_raw"]
    assert new_raw == base_raw - DEFAULTS["usefulness"]["https_pts"]
