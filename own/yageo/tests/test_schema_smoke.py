"""Smoke tests for json_ld_validator."""

import sys, os, json
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from scripts.json_ld_validator import (
    validate_html, SchemaReport,
    _validate_organization, _validate_faqpage, _validate_person,
    _detect_page_types,
)
from bs4 import BeautifulSoup

# HTML with full, good schemas
GOOD_SCHEMA_HTML = """
<html><head>
<title>GosMax — каталог ботов MAX</title>
<meta name="description" content="Каталог ботов мессенджера MAX">
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "GosMax",
  "url": "https://gosmax.ru",
  "logo": {"@type": "ImageObject", "url": "https://gosmax.ru/logo.png"},
  "sameAs": ["https://vk.com/gosmax", "https://t.me/gosmax", "https://dzen.ru/gosmax"]
}
</script>
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Что такое MAX мессенджер?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "MAX — это российский мессенджер от VK Group с поддержкой ботов и мини-приложений. Используется миллионами пользователей в России для общения и работы с автоматизированными сервисами."
      }
    }
  ]
}
</script>
</head><body>
<h1>Каталог ботов MAX</h1>
<p>Лучшие боты для мессенджера MAX.</p>
<h2>Как пользоваться каталогом?</h2>
<p>Выберите бота из списка и перейдите по ссылке.</p>
</body></html>
"""

# HTML with no schemas at all
NO_SCHEMA_HTML = """
<html><head><title>Страница без схем</title></head>
<body>
<h1>Тест</h1>
<p>Простой текст без какой-либо разметки schema.org.</p>
</body></html>
"""

# HTML with bad FAQPage (very short answers)
BAD_FAQ_HTML = """
<html><head><title>Тест FAQ</title></head>
<body>
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {"@type": "Question", "name": "Вопрос?",
     "acceptedAnswer": {"@type": "Answer", "text": "Да."}}
  ]
}
</script>
</body></html>
"""


def test_good_schema_scores_well():
    r = validate_html(GOOD_SCHEMA_HTML, url="https://gosmax.ru/", generate=False)
    assert isinstance(r, SchemaReport)
    assert len(r.found_schemas) >= 2
    org_schemas = [s for s in r.found_schemas if s.schema_type == "Organization"]
    assert org_schemas, "Organization schema не найдена"
    assert org_schemas[0].score >= 60, f"Organization score слишком низкий: {org_schemas[0].score}"


def test_no_schema_detects_missing():
    r = validate_html(NO_SCHEMA_HTML, url="https://example.ru/")
    assert len(r.found_schemas) == 0
    assert len(r.missing_recommended) > 0
    assert r.overall_score == 0


def test_generates_schemas_for_missing():
    r = validate_html(NO_SCHEMA_HTML, url="https://gosmax.ru/", generate=True)
    assert len(r.generated) > 0
    types_generated = {g.get("@type") for g in r.generated}
    assert len(types_generated) > 0


def test_bad_faq_flags_short_answers():
    r = validate_html(BAD_FAQ_HTML, url="https://example.ru/faq/")
    faq_schemas = [s for s in r.found_schemas if s.schema_type == "FAQPage"]
    assert faq_schemas
    warnings = [i for i in faq_schemas[0].issues if i.severity == "warning"]
    assert any("короткие" in w.message or "слов" in w.message for w in warnings), \
        "Должно быть предупреждение о коротком ответе"


def test_organization_ru_sameAs_warning():
    s = {"@type": "Organization", "name": "Test", "url": "https://test.ru",
         "sameAs": ["https://twitter.com/test"]}  # no RU platforms
    info = _validate_organization(s)
    warns = [i for i in info.issues if "RU" in i.message or "vk" in i.message.lower()]
    assert warns, "Должно быть предупреждение об отсутствии RU sameAs"


def test_person_validator_requires_name():
    s = {"@type": "Person", "jobTitle": "CEO"}
    info = _validate_person(s)
    errors = [i for i in info.issues if i.severity == "error"]
    assert any(i.field == "name" for i in errors)


def test_page_type_detection_catalog():
    soup = BeautifulSoup(
        "<html><body><h1>Каталог ботов MAX</h1>"
        "<p>Скачать бот для мессенджера. API интеграция.</p></body></html>",
        "lxml"
    )
    types = _detect_page_types(soup, "скачать бот api мессенджер", "https://gosmax.ru/catalog/", {})
    assert "softwareapplication" in types or "faqpage" in types


def test_json_serialization():
    r = validate_html(GOOD_SCHEMA_HTML, url="https://gosmax.ru/")
    d = r.to_dict()
    json_str = json.dumps(d, ensure_ascii=False)
    assert "found_schemas" in json_str
    assert "missing_recommended" in json_str
