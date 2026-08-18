#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { completionSchema, handleCompletion } from "./tools/completion.js";
import { asyncCompletionSchema, handleAsyncCompletion } from "./tools/async-completion.js";
import { getOperationSchema, handleGetOperation } from "./tools/get-operation.js";
import { embedTextSchema, handleEmbedText } from "./tools/embed-text.js";
import { embedDocumentsSchema, handleEmbedDocuments } from "./tools/embed-documents.js";
import { classifySchema, handleClassify } from "./tools/classify.js";
import { summarizeSchema, handleSummarize } from "./tools/summarize.js";
import { tokenizeSchema, handleTokenize } from "./tools/tokenize.js";

const server = new McpServer({
  name: "yandexgpt-mcp",
  version: "2.0.0",
});

server.tool(
  "complete",
  "Генерация текста через YandexGPT. Синхронный запрос с ожиданием ответа.",
  completionSchema.shape,
  async (params) => ({ content: [{ type: "text", text: await handleCompletion(params) }] }),
);

server.tool(
  "complete_async",
  "Асинхронная генерация текста через YandexGPT. Возвращает ID операции для проверки статуса.",
  asyncCompletionSchema.shape,
  async (params) => ({ content: [{ type: "text", text: await handleAsyncCompletion(params) }] }),
);

server.tool(
  "get_operation",
  "Проверить статус асинхронной операции по ID.",
  getOperationSchema.shape,
  async (params) => ({ content: [{ type: "text", text: await handleGetOperation(params) }] }),
);

server.tool(
  "embed_text",
  "Получить эмбеддинг (векторное представление) одного текста.",
  embedTextSchema.shape,
  async (params) => ({ content: [{ type: "text", text: await handleEmbedText(params) }] }),
);

server.tool(
  "embed_documents",
  "Получить эмбеддинги для массива текстов (batch).",
  embedDocumentsSchema.shape,
  async (params) => ({ content: [{ type: "text", text: await handleEmbedDocuments(params) }] }),
);

server.tool(
  "classify",
  "Zero-shot классификация текста по заданным меткам.",
  classifySchema.shape,
  async (params) => ({ content: [{ type: "text", text: await handleClassify(params) }] }),
);

server.tool(
  "summarize",
  "Суммаризация текста с помощью YandexGPT.",
  summarizeSchema.shape,
  async (params) => ({ content: [{ type: "text", text: await handleSummarize(params) }] }),
);

server.tool(
  "tokenize",
  "Токенизация текста моделью YandexGPT. Возвращает список токенов и их количество.",
  tokenizeSchema.shape,
  async (params) => ({ content: [{ type: "text", text: await handleTokenize(params) }] }),
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[yandexgpt-mcp] Сервер запущен. 8 инструментов. Требуется YANDEX_API_KEY и YANDEX_FOLDER_ID.");
}

main().catch((error) => {
  console.error("[yandexgpt-mcp] Ошибка:", error);
  process.exit(1);
});
