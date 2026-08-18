import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

function jsonResponse(data: unknown, status = 200): any {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: "OK",
    headers: { get: () => null },
    text: () => Promise.resolve(JSON.stringify(data)),
  };
}

function rawResponse(body: string, status = 200, headers: Record<string, string> = {}): any {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 204 ? "No Content" : "OK",
    headers: { get: (h: string) => headers[h.toLowerCase()] ?? null },
    text: () => Promise.resolve(body),
  };
}

function errorResponse(status: number, body = ""): any {
  return {
    ok: false,
    status,
    statusText: `Status ${status}`,
    headers: { get: () => null },
    text: () => Promise.resolve(body),
  };
}

describe("client", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    process.env.YANDEX_WEBMASTER_TOKEN = "test-token-123";
    process.env.YANDEX_WEBMASTER_USER_ID = "12345";
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  it("getUserId returns env var", async () => {
    const { getUserId } = await import("../src/client.js");
    expect(getUserId()).toBe("12345");
  });

  it("getUserId throws when not set", async () => {
    delete process.env.YANDEX_WEBMASTER_USER_ID;
    const { getUserId } = await import("../src/client.js");
    expect(() => getUserId()).toThrow("YANDEX_WEBMASTER_USER_ID is not set");
  });

  it("apiGet throws when token not set", async () => {
    delete process.env.YANDEX_WEBMASTER_TOKEN;
    const { apiGet } = await import("../src/client.js");
    await expect(apiGet("/hosts/")).rejects.toThrow("YANDEX_WEBMASTER_TOKEN is not set");
  });

  it("apiGet builds the /v4/user/{id} URL and calls fetch", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({ hosts: [] }));

    const { apiGet } = await import("../src/client.js");
    const result = await apiGet("/hosts/");

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const calledUrl = fetchSpy.mock.calls[0][0] as string;
    expect(calledUrl).toContain("api.webmaster.yandex.net/v4/user/12345/hosts/");
    expect(result).toEqual({ hosts: [] });
  });

  it("apiGet passes Bearer token and Accept headers", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({}));

    const { apiGet } = await import("../src/client.js");
    await apiGet("/hosts/");

    const opts = fetchSpy.mock.calls[0][1] as RequestInit;
    expect(opts.headers).toEqual(
      expect.objectContaining({
        Authorization: "Bearer test-token-123",
        Accept: "application/json",
      }),
    );
  });

  it("apiGet appends scalar, numeric and array query params", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({}));

    const { apiGet } = await import("../src/client.js");
    await apiGet("/hosts/abc/search-queries/popular", {
      date_from: "2024-01-01",
      limit: 50,
      query_indicator: ["TOTAL_SHOWS", "TOTAL_CLICKS"],
    });

    const calledUrl = fetchSpy.mock.calls[0][0] as string;
    expect(calledUrl).toContain("date_from=2024-01-01");
    expect(calledUrl).toContain("limit=50");
    expect(calledUrl).toContain("query_indicator=TOTAL_SHOWS");
    expect(calledUrl).toContain("query_indicator=TOTAL_CLICKS");
  });

  it("apiGet returns {} for a 204 No Content response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      rawResponse("", 204, { "content-length": "0" }),
    );
    const { apiGet } = await import("../src/client.js");
    expect(await apiGet("/hosts/x/recrawl/quota")).toEqual({});
  });

  it("apiGet returns {} for an empty 200 body", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(rawResponse("", 200));
    const { apiGet } = await import("../src/client.js");
    expect(await apiGet("/hosts/")).toEqual({});
  });

  it("apiGet throws a clear error on non-JSON body", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(rawResponse("<html>oops</html>", 200));
    const { apiGet } = await import("../src/client.js");
    await expect(apiGet("/hosts/")).rejects.toThrow(/Non-JSON response/);
  });

  it.each([401, 403, 404])("apiGet throws YandexApiError with status %i", async (status) => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(errorResponse(status, "denied"));
    const { apiGet, YandexApiError } = await import("../src/client.js");
    try {
      await apiGet("/hosts/");
      throw new Error("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(YandexApiError);
      expect((err as InstanceType<typeof YandexApiError>).status).toBe(status);
    }
  });

  it("apiGet retries on 500 then succeeds", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(errorResponse(500))
      .mockResolvedValueOnce(jsonResponse({ ok: true }));

    const { apiGet } = await import("../src/client.js");
    const result = await apiGet("/hosts/");
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ ok: true });
  });

  it("apiGet exhausts retries on persistent 500", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(errorResponse(500));
    const { apiGet, YandexApiError } = await import("../src/client.js");
    await expect(apiGet("/hosts/")).rejects.toBeInstanceOf(YandexApiError);
    expect(fetchSpy).toHaveBeenCalledTimes(3);
  });

  it("apiGet retries on AbortError (timeout)", async () => {
    const abort = Object.assign(new Error("aborted"), { name: "AbortError" });
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockRejectedValueOnce(abort)
      .mockResolvedValueOnce(jsonResponse({ ok: true }));

    const { apiGet } = await import("../src/client.js");
    const result = await apiGet("/hosts/");
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ ok: true });
  });

  it("apiGet retries on a transient network error (ECONNRESET)", async () => {
    const netErr = Object.assign(new TypeError("fetch failed"), {
      cause: { code: "ECONNRESET" },
    });
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockRejectedValueOnce(netErr)
      .mockResolvedValueOnce(jsonResponse({ ok: true }));

    const { apiGet } = await import("../src/client.js");
    const result = await apiGet("/hosts/");
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ ok: true });
  });

  it("apiPost sends method, JSON body and returns parsed data", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(jsonResponse({ task_id: "t1", quota_remainder: 9 }));

    const { apiPost } = await import("../src/client.js");
    const result = await apiPost("/hosts/abc/recrawl/queue", { url: "https://e.com/p" });

    const opts = fetchSpy.mock.calls[0][1] as RequestInit;
    expect(opts.method).toBe("POST");
    expect(opts.body).toBe(JSON.stringify({ url: "https://e.com/p" }));
    expect((opts.headers as Record<string, string>)["Content-Type"]).toBe("application/json");
    expect(result).toEqual({ task_id: "t1", quota_remainder: 9 });
  });

  it("apiPost returns {} for an empty body", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(rawResponse("", 200));
    const { apiPost } = await import("../src/client.js");
    expect(await apiPost("/hosts/x/recrawl/queue", { url: "https://e.com" })).toEqual({});
  });

  it("resolveUserId fetches GET /user/ once when env var is unset", async () => {
    delete process.env.YANDEX_WEBMASTER_USER_ID;
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(jsonResponse({ user_id: 777 }));

    const { resolveUserId } = await import("../src/client.js");
    const [a, b] = await Promise.all([resolveUserId(), resolveUserId()]);

    expect(a).toBe("777");
    expect(b).toBe("777");
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy.mock.calls[0][0] as string).toContain("/v4/user/");
  });

  it("apiGet auto-prefixes the resolved user id when env var is unset", async () => {
    delete process.env.YANDEX_WEBMASTER_USER_ID;
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async (url) => {
      const u = String(url);
      if (u.endsWith("/v4/user/")) return jsonResponse({ user_id: 555 });
      return jsonResponse({ hosts: [] });
    });

    const { apiGet } = await import("../src/client.js");
    await apiGet("/hosts/");

    const hostsCall = fetchSpy.mock.calls.find((c) => String(c[0]).includes("/hosts/"));
    expect(hostsCall?.[0] as string).toContain("/v4/user/555/hosts/");
  });

  it("resolveUserId surfaces an actionable error when auto-detection fails", async () => {
    delete process.env.YANDEX_WEBMASTER_USER_ID;
    vi.spyOn(globalThis, "fetch").mockResolvedValue(errorResponse(403, "no scope"));
    const { resolveUserId } = await import("../src/client.js");
    await expect(resolveUserId()).rejects.toThrow(/Could not resolve Yandex user id/);
  });
});
