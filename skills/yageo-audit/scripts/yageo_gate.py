#!/usr/bin/env python3
"""
yageo_gate.py — программный ЭПОС-гейт через YaGEO.

Читает список URL'ов (из sitemap, явно через --urls, или из файла),
прогоняет yageo.epos_scorer параллельно, проверяет что overall >= threshold.

Usage:
    # На весь sitemap:
    python research/scripts/yageo_gate.py --sitemap app/dist/sitemap-0.xml --top 20

    # На список URL'ов:
    python research/scripts/yageo_gate.py --urls https://gosmax.ru/ https://gosmax.ru/catalog/

    # Custom threshold (default 70):
    python research/scripts/yageo_gate.py --sitemap ... --threshold 65

Exit codes:
    0 — все страницы проходят threshold (или nothing to check)
    1 — хотя бы одна страница ниже threshold
    2 — config error (sitemap не найден, etc.)

Установка YaGEO: `pip install -e D:/Yahia/active/YaGEO`.
"""
from __future__ import annotations

import argparse
import csv
import io
import json
import re
import sys
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
DEFAULT_HISTORY_DIR = PROJECT_ROOT / "research" / "yageo_history"
DIM_KEYS = ("e", "p", "o", "s")  # Экспертность, Полезность, Оригинальность, Содержательность

# Per-kind минимальные пороги overall. category/static-страницы по природе беднее
# контентом чем bot-карточки, поэтому глобальный threshold=70 топил их все
# (microscope weakness: "global threshold → category pages всегда fail").
# bot 70 / category 50 / home 60 / static 40. blog наследует --threshold.
PER_KIND_THRESHOLDS = {"bot": 70, "category": 50, "home": 60, "static": 40, "listing": 50}
# Top-level aggregation/listing routes (doorway-page risk per CLAUDE.md) — must clear
# the category tier (50), not collapse to the static about-page tier (40). slug_from_url
# only knew 3 prefixes AND only with a 2nd path segment, so these single-segment
# listing routes fell through to ('static', seg) at the lowest bar. Mirror the route
# dirs under app/src/pages/ (those with an index.astro + facet subdirs).
LISTING_ROUTES = frozenset({
    "channels", "leaderboard", "trending", "analytics", "gov", "tag",
    "compare", "categories", "catalog", "region", "stickers", "chats",
    "similar", "statistika", "dataset", "new-channels",
})


def slug_from_url(url: str) -> tuple[str, str]:
    """Extract (kind, slug) from a gosmax.ru URL.

    Examples:
      https://gosmax.ru/                         -> ('home', '_')
      https://gosmax.ru/catalog/agent-maks/      -> ('bot', 'agent-maks')
      https://gosmax.ru/category/ai-neural/      -> ('category', 'ai-neural')
      https://gosmax.ru/blog/post-name/          -> ('blog', 'post-name')
      https://gosmax.ru/about/                   -> ('static', 'about')
    """
    path = urllib.parse.urlparse(url).path.strip("/")
    if not path:
        return ("home", "_")
    parts = path.split("/")
    # Route MATCHING is case-insensitive (a mixed-case path like /Catalog/agent/
    # or /Channels/ must not evade per-kind thresholds by falling through to the
    # static-40 tier — that is a quality-gate bypass). The returned SLUG keeps the
    # original casing from `parts` (URLs/slugs can legitimately be case-sensitive).
    seg0 = parts[0].lower()
    if seg0 == "catalog" and len(parts) >= 2:
        return ("bot", parts[1])
    if seg0 == "category" and len(parts) >= 2:
        return ("category", parts[1])
    if seg0 == "blog" and len(parts) >= 2:
        return ("blog", parts[1])
    # Single-segment top-level listing/aggregation routes (incl. /catalog/ and
    # /categories/ index pages) → 'listing' tier (50), not the static-40 bar.
    if seg0 in LISTING_ROUTES:
        return ("listing", parts[0])
    return ("static", parts[0])

for _stream in (sys.stdout, sys.stderr):
    try:
        _stream.reconfigure(encoding="utf-8", errors="replace")
    except (AttributeError, ValueError):
        pass


def load_urls_from_sitemap(src: str) -> list[str]:
    """Read sitemap from local path or HTTP URL. Returns list of <loc> URLs."""
    if src.startswith(("http://", "https://")):
        with urllib.request.urlopen(src, timeout=30) as r:
            xml = r.read().decode("utf-8")
    else:
        xml = Path(src).read_text(encoding="utf-8")
    return re.findall(r"<loc>([^<]+)</loc>", xml)


