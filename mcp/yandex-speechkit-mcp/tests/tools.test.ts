import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("tool schemas", () => {
  it("recognizeSchema validates correct input", async () => {
    const { recognizeSchema } = await import("../src/tools/recognize.js");
    const result = recognizeSchema.safeParse({ audio_base64: "AAAA" });
    expect(result.success).toBe(true);
  });

  it("recognizeSchema rejects missing audio", async () => {
    const { recognizeSchema } = await import("../src/tools/recognize.js");
    const result = recognizeSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("synthesizeSchema validates correct input", async () => {
    const { synthesizeSchema } = await import("../src/tools/synthesize.js");
    const result = synthesizeSchema.safeParse({ text: "Hello world" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.voice).toBe("filipp");
      expect(result.data.lang).toBe("ru-RU");
      expect(result.data.format).toBe("oggopus");
    }
  });

  it("synthesizeSchema rejects speed out of range", async () => {
    const { synthesizeSchema } = await import("../src/tools/synthesize.js");
    const result = synthesizeSchema.safeParse({ text: "Hi", speed: 5.0 });
    expect(result.success).toBe(false);
  });

  it("listVoicesSchema allows empty input", async () => {
    const { listVoicesSchema } = await import("../src/tools/list-voices.js");
    const result = listVoicesSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("transcribeSchema has return_raw option", async () => {
    const { transcribeSchema } = await import("../src/tools/transcribe.js");
    const result = transcribeSchema.safeParse({ audio_base64: "AAAA", return_raw: true });
    expect(result.success).toBe(true);
  });

  it("speakSchema auto-defaults to filipp voice", async () => {
    const { speakSchema } = await import("../src/tools/speak.js");
    const result = speakSchema.safeParse({ text: "Test" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.voice).toBe("filipp");
      expect(result.data.format).toBe("mp3");
    }
  });
});

describe("handleListVoices", () => {
  it("returns voices with count", async () => {
    const { handleListVoices } = await import("../src/tools/list-voices.js");
    const result = JSON.parse(await handleListVoices({}));
    expect(result.count).toBeGreaterThan(0);
    expect(result.voices).toBeInstanceOf(Array);
    expect(result.voices[0]).toHaveProperty("name");
    expect(result.voices[0]).toHaveProperty("lang");
    expect(result.voices[0]).toHaveProperty("gender");
  });

  it("filters by language", async () => {
    const { handleListVoices } = await import("../src/tools/list-voices.js");
    const result = JSON.parse(await handleListVoices({ lang: "en" }));
    expect(result.count).toBeGreaterThanOrEqual(1);
    for (const v of result.voices) {
      expect(v.lang).toMatch(/^en/);
    }
  });
});

describe("server creation", () => {
  it("createServer returns an MCP server", async () => {
    const { createServer } = await import("../src/index.js");
    const server = createServer();
    expect(server).toBeDefined();
  });
});
