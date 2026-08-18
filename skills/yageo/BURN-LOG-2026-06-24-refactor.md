# BURN-LOG — YaGEO behavior-preserving refactor (2026-06-24)

**Repo:** YaGEO (`D:/Yahia/active/YaGEO`)
**Mode:** REFACTOR ONLY — lighten / structure / behavior-preserving. No new features, no bug fixes (bugs reported, not fixed).
**Base commit:** `29b8b0517a8c03ddf7c6d00942b149425787473e` (branch `feat/mcp-server`, clean tree on entry)
**Work branch:** `refactor/burn-2026-06-24`
**Verify command:** `.venv/Scripts/python -m pytest tests/ -q`

---

## Baseline (on entry)

- **Green:** YES — `61 passed, 1 warning in ~3.9s`.
- **Test set (must stay green):** 61 tests across 12 files
  (`test_audit_smoke` 6, `test_batch_smoke` 6, `test_cache_smoke` 4, `test_cli_smoke` 4,
  `test_config` 6, `test_content_depth_smoke` 5, `test_crawlers_smoke` 5, `test_epos_smoke` 4,
  `test_heuristics_smoke` 9, `test_mcp_server_smoke` 3, `test_pdf_smoke` 1, `test_schema_smoke` 8).
- **Network-skipped tests on baseline:** NONE. All 61 run offline (HTML/text fixtures, no network gating). Nothing masked.
- **The 1 warning** is pre-existing and unrelated: `pymorphy2/analyzer.py` `pkg_resources is deprecated` (transitive natasha dep). Not introduced by this refactor; left as-is.

**After-refactor verify:** `61 passed, 1 warning` — identical green set. No test added, removed, skipped, or xfailed.

---

## What I did — PRIMARY: facade splits of the scripts/ god-modules

All three splits use the **facade pattern**: the original file stays the public
entrypoint, imports/re-exports the extracted sub-modules, and every caller +
`[project.scripts]` console-script + test import works unchanged. Verified GREEN
immediately after each split.

### 1. `scripts/epos_scorer.py` (722 → 211 LOC facade + 3 submodules)  — commit `cb1a2a9`
- `scripts/_epos_types.py` (34) — `EposScore`, `Recommendation` dataclasses.
- `scripts/_epos_parse.py` (61) — `_bucket`, `_parse_soup`, `_extract_jsonld`, `_has_schema_type`, `_author_schema` (config-free pure fns).
- `scripts/_epos_score.py` (504) — Natasha NER/morph lazy-loaders (`_get_ner`/`_run_ner`/`_get_morph_vocab`/`_lemmatize_tokens`/`_tokenize_simple`), the 4 criterion scorers (`_score_s/_p/_e/_o`), `_strip_comments`, `_build_recommendations`, and public `score_html`/`score_url`.
- Facade keeps the Click CLI + `_print_report` + `CFG` attribute.

**Critical correctness detail — monkeypatch contract preserved.**
`tests/test_config.py` and `tests/test_heuristics_smoke.py` do
`monkeypatch.setattr(epos_scorer, "CFG", custom)` and
`monkeypatch.setattr(epos_scorer, "_run_ner", boom)` then re-invoke `score_html`.
After the split, the scoring submodule resolves **`CFG` and `_run_ner` through the
facade module object at call-time** (via a lazy `_facade()` helper), never via a
local binding — so a patched `epos_scorer.CFG` / `epos_scorer._run_ner` is still
seen by the extracted scorers. This was validated with a standalone probe before
implementing, and confirmed by the 5 monkeypatch tests passing.
Module-level constants that read `CFG` at import (`_AUTH_DOMAINS`, `_RU_STOPWORDS`,
`_CATALOG_BOILERPLATE`) are built in the submodule at load — same load-time
semantics as the original (those keys are not monkeypatched by any test).

### 2. `scripts/json_ld_validator.py` (752 → 282 LOC facade + 3 submodules)  — commit `1794922`
- `scripts/_jsonld_types.py` (40) — `SchemaIssue`, `SchemaInfo`, `SchemaReport`.
- `scripts/_jsonld_validators.py` (230) — JSON-LD extraction (`_extract_jsonld`/`_schema_type`/`_schemas_by_type`) + 7 `_validate_*` fns + `_VALIDATORS` map.
- `scripts/_jsonld_generators.py` (262) — `_page_meta`, `_detect_page_types`, 5 `_gen_*` fns + `_GENERATORS` map.
- Facade keeps `validate_html`/`validate_url`, `_build_recommendations`, Click CLI + `_print_report`.
- No CFG, no monkeypatch contract here — straightforward seam.

### 3. `scripts/yandex_crawler_check.py` (515 → 213 LOC facade + 2 submodules)  — commit `d780f2d`
- `scripts/_crawler_types.py` (59) — `RobotsResult`, `SitemapResult`, `CanonicalResult`, `CrawlerReport`.
- `scripts/_crawler_checks.py` (283) — HTTP helpers (`_get`/`_base_url`/`_normalize_url`), robots checker (`_parse_robots`/`_is_path_blocked`/`check_robots`), sitemap checker (`_manual_sitemap_check`/`check_sitemap`, USP-optional), canonical checker (`check_canonical`).
- Facade keeps `check_url`, `_build_recommendations`, Click CLI + `_print_report`.
- Clean three-checker seam; `test_crawlers_smoke` imports (`_parse_robots`, `_is_path_blocked`, `check_robots`, 4 dataclasses) all still resolve via re-export.

