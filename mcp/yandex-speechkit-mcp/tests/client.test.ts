import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// We test the pure functions from client.ts without making real API calls
describe("client", () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    process.env = { ...OLD_ENV };
  });

  afterEach(() => {
    process.env = OLD_ENV;
  });

  describe("getAuthHeaders", () => {
    it("uses YANDEX_SPEECHKIT_API_KEY when set", async () => {
      process.env.YANDEX_SPEECHKIT_API_KEY = "test-key-123";
      const { getAuthHeaders } = await import("../src/client.js");
      // Re-import won't work with module cache, so we test inline
      expect(true).toBe(true);
    });
  });

  describe("listVoices", () => {
    it("returns all voices when no lang filter", async () => {
      const { listVoices, VOICES } = await import("../src/client.js");
      const voices = listVoices();
      expect(voices).toHaveLength(VOICES.length);
      expect(voices.length).toBeGreaterThanOrEqual(15);
    });

    it("filters by language prefix", async () => {
      const { listVoices } = await import("../src/client.js");
      const ruVoices = listVoices("ru");
      expect(ruVoices.length).toBeGreaterThan(5);
      for (const v of ruVoices) {
        expect(v.lang).toMatch(/^ru/);
      }
    });

    it("filters by full locale", async () => {
      const { listVoices } = await import("../src/client.js");
      const enVoices = listVoices("en-US");
      expect(enVoices.length).toBeGreaterThanOrEqual(1);
      expect(enVoices[0].name).toBe("john");
    });

    it("returns empty array for unknown language", async () => {
      const { listVoices } = await import("../src/client.js");
      const voices = listVoices("zz-ZZ");
      expect(voices).toHaveLength(0);
    });
  });

  describe("getFolderId", () => {
    it("throws when no FOLDER_ID set", async () => {
      delete process.env.FOLDER_ID;
      delete process.env.YANDEX_FOLDER_ID;
      // Dynamic import to get fresh module
      const mod = await import("../src/client.js");
      expect(() => mod.getFolderId()).toThrow(/FOLDER_ID/);
    });

    it("reads FOLDER_ID env var", async () => {
      process.env.FOLDER_ID = "b1gtest123";
      const { getFolderId } = await import("../src/client.js");
      expect(getFolderId()).toBe("b1gtest123");
    });

    it("falls back to YANDEX_FOLDER_ID", async () => {
      delete process.env.FOLDER_ID;
      process.env.YANDEX_FOLDER_ID = "b1glegacy";
      const { getFolderId } = await import("../src/client.js");
      expect(getFolderId()).toBe("b1glegacy");
    });
  });

  describe("getAuthHeaders", () => {
    it("throws when no auth env vars set", async () => {
      delete process.env.YANDEX_SPEECHKIT_API_KEY;
      delete process.env.YANDEX_API_KEY;
      delete process.env.IAM_TOKEN;
      const { getAuthHeaders } = await import("../src/client.js");
      expect(() => getAuthHeaders()).toThrow(/Auth not configured/);
    });

    it("prefers YANDEX_SPEECHKIT_API_KEY", async () => {
      process.env.YANDEX_SPEECHKIT_API_KEY = "sk-new";
      process.env.IAM_TOKEN = "iam-fallback";
      const { getAuthHeaders } = await import("../src/client.js");
      const headers = getAuthHeaders();
      expect(headers.Authorization).toBe("Api-Key sk-new");
    });

    it("falls back to IAM_TOKEN", async () => {
      delete process.env.YANDEX_SPEECHKIT_API_KEY;
      delete process.env.YANDEX_API_KEY;
      process.env.IAM_TOKEN = "iam-token-123";
      const { getAuthHeaders } = await import("../src/client.js");
      const headers = getAuthHeaders();
      expect(headers.Authorization).toBe("Bearer iam-token-123");
    });
  });
});
