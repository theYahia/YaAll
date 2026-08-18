---
name: yageo-technical
description: Агент технического SEO-аудита под Яндекс. Проверяет индексируемость (YandexBot/YandexAdditionalBot), sitemap, canonical, JSON-LD разметку и технические факторы полезности (HTTPS, mobile, H1).
---

# YaGEO— Technical Agent

Этот агент фокусируется на **технических факторах** индексации и разметки.

## Что проверяет

### Краулинг (robots + sitemap)
- robots.txt: YandexBot и YandexAdditionalBot не заблокированы
- Sitemap.xml: найден, URL страницы присутствует
- Canonical: корректно указывает на текущий URL

### Schema.org разметку
- Наличие и корректность JSON-LD блоков
- Обязательные поля по типу (Organization, Article, FAQPage и др.)
- RU-специфика: sameAs с VK/Telegram/Dzen для Organization
- Яндекс.Карты sameAs для LocalBusiness

### Технические факторы полезности (П в ЭПОС)
- HTTPS: обязателен для Alice AI индексации
- Mobile viewport: `<meta name="viewport">`
- H1: наличие и соответствие заголовку
- Intrusive popups: overlay/z-index проверка
- Thin content: < 100 слов → penalty

## Используемые инструменты

- `yageo-crawlers` (robots/sitemap/canonical)
- `yageo-schema` (JSON-LD validation + generation)
- `yageo-epos` (П scoring)
