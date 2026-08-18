#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { handleListApplications } from "./tools/applications.js";
import { getReportSchema, handleGetReport, getCohortsSchema, handleGetCohorts } from "./tools/reports.js";
import { getProfilesSchema, handleGetProfiles } from "./tools/profiles.js";
import { getPushCampaignsSchema, handleGetPushCampaigns, sendPushSchema, handleSendPush } from "./tools/push.js";
import { getDeeplinksSchema, handleGetDeeplinks } from "./tools/deeplinks.js";
import { getCrashReportSchema, handleGetCrashReport } from "./tools/crashes.js";

const server = new McpServer({
  name: "appmetrica-mcp",
  version: "1.0.0",
});

server.tool(
  "list_applications",
  "Список приложений в AppMetrica: ID, название, платформа.",
  {},
  async () => ({
    content: [{ type: "text", text: await handleListApplications() }],
  }),
);

server.tool(
  "get_report",
  "Отчёт AppMetrica: метрики (sessions, users, events) по группировкам за период.",
  getReportSchema.shape,
  async (params) => ({
    content: [{ type: "text", text: await handleGetReport(params) }],
  }),
);

server.tool(
  "get_cohorts",
  "Когортный анализ: retention, sessions per user по дате установки.",
  getCohortsSchema.shape,
  async (params) => ({
    content: [{ type: "text", text: await handleGetCohorts(params) }],
  }),
);

server.tool(
  "get_profiles",
  "Профили пользователей приложения с фильтрацией.",
  getProfilesSchema.shape,
  async (params) => ({
    content: [{ type: "text", text: await handleGetProfiles(params) }],
  }),
);

server.tool(
  "get_push_campaigns",
  "Список push-кампаний приложения.",
  getPushCampaignsSchema.shape,
  async (params) => ({
    content: [{ type: "text", text: await handleGetPushCampaigns(params) }],
  }),
);

server.tool(
  "send_push",
  "Отправить push-уведомление группе пользователей.",
  sendPushSchema.shape,
  async (params) => ({
    content: [{ type: "text", text: await handleSendPush(params) }],
  }),
);

server.tool(
  "get_deeplinks",
  "Диплинки приложения в AppMetrica.",
  getDeeplinksSchema.shape,
  async (params) => ({
    content: [{ type: "text", text: await handleGetDeeplinks(params) }],
  }),
);

server.tool(
  "get_crash_report",
  "Отчёт о крашах приложения за период: группы ошибок, crash-free %.",
  getCrashReportSchema.shape,
  async (params) => ({
    content: [{ type: "text", text: await handleGetCrashReport(params) }],
  }),
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[appmetrica-mcp] Сервер запущен. 8 инструментов. Требуется APPMETRICA_TOKEN.");
}

main().catch((error) => {
  console.error("[appmetrica-mcp] Ошибка запуска:", error);
  process.exit(1);
});
