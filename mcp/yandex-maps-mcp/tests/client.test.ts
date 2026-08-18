/**
 * Tests for Yandex Maps HTTP client.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { callGeocoder, callRouter, callSearch, callSuggest, callMatrix } from "../src/client.js";

const mockFetch = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", mockFetch);
  process.env.YANDEX_MAPS_API_KEY = "test-key-123";
});

afterEach(() => {
  vi.restoreAllMocks();
  delete process.env.YANDEX_MAPS_API_KEY;
});

function mockResponse(status: number, body: unknown = {}) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

describe("callGeocoder", () => {
  it("sends correct URL with apikey", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(200, { response: {} }));
    await callGeocoder({ geocode: "Москва" });
    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain("geocode-maps.yandex.ru");
    expect(url).toContain("apikey=test-key-123");
    expect(url).toContain("format=json");
  });

  it("returns data on 200", async () => {
    const body = { response: { GeoObjectCollection: { featureMember: [] } } };
    mockFetch.mockResolvedValueOnce(mockResponse(200, body));
    const result = await callGeocoder({ geocode: "test" });
    expect(result.error).toBeNull();
    expect(result.data).toEqual(body);
  });

  it("returns error on 401 without exposing key", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(401));
    const result = await callGeocoder({ geocode: "test" });
    expect(result.error).toContain("Authentication failed");
    expect(result.error).not.toContain("test-key-123");
  });

  it("returns error when API key is missing", async () => {
    delete process.env.YANDEX_MAPS_API_KEY;
    const result = await callGeocoder({ geocode: "test" });
    expect(result.error).toContain("YANDEX_MAPS_API_KEY is not set");
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("retries on 500 and succeeds", async () => {
    mockFetch
      .mockResolvedValueOnce(mockResponse(500))
      .mockResolvedValueOnce(mockResponse(200, { response: {} }));
    const result = await callGeocoder({ geocode: "test" });
    expect(result.error).toBeNull();
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("handles timeout (AbortError)", async () => {
    const abortError = new DOMException("signal is aborted", "AbortError");
    mockFetch.mockRejectedValueOnce(abortError);
    const result = await callGeocoder({ geocode: "test" });
    expect(result.error).toContain("timed out");
  });
});

describe("callRouter", () => {
  it("sends waypoints and mode in URL", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(200, { features: [] }));
    await callRouter("55.75,37.61|55.73,37.58", "driving");
    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain("api.routing.yandex.net");
    expect(url).toContain("waypoints=");
    expect(url).toContain("mode=driving");
  });
});

describe("callMatrix", () => {
  it("sends origins and destinations", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(200, { rows: [] }));
    await callMatrix("55.75,37.61", "55.73,37.58", "driving");
    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain("distancematrix");
    expect(url).toContain("origins=");
    expect(url).toContain("destinations=");
  });
});

describe("callSearch", () => {
  it("sends search params with lang=ru_RU", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(200, { features: [] }));
    await callSearch({ text: "аптека", ll: "37.61,55.75" });
    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain("search-maps.yandex.ru");
    expect(url).toContain("lang=ru_RU");
  });
});

describe("callSuggest", () => {
  it("sends suggest request", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(200, { results: [] }));
    await callSuggest({ text: "Москва Тверс" });
    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain("suggest-maps.yandex.ru");
  });
});
