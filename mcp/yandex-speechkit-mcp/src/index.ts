#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { recognizeSchema, handleRecognize } from "./tools/recognize.js";
import { synthesizeSchema, handleSynthesize } from "./tools/synthesize.js";
import { listVoicesSchema, handleListVoices } from "./tools/list-voices.js";
import { transcribeSchema, handleTranscribe } from "./tools/transcribe.js";
import { speakSchema, handleSpeak } from "./tools/speak.js";

function createServer(): McpServer {
  const server = new McpServer({
    name: "yandex-speechkit-mcp",
    version: "1.1.0",
  });

  // --- Core tools ---
  server.tool(
    "recognize",
    "Speech recognition (STT) via Yandex SpeechKit. Takes Base64 audio, returns text.",
    recognizeSchema.shape,
    async (params) => ({ content: [{ type: "text", text: await handleRecognize(params) }] }),
  );

  server.tool(
    "synthesize",
    "Speech synthesis (TTS) via Yandex SpeechKit. Takes text, returns Base64 audio.",
    synthesizeSchema.shape,
    async (params) => ({ content: [{ type: "text", text: await handleSynthesize(params) }] }),
  );

  server.tool(
    "list_voices",
    "List available TTS voices. Optionally filter by language.",
    listVoicesSchema.shape,
    async (params) => ({ content: [{ type: "text", text: await handleListVoices(params) }] }),
  );

  // --- Skills (high-level wrappers) ---
  server.tool(
    "skill_transcribe",
    "High-level transcription skill. Returns clean text from audio.",
    transcribeSchema.shape,
    async (params) => ({ content: [{ type: "text", text: await handleTranscribe(params) }] }),
  );

  server.tool(
    "skill_synthesize",
    "High-level speech synthesis skill. Smart voice defaults, auto-detects language.",
    speakSchema.shape,
    async (params) => ({ content: [{ type: "text", text: await handleSpeak(params) }] }),
  );

  return server;
}

async function main() {
  const transport = process.argv.includes("--http") ? await startHttp() : new StdioServerTransport();
  const server = createServer();
  await server.connect(transport);

  const mode = process.argv.includes("--http") ? "Streamable HTTP" : "stdio";
  console.error(`[yandex-speechkit-mcp] Server running (${mode}). 5 tools. Auth: YANDEX_SPEECHKIT_API_KEY | IAM_TOKEN + FOLDER_ID.`);
}

async function startHttp() {
  const { StreamableHTTPServerTransport } = await import("@modelcontextprotocol/sdk/server/streamableHttp.js");
  const http = await import("node:http");

  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => crypto.randomUUID(),
  });

  const port = parseInt(process.env.PORT || "8080", 10);

  const httpServer = http.createServer(async (req, res) => {
    if (req.url === "/mcp" || req.url === "/mcp/") {
      await transport.handleRequest(req, res);
    } else if (req.url === "/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "ok", tools: 5 }));
    } else {
      res.writeHead(404);
      res.end("Not found");
    }
  });

  httpServer.listen(port, () => {
    console.error(`[yandex-speechkit-mcp] HTTP listening on :${port}/mcp`);
  });

  return transport;
}

main().catch((error) => {
  console.error("[yandex-speechkit-mcp] Fatal:", error);
  process.exit(1);
});

export { createServer };
