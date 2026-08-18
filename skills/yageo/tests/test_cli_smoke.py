"""Smoke tests для CLI-флагов (click CliRunner) — offline через --html."""

import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from click.testing import CliRunner

from scripts.content_depth import main as depth_main
from scripts.epos_scorer import main as epos_main
from scripts.json_ld_validator import main as schema_main


HTML = """
<html><head>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Тест</title>
</head>
<body>
  <h1>Заголовок</h1>
  <article>
    <p>Текст на русском языке. Компания Яндекс сделала ЭПОС в 2024 году. Цена 1500 рублей.</p>
    <h2>Раздел</h2>
    <p>Ещё абзац с уникальным контентом и числами 42, 100.</p>
  </article>
</body></html>
"""


def _html_file(tmp_path):
    f = tmp_path / "page.html"
    f.write_text(HTML, encoding="utf-8")
    return str(f)


def test_epos_cli_json(tmp_path):
    res = CliRunner().invoke(epos_main, ["--html", _html_file(tmp_path), "--json"])
    assert res.exit_code == 0, res.output
    data = json.loads(res.output)
    assert "overall" in data
    assert 0 <= data["overall"] <= 100
    assert isinstance(data["recommendations"], list)


def test_epos_cli_no_args_exits_nonzero():
    res = CliRunner().invoke(epos_main, [])
    assert res.exit_code == 1   # без url/--html — ошибка


def test_content_depth_cli_json(tmp_path):
    res = CliRunner().invoke(depth_main, ["--html", _html_file(tmp_path), "--json"])
    assert res.exit_code == 0, res.output
    data = json.loads(res.output)
    assert "total_words" in data
    assert "sections" in data


def test_schema_cli_json(tmp_path):
    res = CliRunner().invoke(schema_main, ["--html", _html_file(tmp_path), "--json"])
    assert res.exit_code == 0, res.output
    data = json.loads(res.output)
    assert "overall_score" in data
