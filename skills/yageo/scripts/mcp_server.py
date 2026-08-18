"""
YaGEO MCP server — экспонирует ЭПОС/GEO-аудит тулкит по Model Context Protocol (stdio).

Зачем MCP, а не только CLI: persistent-процесс держит Natasha NER «тёплой» между вызовами
(~200-500MB модели грузятся один раз на старте), тогда как каждый CLI-запуск грузит их заново.
→ быстрые повторные аудиты + структурированный JSON-вывод для агентов любого MCP-клиента
(Claude Code / Claude Desktop / Cursor / OpenClaw).

Запуск:
    yageo-mcp                                   # console-script (из pyproject)
    python -m scripts.mcp_server                # из корня репо

Дисциплина stdout (КРИТИЧНО): stdio-транспорт MCP пишет JSON-RPC-фреймы в stdout. Любой посторонний
вывод в stdout ломает протокол. Поэтому:
  * pure-функции скоринга (score_url/check_url/...) НЕ печатают в stdout — печать живёт только в
    click-`main()` каждого скрипта, который мы не вызываем;
  * НЕ вызываем `_common.ensure_utf8_stdout()` (она reconfigure'ит stdout);
  * все логи сервера идут в stderr;
  * разогрев Natasha оборачиваем в `redirect_stdout(sys.stderr)` синхронно ДО `mcp.run()`
    (внутри async-тулов redirect_stdout не используем — он переключал бы глобальный sys.stdout
    параллельно с записью транспорта = race).
"""

from __future__ import annotations

import contextlib
import sys
import warnings
from pathlib import Path
from typing import Any

warnings.filterwarnings("ignore")

# Сервер лежит в scripts/ — добавляем корень репо в путь, как и остальные скрипты,
# чтобы `import scripts.*` работал при запуске и как `-m`, и как console-script.
sys.path.insert(0, str(Path(__file__).parent.parent))

import anyio
import requests
from mcp.server.fastmcp import FastMCP

# Pure-функции переиспользуем как есть — НЕ переписываем логику.
from scripts.epos_scorer import score_url, score_html
from scripts.yandex_crawler_check import check_url
from scripts.content_depth import analyze_url, analyze_html
from scripts.json_ld_validator import validate_url, validate_html
from scripts.audit import audit_url, render_report
from scripts.batch_audit import _fetch_sitemap_urls, _run_batch
# generate_yageo_pdf импортируем лениво внутри yageo_pdf — reportlab опционален.

mcp = FastMCP("yageo")


# ---------------------------------------------------------------------------
# Хелперы
# ---------------------------------------------------------------------------

async def _run(thunk) -> dict[str, Any]:
    """Выполнить блокирующий thunk (-> объект с .to_dict()) в worker-потоке.

    Держит event-loop отзывчивым (sync `requests`/Natasha не морозят сервер) и превращает
    сетевые сбои в структурированный {"error": ...} dict, а не в краш сервера.
    """
    try:
        result = await anyio.to_thread.run_sync(thunk)
    except requests.HTTPError as exc:
        return {"error": "http_error", "message": str(exc)}
    except requests.ConnectionError as exc:
        return {"error": "connection_error", "message": str(exc)}
    except requests.Timeout as exc:
        return {"error": "timeout", "message": str(exc)}
    except Exception as exc:  # defensive: ни один тул не должен ронять сервер
        return {"error": "internal_error", "message": str(exc)}
    return result.to_dict()


# ---------------------------------------------------------------------------
# Tools — по одному на pure-функцию
# ---------------------------------------------------------------------------

@mcp.tool()
async def yageo_epos(url: str) -> dict[str, Any]:
    """ЭПОС-скоринг страницы (Экспертность/Полезность/Оригинальность/Содержательность, 0-100 каждый)
    + рекомендации для видимости в Яндекс Alice AI. Загружает URL. ~3-8с (Natasha тёплая)."""
    return await _run(lambda: score_url(url))


@mcp.tool()
async def yageo_score_html(html: str, url: str = "") -> dict[str, Any]:
    """ЭПОС-скоринг по готовому HTML без повторной загрузки страницы — для клиентов, у которых HTML
    уже есть. `url` опционален (влияет на HTTPS-сигнал П). ~1-3с."""
    return await _run(lambda: score_html(html, url=url))


@mcp.tool()
async def yageo_crawlers(url: str) -> dict[str, Any]:
    """Технический чек для Яндекса: robots.txt, доступ YandexBot/YandexAdditionalBot, sitemap.xml,
    canonical. Загружает /robots.txt, /sitemap.xml и целевой URL. ~3-10с."""
    return await _run(lambda: check_url(url))


@mcp.tool()
async def yageo_content_depth(url: str) -> dict[str, Any]:
    """Глубина контента: секции по заголовкам, длина разделов, FAQ-блок, LSI-покрытие, speakable,
    intro. Загружает URL. ~2-5с."""
    return await _run(lambda: analyze_url(url))