## What I did — SECONDARY: genuine dedup  — commit `4b55e35`
- `_SYM = {"ok":"✓","warn":"⚠","bad":"✗"}` + `def _sym(condition, warn_only)` was **byte-identical** in `content_depth.py` and `yandex_crawler_check.py`.
  Extracted to `scripts/_common.py` as `STATUS_SYMBOLS` + `status_symbol()`; both modules now
  `from scripts._common import STATUS_SYMBOLS as _SYM, status_symbol as _sym`. Local names
  `_SYM`/`_sym` stay bound (downstream `_SYM["ok"]` / `_sym(...)` references unchanged).
  Output glyphs verified identical via CLI render smoke.

---

## Metrics (before → after)

| Metric | Before | After | Δ |
|---|---:|---:|---:|
| `epos_scorer.py` LOC | 722 | 211 (facade) + 599 (3 submods) | refactored |
| `json_ld_validator.py` LOC | 752 | 282 (facade) + 532 (3 submods) | refactored |
| `yandex_crawler_check.py` LOC | 515 | 213 (facade) + 342 (2 submods) | refactored |
| Largest module in scripts/ | 752 | 504 (`_epos_score.py`) | −248 |
| `scripts/` total LOC | 3977 | 4173 | +196 (per-module docstrings/import headers) |
| Runtime dependencies (pyproject) | 10 | 10 | 0 (untouched) |
| Tests (passing) | 61 | 61 | 0 |
| Packaged entrypoints working | 8 | 8 | 0 |

> Total LOC grew ~5% — expected for a facade split (each new file carries a
> module docstring + import block). The win is structural: no module > ~510 LOC
> (was 752), and each criterion/validator/checker concern is isolated and
> independently testable. Duplication of the CLI symbol helper removed.

## Verification performed
- Full `pytest tests/ -q` GREEN (61) after **each** of the 4 commits.
- Public-surface import probe per module (every name tests import + every console-script `main`).
- All 8 `[project.scripts]` entrypoints import and expose `main()`.
- CLI smoke: `epos_scorer --html ... --json` and `content_depth --html ...` render correctly.
- Standalone facade-monkeypatch probe confirmed CFG/`_run_ner` patching propagates to submodules.

---

## What I did NOT touch (and why)

- **`research/scripts/brave_sweep.py`** — HARD NOT-TOUCH. Canonical research backend, copied/kept-in-sync across projects. Untouched.
- **`pyproject.toml`** — dependency set / build config / `[project.scripts]` are contracts. Untouched (facades preserve every `module:main` path so no change was needed).
- **`schema/`** — JSON-LD/contract files. Untouched.
- **`tests/`** — all smoke-test signatures kept stable; not a single test file edited. Untouched.
- **`.env*`, `.venv`, `models/`, `obsidian/`** — secrets / virtualenv / model artifacts / vault. Untouched.
- **`scripts/audit.py`, `batch_audit.py`, `mcp_server.py`, `generate_yageo_pdf.py`, `content_depth.py` (beyond the symbol dedup), `config.py`, `cache.py`** — out of the split scope; left as-is to keep the burn atomic and low-risk. `content_depth.py` only received the shared-symbol import change.
- **`scripts/audit.py` `_SYM` (HIGH/MEDIUM/LOW)** — NOT deduped: different keys/semantics from the OK/WARN/BAD set. Merging would have been a behavior risk for no real gain.

---

## Security findings (REPORT-ONLY — not fixed, per refactor mode)

1. **SSRF / unrestricted outbound fetch (by design, but worth noting).**
   `scripts/_common.fetch_html` and `scripts/_crawler_checks._get` issue
   `requests.get` to any user-supplied URL with `allow_redirects=True` and no
   host allowlist / private-IP guard. This is an auditor CLI so it is intended,
   but if `mcp_server.py` exposes these over an untrusted MCP channel, a caller
   could probe internal hosts (`http://169.254.169.254/…`, `http://localhost/…`).
   Recommendation (future, not this burn): block link-local / RFC-1918 targets
   when invoked via the MCP server.

2. **`json.loads` on attacker-controlled page JSON-LD** — bounded. JSON-LD blocks
   are parsed with a bare `except Exception: pass`, so malformed/hostile JSON is
   safely ignored. No `eval`, no `pickle`, no `yaml.load`. Low risk; noted for
   completeness.

3. **No secrets in touched code.** No tokens/keys read, printed, or moved. `.env*`
   never opened. `BRAVE_API_KEY` handling lives in the untouched brave backend.

---

## FLAGS / honest status

- **Status: COMPLETE for the stated scope.** All PRIMARY splits (epos, json_ld, crawler) done + SECONDARY dedup done. Tests green throughout.
- **FLAG (behavior nuance, pre-existing — NOT changed):** `scripts/epos_scorer._extract_jsonld`
  and `scripts/json_ld_validator._extract_jsonld` are **near-duplicates that
  intentionally DIFFER** — the validator version unwraps `@graph` and guards
  `isinstance(dict)`, the scorer version does not. I deliberately did **not**
  merge them: unifying would change `epos_scorer` scoring behavior for pages that
  use `@graph` wrappers (it would start seeing nested schemas it currently
  ignores). That is a behavior change, out of bounds for a behavior-preserving
  burn. Left as separate `_epos_parse._extract_jsonld` and
  `_jsonld_validators._extract_jsonld`. If unification is desired, it should be a
  deliberate feature change with its own test, not a silent refactor.
- **FLAG (cosmetic):** Git reports `LF will be replaced by CRLF` on the new files
  (Windows checkout, `core.autocrlf`). Content is identical; harmless.
- **No bugs were fixed** (refactor mode). The pre-existing pymorphy2 deprecation
  warning and the SSRF-by-design note above are reported, not patched.
- **Not pushed / not deployed.** 4 local atomic commits on `refactor/burn-2026-06-24` only.
