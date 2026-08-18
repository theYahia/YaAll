#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import http from "node:http";

// Management — Counters
import {
  listCountersSchema, handleListCounters,
  getCounterSchema, handleGetCounter,
  createCounterSchema, handleCreateCounter,
  updateCounterSchema, handleUpdateCounter,
  deleteCounterSchema, handleDeleteCounter,
} from "./tools/counters.js";

// Management — Goals
import {
  listGoalsSchema, handleListGoals,
  createGoalSchema, handleCreateGoal,
  deleteGoalSchema, handleDeleteGoal,
} from "./tools/goals.js";

// Management — Logs
import { exportLogsSchema, handleExportLogs } from "./tools/logs.js";

// Reporting API
import {
  getReportSchema, handleGetReport,
  getReportComparisonSchema, handleGetReportComparison,
  getReportDrilldownSchema, handleGetReportDrilldown,
} from "./tools/report.js";

// Convenience wrappers
import {
  getTrafficSummarySchema, handleGetTrafficSummary,
  getTrafficSourcesSchema, handleGetTrafficSources,
  getTopPagesSchema, handleGetTopPages,
} from "./tools/convenience.js";

const TOOL_COUNT = 15;

function createServer(): McpServer {
  const server = new McpServer({
    name: "yandex-metrika-mcp",
    version: "2.0.0",
  });

  // ─── Management: Counters ───

  server.tool(
    "list_counters",
    "List all Yandex.Metrica counters available to the authenticated user. Returns counter ID, name, site URL, and status. Supports search filtering.",
    listCountersSchema.shape,
    async (params) => ({
      content: [{ type: "text", text: await handleListCounters(params) }],
    }),
  );

  server.tool(
    "get_counter",
    "Get full details of a single Yandex.Metrica counter by ID, including configuration, code snippet status, and goals count.",
    getCounterSchema.shape,
    async (params) => ({
      content: [{ type: "text", text: await handleGetCounter(params) }],
    }),
  );

  server.tool(
    "create_counter",
    "Create a new Yandex.Metrica counter for a website. Returns the new counter ID and tracking code. You need to install the tracking code on the site afterwards.",
    createCounterSchema.shape,
    async (params) => ({
      content: [{ type: "text", text: await handleCreateCounter(params) }],
    }),
  );

  server.tool(
    "update_counter",
    "Update an existing Yandex.Metrica counter — change its name or site URL.",
    updateCounterSchema.shape,
    async (params) => ({
      content: [{ type: "text", text: await handleUpdateCounter(params) }],
    }),
  );

  server.tool(
    "delete_counter",
    "Permanently delete a Yandex.Metrica counter. This action is irreversible — all historical data for this counter will be lost.",
    deleteCounterSchema.shape,
    async (params) => ({
      content: [{ type: "text", text: await handleDeleteCounter(params) }],
    }),
  );

  // ─── Management: Goals ───

  server.tool(
    "list_goals",
    "List all goals configured for a Yandex.Metrica counter. Goals track conversions like page visits, button clicks, or multi-step funnels.",
    listGoalsSchema.shape,
    async (params) => ({
      content: [{ type: "text", text: await handleListGoals(params) }],
    }),
  );

  server.tool(
    "create_goal",
    "Create a new conversion goal for a counter. Supports types: 'url' (page visit), 'number' (page count threshold), 'step' (multi-step funnel), 'action' (JavaScript event).",
    createGoalSchema.shape,
    async (params) => ({
      content: [{ type: "text", text: await handleCreateGoal(params) }],
    }),
  );

  server.tool(
    "delete_goal",
    "Delete a conversion goal from a counter. Historical goal data in reports is preserved.",
    deleteGoalSchema.shape,
    async (params) => ({
      content: [{ type: "text", text: await handleDeleteGoal(params) }],
    }),
  );

  // ─── Management: Logs ───

  server.tool(
    "export_logs",
    "Export raw visit or hit logs via the Logs API. Creates a log request and evaluates feasibility. Use source='visits' for session data, source='hits' for pageview data.",
    exportLogsSchema.shape,
    async (params) => ({
      content: [{ type: "text", text: await handleExportLogs(params) }],
    }),
  );

  // ─── Reporting API ───

  server.tool(
    "get_report",
    "Flexible Yandex.Metrica reporting endpoint. Query any combination of metrics (ym:s:visits, ym:s:pageviews, ym:s:bounceRate, ym:s:avgVisitDurationSeconds, ym:s:users, ym:s:newUsers, etc.) with dimensions (ym:s:trafficSource, ym:s:searchEngine, ym:s:country, ym:s:browser, ym:s:deviceCategory, ym:s:date, etc.) over a date range. Supports filters and sorting.",
    getReportSchema.shape,
    async (params) => ({
      content: [{ type: "text", text: await handleGetReport(params) }],
    }),
  );

  server.tool(
    "get_report_comparison",
    "Compare metrics between two date periods (A vs B). Useful for week-over-week, month-over-month, or campaign before/after analysis.",
    getReportComparisonSchema.shape,
    async (params) => ({
      content: [{ type: "text", text: await handleGetReportComparison(params) }],
    }),
  );

  server.tool(
    "get_report_drilldown",
    "Drill down into report data hierarchically. Start at top level, then pass parent_id to explore sub-dimensions (e.g., country -> city, traffic source -> campaign).",
    getReportDrilldownSchema.shape,
    async (params) => ({
      content: [{ type: "text", text: await handleGetReportDrilldown(params) }],
    }),
  );

  // ─── Convenience Wrappers ───

  server.tool(
    "get_traffic_summary",
    "Quick traffic overview for a counter over a date range. Returns visits, pageviews, unique users, bounce rate, and average visit duration in one call.",
    getTrafficSummarySchema.shape,
    async (params) => ({
      content: [{ type: "text", text: await handleGetTrafficSummary(params) }],
    }),
  );

  server.tool(
    "get_traffic_sources",
    "Traffic sources breakdown — visits and users by source channel (organic search, direct, social, referral, ad). Quick way to see where traffic comes from.",
    getTrafficSourcesSchema.shape,
    async (params) => ({
      content: [{ type: "text", text: await handleGetTrafficSources(params) }],
    }),
  );

  server.tool(
    "get_top_pages",
    "Top pages by pageviews for a counter. Returns URL, visits, pageviews, bounce rate, and avg duration for each page. Useful for content performance analysis.",
    getTopPagesSchema.shape,
    async (params) => ({
      content: [{ type: "text", text: await handleGetTopPages(params) }],
    }),
  );

  return server;
}

async function main() {
  const args = process.argv.slice(2);
  const httpMode = args.includes("--http");
  const port = Number(args.find((a) => a.startsWith("--port="))?.split("=")[1]) || 3000;

  const server = createServer();

  if (httpMode) {
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: () => crypto.randomUUID() });
    await server.connect(transport);

    const httpServer = http.createServer(async (req, res) => {
      if (req.url === "/mcp" || req.url?.startsWith("/mcp?")) {
        await transport.handleRequest(req, res);
      } else if (req.url === "/health") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ status: "ok", tools: TOOL_COUNT }));
      } else {
        res.writeHead(404);
        res.end("Not found");
      }
    });

    httpServer.listen(port, () => {
      console.error(`[yandex-metrika-mcp] HTTP mode on port ${port}. ${TOOL_COUNT} tools. POST /mcp`);
    });
  } else {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error(`[yandex-metrika-mcp] Stdio mode. ${TOOL_COUNT} tools. Requires YANDEX_METRIKA_TOKEN.`);
  }
}

main().catch((error) => {
  console.error("[yandex-metrika-mcp] Startup error:", error);
  process.exit(1);
});

export { createServer };