@mcp.tool()
async def yageo_schema(url: str, generate: bool = True) -> dict[str, Any]:
    """Валидация JSON-LD на странице + (при generate=True) генерация готовых к вставке RU-шаблонов
    (Organization/Person/FAQPage/...). Загружает URL. ~2-5с."""
    return await _run(lambda: validate_url(url, generate=generate))


@mcp.tool()
async def yageo_audit(url: str) -> dict[str, Any]:
    """Полный аудит: ЭПОС + Crawlers + Schema + Content Depth (4 модуля параллельно) + агрегированные
    топ-рекомендации по ROI. Загружает URL несколько раз. ~30-90с — клиенту нужен щедрый timeout."""
    return await _run(lambda: audit_url(url))


@mcp.tool()
async def yageo_audit_markdown(url: str) -> dict[str, Any]:
    """Полный аудит + готовый Markdown-отчёт (рендер Jinja2). Возвращает {"report": <audit dict>,
    "markdown": <строка отчёта>}. ~30-90с."""
    def _do() -> dict[str, Any]:
        report = audit_url(url)
        return {"report": report.to_dict(), "markdown": render_report(report)}
    try:
        return await anyio.to_thread.run_sync(_do)
    except Exception as exc:
        return {"error": "internal_error", "message": str(exc)}


@mcp.tool()
async def yageo_batch(sitemap_url: str, limit: int = 20, workers: int = 5) -> dict[str, Any]:
    """ЭПОС-скоринг страниц сайта из sitemap.xml. Возвращает {count, ok, errors, results[]}.
    Может занять МИНУТЫ — `limit` зажат в [1..50], `workers` в [1..10]; для клиентов с ~60с timeout
    держите limit<=20, workers>=5."""
    limit = max(1, min(int(limit), 50))
    workers = max(1, min(int(workers), 10))

    def _do() -> dict[str, Any]:
        urls = _fetch_sitemap_urls(sitemap_url, limit=limit)
        results = _run_batch(urls, workers=workers)
        ok = [r for r in results if not r.error]
        return {
            "sitemap_url": sitemap_url,
            "count": len(results),
            "ok": len(ok),
            "errors": len(results) - len(ok),
            "results": [
                {"url": r.url, "e": r.e, "p": r.p, "o": r.o, "s": r.s,
                 "overall": r.overall, "error": r.error}
                for r in results
            ],
        }
    try:
        return await anyio.to_thread.run_sync(_do)
    except Exception as exc:
        return {"error": "internal_error", "message": str(exc)}


@mcp.tool()
async def yageo_pdf(url: str, out_path: str = "") -> dict[str, Any]:
    """Полный аудит → PDF-отчёт. Требует доп. зависимость reportlab (pip install -e ".[pdf,mcp]").
    Пишет файл на ФС сервера, возвращает {"pdf_path": <абсолютный путь>}. ~30-90с."""
    def _do() -> dict[str, Any]:
        try:
            from scripts.generate_yageo_pdf import build_pdf
        except ImportError:
            return {"error": "missing_dependency",
                    "message": 'reportlab не установлен. Установите: pip install -e ".[pdf,mcp]"'}
        from urllib.parse import urlparse
        report = audit_url(url)
        path = out_path or f"yageo_audit_{urlparse(url).netloc.replace('.', '_')}.pdf"
        build_pdf(report, path)
        return {"pdf_path": str(Path(path).resolve())}
    try:
        return await anyio.to_thread.run_sync(_do)
    except Exception as exc:
        return {"error": "internal_error", "message": str(exc)}


# ---------------------------------------------------------------------------
# Разогрев + entrypoint
# ---------------------------------------------------------------------------

def _warm_natasha() -> None:
    """Eager-разогрев Natasha NER до старта транспорта.

    Платим ~5-15с один раз на старте → первый реальный вызов yageo_epos/yageo_audit быстрый и не
    упирается в client-timeout. Синглтоны кешируются в процессе (epos_scorer._get_ner). Сбой
    разогрева не фатален — модель догрузится лениво на первом вызове.
    """
    print("yageo-mcp: разогрев Natasha NER…", file=sys.stderr, flush=True)
    try:
        with contextlib.redirect_stdout(sys.stderr):
            from scripts.epos_scorer import _get_ner
            _get_ner()
        print("yageo-mcp: Natasha готова.", file=sys.stderr, flush=True)
    except Exception as exc:  # noqa: BLE001
        print(f"yageo-mcp: разогрев не удался ({exc}); ленивая загрузка на первом вызове.",
              file=sys.stderr, flush=True)


def main() -> None:
    _warm_natasha()
    mcp.run(transport="stdio")


if __name__ == "__main__":
    main()
