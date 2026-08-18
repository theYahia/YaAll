"""Тесты ревизованных эвристик (item 5) + LSI-профилей (item 3) — offline."""

import copy
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from scripts import content_depth, epos_scorer
from scripts.config import DEFAULTS
from scripts.content_depth import _compute_lsi
from scripts.epos_scorer import _strip_comments, score_html


# --- 5a: popup false-positive на закомментированном CSS ------------------------

def test_strip_comments_removes_css_and_html_comments():
    out = _strip_comments("<!-- modal here --> body /* position: fixed; z-index: 9999 */ end")
    assert "modal" not in out
    assert "z-index" not in out
    assert "body" in out and "end" in out


def test_commented_popup_not_detected():
    html = ("<html><head><style>/* .x{position: fixed; z-index: 99999;} modal popup */</style></head>"
            "<body><h1>Тест</h1><p>Обычный текст страницы без попапов.</p></body></html>")
    assert score_html(html, "https://x.ru/").signals["popup_detected"] is False


def test_real_popup_still_detected():
    html = ("<html><head><style>.m{position: fixed; z-index: 99999;}</style></head>"
            "<body><div class='modal'>привет</div><h1>Тест</h1><p>текст</p></body></html>")
    assert score_html(html, "https://x.ru/").signals["popup_detected"] is True


# --- 5b: Flesch отключаемый -----------------------------------------------------

def test_flesch_disabled_zeroes_score(monkeypatch):
    html = "<html><body><h1>Тест</h1><p>" + ("слово предложение текст " * 80) + "</p></body></html>"
    base = score_html(html, "https://x.ru/")
    custom = copy.deepcopy(DEFAULTS)
    custom["content"]["flesch_enabled"] = False
    monkeypatch.setattr(epos_scorer, "CFG", custom)
    off = score_html(html, "https://x.ru/")
    assert off.signals["flesch_score"] is None
    assert off.signals["s_raw"] <= base.signals["s_raw"]   # бонус убран или его не было


# --- 5c: numeric уцелел при сбое загрузки NER ----------------------------------

def test_numeric_survives_ner_failure(monkeypatch):
    def boom(text):
        raise RuntimeError("Natasha model load failed")
    monkeypatch.setattr(epos_scorer, "_run_ner", boom)
    html = "<html><body><h1>Тест</h1><p>Числа 10, 20, 30, 40, 50, 60 на странице.</p></body></html>"
    s = score_html(html, "https://x.ru/")
    assert s.signals.get("ner_error")                 # сбой зафиксирован
    assert s.signals.get("numeric_density", 0) > 0    # numeric посчитан несмотря на сбой NER
    assert s.e >= 0                                    # скоринг не упал


# --- 5d: TTR по леммам (opt-in) -------------------------------------------------

def test_lemmatize_ttr_opt_in_lowers_or_equals_ttr(monkeypatch):
    # Текст с обилием словоформ одной леммы: дом/дома/дому/домом/доме.
    html = ("<html><body><h1>Дом</h1><p>"
            "дом дома дому домом доме работа работы работе работу машина машины машине"
            "</p></body></html>")
    base = score_html(html, "https://x.ru/").signals["ttr"]          # по словоформам
    custom = copy.deepcopy(DEFAULTS)
    custom["originality"]["lemmatize_ttr"] = True
    monkeypatch.setattr(epos_scorer, "CFG", custom)
    lem = score_html(html, "https://x.ru/").signals["ttr"]           # по леммам
    # лемматизация только склеивает типы → unique ↓, total =, значит TTR не растёт
    assert lem <= base + 1e-9


# --- item 3: LSI-профили --------------------------------------------------------

def test_lsi_default_profile_for_generic_url():
    cov, found, _ = _compute_lsi("заголовок структура раздел и автор", "https://example.ru/article/")
    assert "заголовок" in found
    assert "бот" not in found        # catalog-термин отсутствует в default-наборе


def test_lsi_catalog_profile_by_url_marker():
    cov, found, _ = _compute_lsi("бот команда функция мессенджер", "https://gosmax.ru/catalog/x/")
    assert "бот" in found            # профиль catalog выбран по url_marker


def test_lsi_custom_profile(monkeypatch):
    custom = copy.deepcopy(DEFAULTS)
    custom["lsi"]["profiles"] = [
        {"name": "med", "url_markers": ["clinic"], "keywords": ["диагноз", "симптом", "лечение"]}
    ]
    monkeypatch.setattr(content_depth, "CFG", custom)
    cov, found, _ = _compute_lsi("симптом и лечение подробно описаны", "https://clinic.ru/page/")
    assert "симптом" in found and "лечение" in found
