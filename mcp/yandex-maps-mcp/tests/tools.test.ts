/**
 * Tests for Yandex Maps MCP tools — unit tests with mocked fetch.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerGeocodingTools } from "../src/tools/geocoding.js";
import { registerRoutingTools } from "../src/tools/routing.js";
import { registerSearchTools } from "../src/tools/search.js";
import { registerStaticMapTools } from "../src/tools/static-map.js";

const mockFetch = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", mockFetch);
  process.env.YANDEX_MAPS_API_KEY = "test-key";
});

afterEach(() => {
  vi.restoreAllMocks();
  delete process.env.YANDEX_MAPS_API_KEY;
});

function mockResponse(status: number, body: unknown = {}) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

describe("tool registration", () => {
  it("registers all 10 tools without errors", () => {
    const server = new McpServer({ name: "test", version: "1.0.0" });
    expect(() => {
      registerGeocodingTools(server);
      registerRoutingTools(server);
      registerSearchTools(server);
      registerStaticMapTools(server);
    }).not.toThrow();
  });
});

describe("formatters", () => {
  it("success returns JSON content", async () => {
    const { success } = await import("../src/lib/formatters.js");
    const result = success({ test: true });
    expect(result.content[0].type).toBe("text");
    expect(JSON.parse(result.content[0].text)).toEqual({ test: true });
  });

  it("error returns isError flag", async () => {
    const { error } = await import("../src/lib/formatters.js");
    const result = error("fail");
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe("fail");
  });

  it("parsePos parses Yandex coordinate format", async () => {
    const { parsePos } = await import("../src/lib/formatters.js");
    const pos = parsePos("37.6173 55.7558");
    expect(pos.lat).toBeCloseTo(55.7558);
    expect(pos.lon).toBeCloseTo(37.6173);
  });
});
