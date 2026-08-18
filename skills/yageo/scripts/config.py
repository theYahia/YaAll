"""
Конфиг порогов/весов ЭПОС — калибровка без правки кода.

Значения читаются один раз при импорте модуля. Источник (по приоритету):
  1. путь из env-переменной ``YAGEO_CONFIG``;
  2. ``yageo/epos_config.toml`` в корне репозитория;
  3. встроенные ``DEFAULTS`` (поведение идентично хардкоду v0.1).

``DEFAULTS`` — канонический источник истины. TOML-файл лишь **переопределяет отдельные ключи**
(deep-merge), поэтому отсутствие, удаление или порча TOML НЕ ломают скоринг — он откатывается к
дефолтам. Так калибровка (например поднять порог word-count или сузить Flesch-окно) делается правкой
TOML, а не кода.

Парсинг TOML — через stdlib ``tomllib`` (Python 3.11+), без внешних зависимостей.
"""

from __future__ import annotations

import os
import tomllib
from pathlib import Path
from typing import Any

# ---------------------------------------------------------------------------
# DEFAULTS — точная копия значений, ранее захардкоженных в epos_scorer.py /
# content_depth.py. Менять поведение здесь нельзя без обновления тестов.
# ---------------------------------------------------------------------------

DEFAULTS: dict[str, Any] = {
    # С — Содержательность (_score_s)
    "content": {
        # бакеты word-count: score = первый, чей порог > words; иначе последний
        "word_count_thresholds": [100, 300, 500, 1500],
        "word_count_scores": [0, 10, 40, 65, 85],
        "h2_min_low": 3, "h2_bonus_low": 10,
        "h2_min_high": 6, "h2_bonus_high": 15,
        "list_bonus_per": 5, "list_bonus_cap": 10,
        "schema_bonus": 15,
        "flesch_min": 40, "flesch_max": 70, "flesch_bonus": 5,
        "flesch_enabled": True,  # Flesch ненадёжен для русского — можно отключить (бонус → 0)
    },
    # П — Полезность (_score_p)
    "usefulness": {
        "https_pts": 10,
        "viewport_pts": 15,
        "h1_pts": 10,
        "answer_first_slice": 1500, "answer_first_min_chars": 200, "answer_first_pts": 20,
        "popup_scan_chars": 50000, "popup_detected_pts": -20, "popup_clean_pts": 20,
        "thin_word_threshold": 100, "thin_penalty": -30,
        "auth_link_pts_per": 5, "auth_link_cap": 15,
    },
    # Э — Экспертность (_score_e)
    "expertise": {
        "author_pts": 30, "author_with_creds_pts": 50,
        "org_pts": 15,
        "numeric_density_mult": 4, "numeric_density_cap": 20,
        "entity_density_mult": 5, "entity_density_cap": 20,
        "auth_link_pts_per": 5, "auth_link_cap": 15,
        "ner_chunk_chars": 8000,
    },
    # О — Оригинальность (_score_o)
    "originality": {
        "min_tokens": 10, "short_text_score": 10,
        "ttr_mult": 60, "ttr_cap": 30,
        "boilerplate_base": 30, "boilerplate_penalty_per": 5,
        "numeric_mult": 2, "numeric_cap": 25,
        "min_sentences_for_variance": 3,
        "sentence_std_mult": 1.5, "sentence_std_cap": 15,
        "lemmatize_ttr": False,  # opt-in: TTR по леммам (Natasha) вместо словоформ
    },
    # Пороги срабатывания рекомендаций (_build_recommendations)
    "recommendations": {
        "numeric_density_min": 2,
        "ttr_min": 0.3,
        "boilerplate_max": 2,
        "word_count_min": 300,
        "h2_min": 2,
    },
    # Пороги уровней / citability (_level, _citability_label)
    "citability": {
        "level_high": 70, "level_medium": 40,
        "cit_high": 70, "cit_medium": 50,
    },
    # Лексические списки / доменные сигналы
    "lexicon": {
        "stopwords": [
            "и", "в", "не", "на", "с", "что", "а", "по", "это", "из",
            "как", "к", "от", "но", "за", "то", "так", "его", "для", "же",
            "все", "о", "об", "или", "при", "он", "она", "они", "мы",
            "я", "ты", "вы", "был", "была", "было", "были", "есть", "будет",
            "свой", "своей", "своего", "этот", "эта", "эти", "того", "той",
        ],
        # доменный boilerplate (под каталог типа gosmax.ru) — для скоринга О
        "catalog_boilerplate": [
            "бот для", "в мессенджере", "скачать приложение", "установить бесплатно",
            "перейти к", "официальный сайт", "подробнее о", "читать далее",
            "все боты", "каталог ботов",
        ],
        # фрагменты regex авторитетных доменов: собираются в \.(...)
        "auth_domains": [
            "gov", "edu", "ac\\.", "wikipedia\\.org", "rbc\\.ru",
            "kommersant\\.ru", "habr\\.com", "tass\\.ru", "vedomosti\\.ru",
        ],
    },
    # LSI-покрытие (content_depth). Доменная специфика живёт в данных (profiles), не в коде:
    # первый profile, чей url_marker встретился в URL, задаёт набор keywords; иначе default_keywords.
    "lsi": {
        "coverage_min": 0.5,      # порог рекомендации «низкое LSI»
        "default_keywords": [
            "заголовок", "структура", "раздел", "параграф",
            "автор", "эксперт", "источник", "исследование", "данные",
            "пример", "кейс", "инструкция", "как", "шаг",
            "алиса", "яндекс", "поиск", "ответ", "запрос",
        ],
        "profiles": [
            {
                "name": "catalog",  # каталог ботов (gosmax.ru-style)
                "url_markers": ["gosmax", "bot", "catalog"],
                "keywords": [
                    "бот", "команда", "функция", "интеграция", "api", "мессенджер",
                    "автоматизация", "сценарий", "webhook", "чат",
                    "заголовок", "структура", "раздел", "параграф", "автор", "эксперт",
                ],
            },
        ],
    },
}


# ---------------------------------------------------------------------------
# Загрузка
# ---------------------------------------------------------------------------

def _deep_merge(base: dict, over: dict) -> dict:
    """Рекурсивно накладывает ``over`` поверх ``base`` (не мутируя аргументы)."""
    out = dict(base)
    for key, val in over.items():
        if isinstance(val, dict) and isinstance(out.get(key), dict):
            out[key] = _deep_merge(out[key], val)
        else:
            out[key] = val
    return out


def _default_path() -> Path:
    env = os.environ.get("YAGEO_CONFIG")
    if env:
        return Path(env)
    return Path(__file__).resolve().parent.parent / "yageo" / "epos_config.toml"


def load_config(path: str | os.PathLike | None = None) -> dict[str, Any]:
    """Читает TOML и накладывает на ``DEFAULTS``. Возвращает дефолты, если файла нет/он повреждён."""
    p = Path(path) if path is not None else _default_path()
    if p.exists():
        try:
            with open(p, "rb") as fh:
                user = tomllib.load(fh)
            return _deep_merge(DEFAULTS, user)
        except Exception:
            # повреждённый TOML не должен ронять скоринг — откат к дефолтам
            return _deep_merge(DEFAULTS, {})
    return _deep_merge(DEFAULTS, {})


# Загружается один раз; в persistent-процессе (MCP) применяется на старте.
CFG: dict[str, Any] = load_config()
