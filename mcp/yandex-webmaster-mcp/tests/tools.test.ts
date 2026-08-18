import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

function jsonResponse(data: unknown): any {
  return {
    ok: true,
    status: 200,
    statusText: "OK",
    headers: { get: () => null },
    text: () => Promise.resolve(JSON.stringify(data)),
  };
}

/** Mock fetch and return the spy so tests can assert the requested URL. */
function mockFetch(data: unknown) {
  return vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse(data));
}

describe("tool handlers", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.YANDEX_WEBMASTER_TOKEN = "test-token";
    process.env.YANDEX_WEBMASTER_USER_ID = "99";
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("get_hosts renders a Markdown table by default", async () => {
    mockFetch({
      hosts: [{ host_id: "a", unicode_host_url: "https://example.com", verified: true }],
    });
    const { handleGetHosts } = await import("../src/tools/hosts.js");
    const out = await handleGetHosts({ format: "markdown" });
    expect(out).toContain("| Host ID |");
    expect(out).toContain("https://example.com");
    expect(out).toContain("✓");
  });

  it("get_hosts returns raw JSON when format=json", async () => {
    mockFetch({ hosts: [{ host_id: "a", verified: true }] });
    const { handleGetHosts } = await import("../src/tools/hosts.js");
    const parsed = JSON.parse(await handleGetHosts({ format: "json" }));
    expect(parsed.hosts[0].host_id).toBe("a");
  });

  it("get_indexing hits the summary endpoint", async () => {
    const spy = mockFetch({ sqi: 120, site_problems: {} });
    const { handleGetIndexing } = await import("../src/tools/indexing.js");
    await handleGetIndexing({ host_id: "abc", format: "json" });
    expect(String(spy.mock.calls[0][0])).toContain("/hosts/abc/summary/");
  });

  it("get_indexing_history hits the indexing/history endpoint with a date range", async () => {
    const spy = mockFetch({ indicators: {} });
    const { handleGetIndexingHistory } = await import("../src/tools/indexing.js");
    await handleGetIndexingHistory({ host_id: "abc", format: "json" });
    const url = String(spy.mock.calls[0][0]);
    expect(url).toContain("/hosts/abc/indexing/history");
    expect(url).toContain("date_from=");
    expect(url).toContain("date_to=");
  });

  it("submit_url POSTs to recrawl/queue (no trailing slash)", async () => {
    const spy = mockFetch({ task_id: "t1", quota_remainder: 5 });
    const { handleSubmitUrl } = await import("../src/tools/indexing.js");
    await handleSubmitUrl({ host_id: "abc", url: "https://example.com/p", format: "json" });
    const url = String(spy.mock.calls[0][0]);
    expect(url).toContain("/hosts/abc/recrawl/queue");
    expect(url.endsWith("/recrawl/queue")).toBe(true);
  });

  it("get_popular_search_queries hits /search-queries/popular and flattens indicators", async () => {
    const spy = mockFetch({
      queries: [
        {
          query_id: "1",
          query_text: "buy widgets",
          indicators: { TOTAL_SHOWS: 100, TOTAL_CLICKS: 10 },
        },
      ],
    });
    const { handleGetPopularSearchQueries } = await import("../src/tools/search-queries.js");
    const out = await handleGetPopularSearchQueries({ host_id: "abc", format: "markdown" });
    expect(String(spy.mock.calls[0][0])).toContain("/search-queries/popular");
    expect(out).toContain("buy widgets");
    expect(out).toContain("Shows");
  });

  it("get_query_analytics hits /search-queries/all/history", async () => {
    const spy = mockFetch({ indicators: { TOTAL_SHOWS: [{ date: "2024-01-01", value: 5 }] } });
    const { handleGetQueryAnalytics } = await import("../src/tools/search-queries.js");
    await handleGetQueryAnalytics({ host_id: "abc", format: "json" });
    expect(String(spy.mock.calls[0][0])).toContain("/search-queries/all/history");
  });

  it("deprecated get_search_queries delegates to the popular endpoint", async () => {
    const spy = mockFetch({ queries: [] });
    const { handleGetSearchQueries } = await import("../src/tools/search-queries.js");
    await handleGetSearchQueries({ host_id: "abc", format: "json" });
    expect(String(spy.mock.calls[0][0])).toContain("/search-queries/popular");
  });

  it("get_recrawl_quota hits recrawl/quota", async () => {
    const spy = mockFetch({ quota: 10 });
    const { handleGetRecrawlQuota } = await import("../src/tools/recrawl.js");
    await handleGetRecrawlQuota({ host_id: "abc", format: "json" });
    expect(String(spy.mock.calls[0][0])).toContain("/hosts/abc/recrawl/quota");
  });

  it("get_recrawl_task hits recrawl/task/{id}", async () => {
    const spy = mockFetch({ state: "DONE" });
    const { handleGetRecrawlTask } = await import("../src/tools/recrawl.js");
    await handleGetRecrawlTask({ host_id: "abc", task_id: "xyz", format: "json" });
    expect(String(spy.mock.calls[0][0])).toContain("/hosts/abc/recrawl/task/xyz");
  });

  it("get_sitemaps hits sitemaps endpoint", async () => {
    const spy = mockFetch({ sitemaps: [{ sitemap_url: "https://example.com/sitemap.xml" }] });
    const { handleGetSitemaps } = await import("../src/tools/sitemaps.js");
    const out = await handleGetSitemaps({ host_id: "abc", format: "markdown" });
    expect(String(spy.mock.calls[0][0])).toContain("/hosts/abc/sitemaps/");
    expect(out).toContain("sitemap.xml");
  });

  it("get_diagnostics hits diagnostics endpoint", async () => {
    const spy = mockFetch({ problems: [] });
    const { handleGetDiagnostics } = await import("../src/tools/diagnostics.js");
    await handleGetDiagnostics({ host_id: "abc", format: "json" });
    expect(String(spy.mock.calls[0][0])).toContain("/hosts/abc/diagnostics/");
  });

  it("get_important_urls hits important-urls endpoint", async () => {
    const spy = mockFetch({ urls: [] });
    const { handleGetImportantUrls } = await import("../src/tools/important-urls.js");
    await handleGetImportantUrls({ host_id: "abc", format: "json" });
    expect(String(spy.mock.calls[0][0])).toContain("/hosts/abc/important-urls/");
  });

  it("get_user_info hits /user/", async () => {
    const spy = mockFetch({ user_id: 99 });
    const { handleGetUserInfo } = await import("../src/tools/user.js");
    await handleGetUserInfo({ format: "json" });
    expect(String(spy.mock.calls[0][0])).toContain("/v4/user/");
  });
});

describe("input validation", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("rejects a bad date format for get_popular_search_queries", async () => {
    const { getPopularSearchQueriesSchema } = await import("../src/tools/search-queries.js");
    const result = getPopularSearchQueriesSchema.safeParse({
      host_id: "abc",
      date_from: "01-01-2024",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a non-http(s) url for submit_url", async () => {
    const { submitUrlSchema } = await import("../src/tools/indexing.js");
    const result = submitUrlSchema.safeParse({ host_id: "abc", url: "ftp://example.com/x" });
    expect(result.success).toBe(false);
  });

  it("defaults format to markdown", async () => {
    const { getHostsSchema } = await import("../src/tools/hosts.js");
    const result = getHostsSchema.parse({});
    expect(result.format).toBe("markdown");
  });
});
