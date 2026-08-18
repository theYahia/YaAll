"""Smoke tests for content_depth analyzer."""

import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from scripts.content_depth import analyze_html, ContentDepthReport


STRUCTURED_HTML = """
<html>
<head><meta charset="utf-8"><title>Тест</title></head>
<body>
<article>
  <h1>Главный заголовок</h1>
  <p>Краткое вступление на 20 слов — описывает суть страницы и помогает Alice AI быстро понять тему документа.</p>

  <h2>Что такое ЭПОС?</h2>
  <p>ЭПОС расшифровывается как Экспертность, Полезность, Оригинальность, Содержательность.
     Алгоритм Яндекс оценивает каждый критерий отдельно. В 2024 году Яндекс публично описал 29 факторов.
     Цена внедрения для малого бизнеса составляет от 50 000 рублей.</p>
  <ul>
    <li>Экспертность — автор и источники</li>
    <li>Полезность — UX и структура</li>
  </ul>

  <h2>Как улучшить видимость в Алисе?</h2>
  <p>Для улучшения видимости добавьте FAQ, структурированные данные и короткие ответы.</p>
  <h3>Шаг 1: добавить автора</h3>
  <p>Укажите автора в JSON-LD Person schema с credentials и sameAs VK/Telegram.</p>

  <h2>Часто задаваемые вопросы</h2>
  <p><strong>Вопрос:</strong> Сколько стоит оптимизация?</p>
  <p>Стоимость оптимизации под Alice AI зависит от размера сайта. Для 100 страниц — около 30 000 рублей.</p>
</article>
</body>
</html>
"""

MINIMAL_HTML = """
<html><body><p>Короткий текст без заголовков.</p></body></html>
"""


def _assert_valid_report(r: ContentDepthReport):
    assert isinstance(r.total_words, int) and r.total_words >= 0
    assert isinstance(r.total_sections, int) and r.total_sections >= 0
    assert isinstance(r.lsi_coverage, float) and 0 <= r.lsi_coverage <= 1
    assert isinstance(r.recommendations, list)
    for s in r.sections:
        assert s.word_count >= 0
        assert s.heading_level in (2, 3, 4)


def test_structured_page_detects_sections():
    r = analyze_html(STRUCTURED_HTML, url="https://example.ru/")
    _assert_valid_report(r)
    assert r.total_sections >= 2, f"Ожидали >=2 секции, получили {r.total_sections}"
    assert r.total_words > 50


def test_structured_page_detects_faq():
    r = analyze_html(STRUCTURED_HTML, url="https://example.ru/")
    assert r.has_faq_block, "FAQ-блок не обнаружен (есть 'Часто задаваемые вопросы' H2)"


def test_minimal_page_doesnt_crash():
    r = analyze_html(MINIMAL_HTML, url="")
    _assert_valid_report(r)
    assert r.total_sections == 0
    assert len(r.recommendations) >= 1


def test_heading_depth_detected():
    r = analyze_html(STRUCTURED_HTML, url="https://example.ru/")
    assert r.heading_depth >= 3, f"Ожидали H3+, получили H{r.heading_depth}"


def test_json_serialization():
    r = analyze_html(STRUCTURED_HTML)
    import json
    d = r.to_dict()
    json_str = json.dumps(d, ensure_ascii=False)
    assert "sections" in json_str
    assert "recommendations" in json_str
