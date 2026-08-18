import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock fetch globally before importing modules
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

// Set env before imports
process.env.YANDEX_METRIKA_TOKEN = "test-token-123";

function mockOk(data: unknown) {
  return {
    ok: true,
    status: 200,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  };
}

function mockError(status: number, body = "") {
  return {
    ok: false,
    status,
    statusText: "Error",
    text: () => Promise.resolve(body),
  };
}

// ─── list_counters ───

describe("list_counters", () => {
  beforeEach(() => mockFetch.mockReset());

  it("returns counters list", async () => {
    const { handleListCounters } = await import("../tools/counters.js");
    const payload = { counters: [{ id: 123, name: "Test", site: "example.com", status: "Active" }], rows: 1 };
    mockFetch.mockResolvedValueOnce(mockOk(payload));

    const result = JSON.parse(await handleListCounters({}));
    expect(result.counters).toHaveLength(1);
    expect(result.counters[0].id).toBe(123);

    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain("/management/v1/counters");
  });

  it("passes search_string as query param", async () => {
    const { handleListCounters } = await import("../tools/counters.js");
    mockFetch.mockResolvedValueOnce(mockOk({ counters: [], rows: 0 }));

    await handleListCounters({ search_string: "my-site" });

    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain("search_string=my-site");
  });
});

// ─── get_counter ───

describe("get_counter", () => {
  beforeEach(() => mockFetch.mockReset());

  it("fetches a single counter by ID", async () => {
    const { handleGetCounter } = await import("../tools/counters.js");
    const payload = { counter: { id: 456, name: "Site", site: "site.ru" } };
    mockFetch.mockResolvedValueOnce(mockOk(payload));

    const result = JSON.parse(await handleGetCounter({ counter_id: 456 }));
    expect(result.counter.id).toBe(456);

    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain("/management/v1/counter/456");
  });
});

// ─── create_counter ───

describe("create_counter", () => {
  beforeEach(() => mockFetch.mockReset());

  it("sends POST with counter body", async () => {
    const { handleCreateCounter } = await import("../tools/counters.js");
    const payload = { counter: { id: 789, name: "New", site: "new.com" } };
    mockFetch.mockResolvedValueOnce(mockOk(payload));

    const result = JSON.parse(await handleCreateCounter({ name: "New", site: "new.com" }));
    expect(result.counter.id).toBe(789);

    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toContain("/management/v1/counters");
    expect(opts.method).toBe("POST");
    const body = JSON.parse(opts.body);
    expect(body.counter.name).toBe("New");
    expect(body.counter.site).toBe("new.com");
  });
});

// ─── delete_counter ───

describe("delete_counter", () => {
  beforeEach(() => mockFetch.mockReset());

  it("sends DELETE request", async () => {
    const { handleDeleteCounter } = await import("../tools/counters.js");
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: () => Promise.resolve('{"success":true}'),
    });

    const result = JSON.parse(await handleDeleteCounter({ counter_id: 100 }));
    expect(result.success).toBe(true);

    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toContain("/management/v1/counter/100");
    expect(opts.method).toBe("DELETE");
  });
});

// ─── get_report ───

describe("get_report", () => {
  beforeEach(() => mockFetch.mockReset());

  it("builds correct query with metrics and dimensions", async () => {
    const { handleGetReport } = await import("../tools/report.js");
    const payload = { data: [], totals: [100, 50], total_rows: 0, query: {} };
    mockFetch.mockResolvedValueOnce(mockOk(payload));

    await handleGetReport({
      counter_id: 123,
      metrics: ["ym:s:visits", "ym:s:pageviews"],
      dimensions: ["ym:s:browser"],
      date1: "2025-01-01",
      date2: "2025-01-31",
    });

    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain("/stat/v1/data");
    expect(url).toContain("ids=123");
    expect(url).toContain("metrics=ym%3As%3Avisits%2Cym%3As%3Apageviews");
    expect(url).toContain("dimensions=ym%3As%3Abrowser");
  });

  it("passes filters and sort params", async () => {
    const { handleGetReport } = await import("../tools/report.js");
    mockFetch.mockResolvedValueOnce(mockOk({ data: [], totals: [], total_rows: 0, query: {} }));

    await handleGetReport({
      counter_id: 1,
      metrics: ["ym:s:visits"],
      date1: "2025-01-01",
      date2: "2025-01-31",
      filters: "ym:s:trafficSource=='organic'",
      sort: "-ym:s:visits",
      limit: 10,
    });

    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain("filters=");
    expect(url).toContain("sort=");
    expect(url).toContain("limit=10");
  });
});

