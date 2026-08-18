import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock fetch globally before importing modules
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

// Set token before imports
process.env.YANDEX_METRIKA_TOKEN = "test-token-123";

import { handleListCounters } from "../src/tools/counters.js";
import { handleGetReport } from "../src/tools/report.js";
import { handleListGoals } from "../src/tools/goals.js";
import { handleExportLogs } from "../src/tools/logs.js";
import { handleGetTrafficSummary, handleGetTrafficSources } from "../src/tools/convenience.js";

function mockResponse(data: unknown) {
  return {
    ok: true,
    status: 200,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  } as unknown as Response;
}

beforeEach(() => {
  mockFetch.mockReset();
});

describe("list_counters", () => {
  it("calls /management/v1/counters with Bearer token", async () => {
    const payload = { counters: [{ id: 111, name: "Test", site: "example.com", status: "Active" }], rows: 1 };
    mockFetch.mockResolvedValueOnce(mockResponse(payload));

    const result = await handleListCounters({});
    const parsed = JSON.parse(result);

    expect(parsed.counters).toHaveLength(1);
    expect(parsed.counters[0].id).toBe(111);

    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toContain("/management/v1/counters");
    expect(opts.headers.Authorization).toBe("Bearer test-token-123");
  });

  it("passes search_string as query param", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ counters: [], rows: 0 }));

    await handleListCounters({ search_string: "mysite" });

    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain("search_string=mysite");
  });
});

describe("get_report", () => {
  it("calls /stat/v1/data with correct params", async () => {
    const payload = { data: [], totals: [100], total_rows: 0, query: {} };
    mockFetch.mockResolvedValueOnce(mockResponse(payload));

    const result = await handleGetReport({
      counter_id: 123,
      date1: "2025-01-01",
      date2: "2025-01-31",
      metrics: ["ym:s:visits"],
    });
    const parsed = JSON.parse(result);

    expect(parsed.totals).toEqual([100]);

    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain("/stat/v1/data");
    expect(url).toContain("ids=123");
    expect(url).toContain("metrics=ym");
  });
});

describe("list_goals", () => {
  it("calls /management/v1/counter/{id}/goals", async () => {
    const payload = { goals: [{ id: 1, name: "Purchase", type: "url" }] };
    mockFetch.mockResolvedValueOnce(mockResponse(payload));

    const result = await handleListGoals({ counter_id: 456 });
    const parsed = JSON.parse(result);

    expect(parsed.goals).toHaveLength(1);
    expect(parsed.goals[0].name).toBe("Purchase");

    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain("/management/v1/counter/456/goals");
  });
});

describe("export_logs", () => {
  it("calls Logs API evaluate and logrequests endpoints", async () => {
    mockFetch
      .mockResolvedValueOnce(mockResponse({ log_request: { request_id: 1, status: "created" } }))
      .mockResolvedValueOnce(mockResponse({ log_request_evaluation: { possible: true, max_possible_day_quantity: 30 } }));

    const result = await handleExportLogs({
      counter_id: 789,
      date1: "2025-01-01",
      date2: "2025-01-07",
      source: "visits",
    });
    const parsed = JSON.parse(result);

    expect(parsed.log_request).toBeDefined();
    expect(parsed.evaluation).toBeDefined();
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});

describe("get_traffic_summary", () => {
  it("requests summary metrics", async () => {
    const payload = { data: [], totals: [10, 20, 5, 30, 120], total_rows: 0, query: {} };
    mockFetch.mockResolvedValueOnce(mockResponse(payload));

    await handleGetTrafficSummary({ counter_id: 111, date1: "2025-03-01", date2: "2025-03-31" });

    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain("/stat/v1/data");
    expect(url).toContain("ym%3As%3Avisits");
    expect(url).toContain("ym%3As%3Ausers");
  });
});

describe("get_traffic_sources", () => {
  it("calls /stat/v1/data with traffic source dimensions", async () => {
    const payload = {
      data: [{ dimensions: [{ name: "organic" }], metrics: [500, 300, 25.5] }],
      totals: [500, 300, 25.5],
      total_rows: 1,
    };
    mockFetch.mockResolvedValueOnce(mockResponse(payload));

    const result = await handleGetTrafficSources({
      counter_id: 222,
      date1: "2025-03-01",
      date2: "2025-03-31",
    });
    const parsed = JSON.parse(result);

    expect(parsed.data[0].dimensions[0].name).toBe("organic");

    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain("dimensions=ym");
    expect(url).toContain("lastTrafficSource");
  });
});