def threshold_for(url: str, fallback: int, uniform: bool) -> int:
    """Per-kind порог: bot=70 category=50 home=60 static=40. blog/unknown → fallback.
    --uniform-threshold → fallback для всех."""
    if uniform:
        return fallback
    kind, _ = slug_from_url(url)
    return PER_KIND_THRESHOLDS.get(kind, fallback)


def score_histogram(scores) -> dict:
    """Bucket `overall` scores (0-100) into 10 deciles → {bucket_label: count}.

    Pure function (no I/O) so it is unit-testable. Buckets are half-open
    [0,10), [10,20), … [90,100] with the final bucket INCLUSIVE of 100. Out-of-
    range scores are clamped into [0,100] first. Always returns all 10 buckets in
    order (zero-filled), so the histogram shape is stable across runs.
    """
    import collections
    labels = [f"{lo}-{lo+10}" for lo in range(0, 100, 10)]
    counts = collections.Counter()
    for s in scores:
        v = max(0.0, min(100.0, float(s)))
        idx = min(9, int(v // 10))  # 100 → bucket index 9 (the 90-100 bucket)
        counts[idx] += 1
    return {labels[i]: counts.get(i, 0) for i in range(10)}


def format_histogram(hist: dict, width: int = 40) -> str:
    """Render {bucket: count} as a text bar histogram (pure, for console)."""
    peak = max(hist.values(), default=0)
    lines = []
    for label, n in hist.items():
        bar = "#" * (round(n / peak * width) if peak else 0)
        lines.append(f"  {label:>7} | {bar} {n}")
    return "\n".join(lines)


def preflight_import():
    """Fatal pre-flight: YaGEO scorer must import before we spin up the pool.

    Microscope weakness: ImportError was caught silently per-URL → every row got
    an identical "ImportError" and the gate looked like a network failure instead
    of a missing dependency. We resolve `score_url` ONCE here and abort hard if it
    is absent (exit 2 = config error). Returns the resolved callable.
    """
    try:
        from scripts.epos_scorer import score_url  # YaGEO (pip install -e D:/Yahia/active/YaGEO)
    except ImportError as e:
        print("FATAL: не удалось импортировать YaGEO scorer (scripts.epos_scorer.score_url).",
              file=sys.stderr)
        print(f"  {type(e).__name__}: {e}", file=sys.stderr)
        print("  Установка: pip install -e D:/Yahia/active/YaGEO", file=sys.stderr)
        sys.exit(2)
    return score_url


def score_one(url: str, score_url, retry: int = 0):
    """Wrap score_url so it returns (url, score_dict, error_or_none).

    `score_url` resolved once by preflight_import (no per-URL ImportError swallow).
    `retry` — дополнительные попытки при transient (network/parse) ошибке.
    """
    last_err = None
    for attempt in range(retry + 1):
        try:
            result = score_url(url)
            return url, _result_to_dict(result), None
        except Exception as e:
            last_err = f"{type(e).__name__}: {e}"
    return url, None, last_err


def _result_to_dict(result) -> dict:
    """Normalise whatever the YaGEO scorer returns into a plain dict.

    Tolerates three shapes so a result-shape mismatch is NOT mis-reported as a
    network/parse error (which then drops the page from scoring and flips the gate
    exit to 1 — the same masking preflight_import already warns about for imports):
      • an object exposing `.to_dict()`        → use it (preferred);
      • a plain mapping (dict-like) already    → return as-is;
      • a __dict__-bearing dataclass/namespace → `vars()`.
    A __slots__ object with neither to_dict nor __dict__ raises a clear TypeError
    rather than the opaque AttributeError the old `result.__dict__` access threw.
    """
    if hasattr(result, "to_dict"):
        return result.to_dict()
    if isinstance(result, dict):
        return result
    try:
        return dict(vars(result))  # vars() == result.__dict__, but errors cleanly
    except TypeError:
        raise TypeError(
            f"scorer returned an unsupported result shape {type(result).__name__} "
            f"(no .to_dict(), not a dict, no __dict__)"
        )


def main() -> int:
    ap = argparse.ArgumentParser(description="YaGEO ЭПОС audit gate")
    ap.add_argument("--sitemap", help="path or URL to sitemap-0.xml")
    ap.add_argument("--urls", nargs="*", help="explicit URL list")
    ap.add_argument("--top", type=int, default=0, help="audit only top N URLs (N must be >= 0; 0 = all)")
    ap.add_argument("--threshold", type=int, default=70, help="fallback minimum overall score (default 70; per-kind overrides apply unless --uniform-threshold)")
    ap.add_argument("--uniform-threshold", action="store_true",
                    help="disable per-kind thresholds, use --threshold for every page kind")
    ap.add_argument("--retry", type=int, default=0, help="retry N times on transient scoring error (default 0)")
    ap.add_argument("--workers", type=int, default=5, help="parallel HTTP workers (default 5)")
    ap.add_argument("--json", action="store_true", help="emit final summary as JSON")
    ap.add_argument("--history-csv", default=None,
                    help=f"append per-page rows to this CSV (default: auto = {DEFAULT_HISTORY_DIR}/<YYYY-MM-DD>.csv). Use --no-history to skip.")
    ap.add_argument("--no-history", action="store_true", help="skip writing history CSV")
    ap.add_argument("--per-page-json", default=None,
                    help="optional dir to write one JSON per page (used by revise_low_score_pages.py)")
    args = ap.parse_args()

    # Validate --top before URL resolution / the costly preflight_import, so a
    # negative value errors loudly (exit 2) instead of being silently folded into
    # the 'all' branch (`if args.top > 0` skipped it → full corpus audited).
    if args.top < 0:
        ap.error("--top must be >= 0 (0 = all)")

    if args.urls:
        urls = list(args.urls)
    elif args.sitemap:
        urls = load_urls_from_sitemap(args.sitemap)
    else:
        ap.error("pass --sitemap or --urls")

    if args.top > 0:
        urls = urls[: args.top]

    # --json contract: stdout carries ONLY the JSON document (so a CI consumer can
    # do `proc.stdout | json.loads` reliably); ALL human progress/log lines go to
    # stderr instead. Without --json, logs stay on stdout as before. (audit F4)
    # Defined BEFORE the empty-URL guard so even that early exit honours the
    # contract (the guard's human line must not land on stdout under --json).
    def log(msg: str = "") -> None:
        print(msg, file=(sys.stderr if args.json else sys.stdout))

    if not urls:
        log("[yageo-gate] no URLs to audit, skipping")
        if args.json:
            # Emit a minimal-but-valid document so `json.loads(stdout)` still works.
            print(json.dumps({
                "total": 0, "pass": 0, "fail": 0, "errors": 0, "avg_overall": 0,
                "fallback_threshold": args.threshold, "uniform": args.uniform_threshold,
                "thresholds": ({k: args.threshold for k in (*PER_KIND_THRESHOLDS, "blog")}
                               if args.uniform_threshold else
                               {**PER_KIND_THRESHOLDS, "blog": args.threshold}),
                "histogram": score_histogram([]), "pages": [],
            }, ensure_ascii=False))
        return 0

    # Fatal pre-flight: resolve scorer ONCE (no silent per-URL ImportError swallow).
    score_url = preflight_import()

    thr_mode = "uniform" if args.uniform_threshold else f"per-kind {PER_KIND_THRESHOLDS}"
    log(f"[yageo-gate] auditing {len(urls)} URLs (threshold={args.threshold} [{thr_mode}], "
        f"workers={args.workers}, retry={args.retry})")
    results: list[tuple[str, dict | None, str | None]] = []

    def _thr(u: str) -> int:
        return threshold_for(u, args.threshold, args.uniform_threshold)

    with ThreadPoolExecutor(max_workers=args.workers) as pool:
        futures = {pool.submit(score_one, u, score_url, args.retry): u for u in urls}
        for f in as_completed(futures):
            url, data, err = f.result()
            results.append((url, data, err))
            if err:
                log(f"  ERR  {url}: {err}")
            else:
                thr = _thr(url)
                tag = "PASS" if data["overall"] >= thr else "FAIL"
                log(f"  {tag} {data['overall']:>3}/{thr}  E={data['e']:>3} P={data['p']:>3} O={data['o']:>3} S={data['s']:>3}  {url}")

    # Aggregate (per-kind threshold applied per URL)
    scored = [(u, d) for u, d, e in results if d]
    failed_to_score = [(u, e) for u, _, e in results if e]
    pass_count = sum(1 for u, d in scored if d["overall"] >= _thr(u))
    fail_count = sum(1 for u, d in scored if d["overall"] < _thr(u))
    avg = round(sum(d["overall"] for _, d in scored) / len(scored), 1) if scored else 0

    # Score distribution histogram (deciles) — pure helper, easy to eyeball where
    # the corpus sits (e.g. a fat 40-50 bucket = category pages dragging the avg).
    hist = score_histogram(d["overall"] for _, d in scored)

    log(f"\n[yageo-gate] summary: {pass_count}/{len(scored)} pass  avg={avg}/100")
    if scored:
        log("[yageo-gate] overall score distribution (deciles):")
        log(format_histogram(hist))
    if failed_to_score:
        log(f"  {len(failed_to_score)} URLs не удалось проскорить (network/parse errors)")
    if fail_count:
        failed_pages = [(u, d) for u, d in scored if d["overall"] < _thr(u)]
        worst = sorted(failed_pages, key=lambda x: x[1]["overall"])[:5]
        log(f"  worst {min(5, fail_count)} URLs (overall < per-kind threshold):")
        for u, d in worst:
            log(f"    {d['overall']:>3}/{_thr(u)}  {u}")

    if args.json:
        # Self-contained, machine-parseable document: per-kind thresholds (NOT a
        # lone fallback scalar that contradicts the per-kind pass/fail math, audit
        # F5) + a per-page array so a CI consumer sees WHICH pages failed and at
        # WHAT bar without re-deriving anything. The effective per-kind map is the
        # fallback for every kind under --uniform-threshold, else PER_KIND_THRESHOLDS.
        # Include 'blog' (and any other fallback-only kind) explicitly so a consumer
        # can resolve EVERY page's bar from this map without a KeyError — blog has no
        # entry in PER_KIND_THRESHOLDS and threshold_for falls it back to --threshold.
        eff_thresholds = (
            {k: args.threshold for k in (*PER_KIND_THRESHOLDS, "blog")}
            if args.uniform_threshold else {**PER_KIND_THRESHOLDS, "blog": args.threshold}
        )
        pages = []
        for url, d, err in results:
            kind, slug = slug_from_url(url)
            if err or not d:
                pages.append({"url": url, "kind": kind, "slug": slug,
                              "error": err, "pass": False})
                continue
            thr = _thr(url)
            pages.append({
                "url": url, "kind": kind, "slug": slug,
                "overall": d["overall"], "e": d["e"], "p": d["p"], "o": d["o"], "s": d["s"],
                "threshold": thr, "pass": d["overall"] >= thr,
            })
        doc = {
            "total": len(urls),
            "pass": pass_count,
            "fail": fail_count,
            "errors": len(failed_to_score),
            "avg_overall": avg,
            "fallback_threshold": args.threshold,
            "uniform": args.uniform_threshold,
            "thresholds": eff_thresholds,
            "histogram": hist,
            "pages": pages,
        }
        # The ONLY thing written to stdout under --json.
        print(json.dumps(doc, ensure_ascii=False))

    # History CSV — append per-page rows so trends can be tracked over time.
    if not args.no_history:
        ts = datetime.now(timezone.utc).astimezone()
        if args.history_csv:
            csv_path = Path(args.history_csv)
        else:
            DEFAULT_HISTORY_DIR.mkdir(parents=True, exist_ok=True)
            csv_path = DEFAULT_HISTORY_DIR / f"{ts.date().isoformat()}.csv"
        csv_path.parent.mkdir(parents=True, exist_ok=True)
        new_file = not csv_path.exists()
        with csv_path.open("a", encoding="utf-8", newline="") as fp:
            w = csv.writer(fp)
            if new_file:
                w.writerow(["timestamp", "url", "kind", "slug", "overall", "e", "p", "o", "s", "threshold", "pass"])
            ts_iso = ts.isoformat(timespec="seconds")
            for url, d, err in results:
                if err or not d:
                    continue
                kind, slug = slug_from_url(url)
                thr = _thr(url)
                passed = "1" if d["overall"] >= thr else "0"
                w.writerow([ts_iso, url, kind, slug, d["overall"], d["e"], d["p"], d["o"], d["s"], thr, passed])
        log(f"[yageo-gate] history appended → {csv_path}")  # stderr under --json

    # Per-page JSON dump — used by revise_low_score_pages.py for targeted feedback.
    if args.per_page_json:
        out_dir = Path(args.per_page_json)
        out_dir.mkdir(parents=True, exist_ok=True)
        ts_iso = datetime.now(timezone.utc).astimezone().isoformat(timespec="seconds")
        written = 0
        for url, d, err in results:
            if err or not d:
                continue
            kind, slug = slug_from_url(url)
            thr = _thr(url)
            payload = {
                "url": url,
                "kind": kind,
                "slug": slug,
                "overall": d["overall"],
                "e": d["e"], "p": d["p"], "o": d["o"], "s": d["s"],
                "threshold": thr,
                "weak_dims": [k for k in DIM_KEYS if d[k] < thr],
                "audited_at": ts_iso,
            }
            (out_dir / f"{kind}__{slug}.json").write_text(
                json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
            written += 1
        log(f"[yageo-gate] wrote {written} per-page JSON → {out_dir}")  # stderr under --json

    return 0 if fail_count == 0 and not failed_to_score else 1


if __name__ == "__main__":
    sys.exit(main())
