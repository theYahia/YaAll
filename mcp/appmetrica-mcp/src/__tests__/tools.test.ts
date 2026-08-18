import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

process.env.APPMETRICA_TOKEN = "test-appmetrica-token-123";

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

// ─── list_applications ───

describe("list_applications", () => {
  beforeEach(() => mockFetch.mockReset());

  it("returns applications list", async () => {
    const { handleListApplications } = await import("../tools/applications.js");
    const payload = { applications: [{ id: 1, name: "My App", platform: "android" }] };
    mockFetch.mockResolvedValueOnce(mockOk(payload));

    const result = JSON.parse(await handleListApplications());
    expect(result.applications).toHaveLength(1);
    expect(result.applications[0].name).toBe("My App");

    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain("/management/v1/applications");
  });
});

// ─── get_report ───

describe("get_report", () => {
  beforeEach(() => mockFetch.mockReset());

  it("sends correct metrics and dimensions", async () => {
    const { handleGetReport } = await import("../tools/reports.js");
    mockFetch.mockResolvedValueOnce(mockOk({ data: [], totals: [100], total_rows: 0 }));

    await handleGetReport({
      app_id: 123,
      metrics: ["sessions", "users"],
      dimensions: ["date", "os"],
      date1: "2026-01-01",
      date2: "2026-01-31",
    });

    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain("/stat/v1/data");
    expect(url).toContain("id=123");
    expect(url).toContain("metrics=sessions%2Cusers");
    expect(url).toContain("dimensions=date%2Cos");
  });

  it("passes filters param", async () => {
    const { handleGetReport } = await import("../tools/reports.js");
    mockFetch.mockResolvedValueOnce(mockOk({ data: [], totals: [], total_rows: 0 }));

    await handleGetReport({
      app_id: 1,
      metrics: ["sessions"],
      date1: "2026-01-01",
      date2: "2026-01-31",
      filters: "os=='android'",
    });

    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain("filters=");
  });
});

// ─── get_cohorts ───

describe("get_cohorts", () => {
  beforeEach(() => mockFetch.mockReset());

  it("requests cohort data", async () => {
    const { handleGetCohorts } = await import("../tools/reports.js");
    mockFetch.mockResolvedValueOnce(mockOk({ data: [], totals: [] }));

    await handleGetCohorts({
      app_id: 123,
      cohort_type: "install_date",
      metrics: ["retention_rate"],
      date1: "2026-01-01",
      date2: "2026-01-31",
    });

    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain("dimensions=cohort_install_date");
    expect(url).toContain("metrics=retention_rate");
  });
});

// ─── get_crash_report ───

describe("get_crash_report", () => {
  beforeEach(() => mockFetch.mockReset());

  it("requests crash metrics", async () => {
    const { handleGetCrashReport } = await import("../tools/crashes.js");
    mockFetch.mockResolvedValueOnce(mockOk({ data: [], totals: [5, 98.5] }));

    await handleGetCrashReport({
      app_id: 123,
      date1: "2026-01-01",
      date2: "2026-01-31",
    });

    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain("metrics=crashes%2Ccrash_free_users_percentage");
    expect(url).toContain("dimensions=crash_group");
  });
});

// ─── send_push ───

describe("send_push", () => {
  beforeEach(() => mockFetch.mockReset());

  it("sends push notification", async () => {
    const { handleSendPush } = await import("../tools/push.js");
    mockFetch.mockResolvedValueOnce(mockOk({ id: 999 }));

    await handleSendPush({
      app_id: 123,
      group_id: 10,
      message: "Hello users!",
      title: "News",
    });

    const [, opts] = mockFetch.mock.calls[0];
    const body = JSON.parse(opts.body);
    expect(body.app_id).toBe(123);
    expect(body.messages[0].content.text).toBe("Hello users!");
    expect(body.messages[0].content.title).toBe("News");
  });
});

// ─── Error handling ───

describe("error handling", () => {
  beforeEach(() => mockFetch.mockReset());

  it("throws on missing token", async () => {
    const saved = process.env.APPMETRICA_TOKEN;
    delete process.env.APPMETRICA_TOKEN;

    const { apiGet } = await import("../client.js");
    await expect(apiGet("/test")).rejects.toThrow("APPMETRICA_TOKEN");

    process.env.APPMETRICA_TOKEN = saved;
  });

  it("throws on HTTP 4xx errors", async () => {
    const { handleListApplications } = await import("../tools/applications.js");
    mockFetch.mockResolvedValueOnce(mockError(403, "Forbidden"));

    await expect(handleListApplications()).rejects.toThrow("HTTP 403");
  });
});

// ─── Auth header ───

describe("auth header", () => {
  beforeEach(() => mockFetch.mockReset());

  it("sends OAuth token", async () => {
    const { handleListApplications } = await import("../tools/applications.js");
    mockFetch.mockResolvedValueOnce(mockOk({ applications: [] }));

    await handleListApplications();

    const opts = mockFetch.mock.calls[0][1];
    expect(opts.headers.Authorization).toBe("OAuth test-appmetrica-token-123");
  });
});