// ─── list_goals ───

describe("list_goals", () => {
  beforeEach(() => mockFetch.mockReset());

  it("fetches goals for a counter", async () => {
    const { handleListGoals } = await import("../tools/goals.js");
    const payload = { goals: [{ id: 1, name: "Buy", type: "action" }] };
    mockFetch.mockResolvedValueOnce(mockOk(payload));

    const result = JSON.parse(await handleListGoals({ counter_id: 55 }));
    expect(result.goals).toHaveLength(1);

    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain("/management/v1/counter/55/goals");
  });
});

// ─── get_traffic_summary ───

describe("get_traffic_summary", () => {
  beforeEach(() => mockFetch.mockReset());

  it("requests correct metrics", async () => {
    const { handleGetTrafficSummary } = await import("../tools/convenience.js");
    mockFetch.mockResolvedValueOnce(mockOk({ data: [], totals: [10, 20, 5, 30, 120], total_rows: 0, query: {} }));

    await handleGetTrafficSummary({ counter_id: 1, date1: "2025-01-01", date2: "2025-01-31" });

    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain("ym%3As%3Avisits");
    expect(url).toContain("ym%3As%3Apageviews");
    expect(url).toContain("ym%3As%3Ausers");
    expect(url).toContain("ym%3As%3AbounceRate");
  });
});

// ─── get_top_pages ───

describe("get_top_pages", () => {
  beforeEach(() => mockFetch.mockReset());

  it("uses default limit of 20", async () => {
    const { handleGetTopPages } = await import("../tools/convenience.js");
    mockFetch.mockResolvedValueOnce(mockOk({ data: [], totals: [], total_rows: 0, query: {} }));

    await handleGetTopPages({ counter_id: 1, date1: "2025-01-01", date2: "2025-01-31" });

    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain("limit=20");
    expect(url).toContain("ym%3As%3AstartURL");
  });
});

// ─── Error handling ───

describe("error handling", () => {
  beforeEach(() => mockFetch.mockReset());

  it("throws on missing token", async () => {
    const saved = process.env.YANDEX_METRIKA_TOKEN;
    delete process.env.YANDEX_METRIKA_TOKEN;

    // Need fresh import to bypass module cache — test via client directly
    const { apiGet } = await import("../client.js");
    await expect(apiGet("/test")).rejects.toThrow("YANDEX_METRIKA_TOKEN");

    process.env.YANDEX_METRIKA_TOKEN = saved;
  });

  it("throws on HTTP 4xx errors", async () => {
    const { handleListCounters } = await import("../tools/counters.js");
    mockFetch.mockResolvedValueOnce(mockError(403, "Forbidden"));

    await expect(handleListCounters({})).rejects.toThrow("HTTP 403");
  });
});

// ─── Auth header ───

describe("auth header", () => {
  beforeEach(() => mockFetch.mockReset());

  it("sends Bearer token in Authorization header", async () => {
    const { handleListCounters } = await import("../tools/counters.js");
    mockFetch.mockResolvedValueOnce(mockOk({ counters: [], rows: 0 }));

    await handleListCounters({});

    const opts = mockFetch.mock.calls[0][1];
    expect(opts.headers.Authorization).toBe("Bearer test-token-123");
  });
});
