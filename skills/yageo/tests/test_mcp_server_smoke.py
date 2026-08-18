"""
Smoke tests для MCP-сервера (scripts/mcp_server.py).

Полностью offline: проверяем регистрацию тулов, структурный dict от HTML-варианта (Natasha грузится
один раз, как и в epos-тестах) и что плохой URL возвращает структурированный {"error": ...} dict, а не
роняет тул. Сеть не дёргаем.
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import anyio

from scripts import mcp_server


MINIMAL_HTML = """
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Тест страница</title>
</head>
<body>
  <h1>Заголовок страницы</h1>
  <article>
    <p>Это тестовый текст на русском языке. Компания Яндекс разработала алгоритм ЭПОС в 2024 году.</p>
    <p>Критерии включают экспертность, полезность, оригинальность и содержательность.</p>
    <h2>Подраздел первый</h2>
    <p>Дополнительная информация о продукте. Цена составляет 1500 рублей. Иван Иванов, эксперт.</p>
    <h2>Подраздел второй</h2>
    <p>Ещё один параграф с уникальным контентом для проверки scoring'а.</p>
  </article>
</body>
</html>
"""

EXPECTED_TOOLS = {
    "yageo_epos", "yageo_score_html", "yageo_crawlers", "yageo_content_depth",
    "yageo_schema", "yageo_audit", "yageo_audit_markdown", "yageo_batch",
}


def _registered_tool_names() -> set[str]:
    """Имена зарегистрированных тулов — устойчиво к minor-версиям SDK."""
    server = mcp_server.mcp
    tm = getattr(server, "_tool_manager", None)
    if tm is not None and hasattr(tm, "list_tools"):
        return {t.name for t in tm.list_tools()}
    # Fallback: публичный async-accessor FastMCP.
    return {t.name for t in anyio.run(server.list_tools)}


def test_expected_tools_registered():
    names = _registered_tool_names()
    missing = EXPECTED_TOOLS - names
    assert not missing, f"Не зарегистрированы тулы: {missing}. Есть: {sorted(names)}"


def test_score_html_tool_returns_structured_dict():
    result = anyio.run(mcp_server.yageo_score_html, MINIMAL_HTML, "https://example.ru/")
    assert isinstance(result, dict)
    assert "error" not in result, f"Неожиданная ошибка: {result.get('error')} / {result.get('message')}"
    assert 0 <= result["overall"] <= 100
    assert isinstance(result["recommendations"], list)
    # Структура совпадает с EposScore.to_dict()
    for key in ("e", "p", "o", "s", "overall", "signals"):
        assert key in result


def test_bad_url_returns_structured_error_not_crash():
    # "not-a-url" падает на разборе схемы в requests ДО любого сетевого вызова → детерминированно offline.
    result = anyio.run(mcp_server.yageo_epos, "not-a-url")
    assert isinstance(result, dict)
    assert result.get("error") in {"http_error", "connection_error", "timeout", "internal_error"}, result
    assert "message" in result
