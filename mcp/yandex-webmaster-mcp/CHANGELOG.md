# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0]

### Fixed

- **Requests never reached the API.** `new URL(path, base)` dropped the `/v4` base
  segment, so every call hit `…/user/…` instead of `…/v4/user/…`. URLs are now built by
  concatenation.
- **`package-lock.json` had committed merge-conflict markers**, breaking `npm ci` and CI.
  The lockfile is regenerated and valid.
- **Docs were unusable.** The README claimed 3 tools (there were 6) and omitted the
  required user id, so following it produced a server that failed on every call.
- **`get_search_queries` queried the wrong endpoint** (`/all/history`, aggregate) while
  promising per-query metrics. Per-query data lives at `/search-queries/popular`.
- Empty / `204 No Content` responses no longer crash the client (`response.json()` on an
  empty body).
- Network errors (`ECONNRESET`, DNS failures, etc.) are now retried, not just 5xx/timeouts.

### Added

- Auto-detection of the Webmaster user id via `GET /user/`. `YANDEX_WEBMASTER_USER_ID`
  is now optional (cached, with concurrent-call de-duplication).
- New tools: `get_popular_search_queries`, `get_query_analytics`, `get_indexing_history`,
  `get_recrawl_quota`, `get_recrawl_task`, `get_important_urls`, `get_user_info`.
- Compact **Markdown output** by default with a per-tool `format: "markdown" | "json"`
  parameter (raw JSON on request). Falls back to JSON if rendering fails.
- Actionable error messages mapped from HTTP status (401/403/404/429) and `isError` flag.
- `readOnlyHint` annotations on read tools; `submit_url` flagged as a non-read action.
- HTTP mode hardening: DNS-rebinding protection, optional bearer auth (`MCP_HTTP_AUTH_TOKEN`),
  `/health` version, 405/404 handling, and graceful shutdown (SIGINT/SIGTERM).
- Input validation: `YYYY-MM-DD` dates, http(s)-only `submit_url`.
- Tooling: ESLint + Prettier, `typecheck` script, tests for the new paths, and CI that
  runs typecheck/lint/format/test/build across Node 18/20/22.

### Changed

- `get_search_queries` is **deprecated** — it now delegates to `get_popular_search_queries`
  (returning the per-query data its name always implied). It will be removed in 3.0.0.
- Version is read from `package.json` at runtime instead of being hard-coded.

### Removed

- Dead, unregistered `src/skills/*` helpers and their tests.
