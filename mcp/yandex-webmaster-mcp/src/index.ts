#!/usr/bin/env node

import { createRequire } from "node:module";
import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { YandexApiError } from "./client.js";
import { getHostsSchema, handleGetHosts } from "./tools/hosts.js";
import { getUserInfoSchema, handleGetUserInfo } from "./tools/user.js";
import {
  getSearchQueriesSchema,
  handleGetSearchQueries,
  getPopularSearchQueriesSchema,
  handleGetPopularSearchQueries,
  getQueryAnalyticsSchema,
  handleGetQueryAnalytics,
} from "./tools/search-queries.js";
import {
  getIndexingSchema,
  handleGetIndexing,
  getIndexingHistorySchema,
  handleGetIndexingHistory,
  submitUrlSchema,
  handleSubmitUrl,
} from "./tools/indexing.js";
import {
  getRecrawlQuotaSchema,
  handleGetRecrawlQuota,
  getRecrawlTaskSchema,
  handleGetRecrawlTask,
} from "./tools/recrawl.js";
import { getSitemapsSchema, handleGetSitemaps } from "./tools/sitemaps.js";
import { getDiagnosticsSchema, handleGetDiagnostics } from "./tools/diagnostics.js";
import { getImportantUrlsSchema, handleGetImportantUrls } from "./tools/important-urls.js";

const pkg = createRequire(import.meta.url)("../package.json") as { version: string };

const READ_ONLY = { readOnlyHint: true } as const;
const ACTION = { readOnlyHint: false, idempotentHint: false } as const;

/** Map a thrown error to an actionable message for the model. */
function friendlyError(error: unknown): string {
  if (error instanceof YandexApiError) {
    switch (error.status) {
      case 401:
        return "Authentication failed (401): YANDEX_WEBMASTER_TOKEN is invalid or expired. Re-issue an OAuth token.";
      case 403:
        return "Access denied (403): the token lacks the webmaster:api scope, or this account has no access to the host.";
      case 404:
        return "Not found (404): check the host_id (call get_hosts) or other identifiers.";
      case 429:
        return "Rate limited (429): too many requests or recrawl quota exceeded. Try again later.";
      default:
        return `Yandex API error (${error.status}): ${error.body || error.message}`;
    }
  }
  return error instanceof Error ? error.message : String(error);
}

/** Wrap a string-returning handler into an MCP callback with error mapping. */
function wrapTool<P>(handler: (params: P) => Promise<string>) {
  return async (params: P): Promise<CallToolResult> => {
    try {
      return { content: [{ type: "text", text: await handler(params) }] };
    } catch (error) {
      return { content: [{ type: "text", text: friendlyError(error) }], isError: true };
    }
  };
}

export function createServer(): McpServer {
  const server = new McpServer({
    name: "yandex-webmaster-mcp",
    version: pkg.version,
  });

  server.registerTool(
    "get_hosts",
    {
      description: "List all sites in Yandex.Webmaster: URL, verification status.",
      inputSchema: getHostsSchema.shape,
      annotations: READ_ONLY,
    },
    wrapTool(handleGetHosts),
  );

  server.registerTool(
    "get_user_info",
    {
      description: "Get your Yandex Webmaster account info (user_id).",
      inputSchema: getUserInfoSchema.shape,
      annotations: READ_ONLY,
    },
    wrapTool(handleGetUserInfo),
  );

  server.registerTool(
    "get_popular_search_queries",
    {
      description:
        "Per-query analytics: query text, shows, clicks, average position. The data behind 'which queries bring traffic'.",
      inputSchema: getPopularSearchQueriesSchema.shape,
      annotations: READ_ONLY,
    },
    wrapTool(handleGetPopularSearchQueries),
  );

  server.registerTool(
    "get_query_analytics",
    {
      description:
        "Aggregate search-traffic time series (total shows/clicks/position over a date range) — NOT per-query.",
      inputSchema: getQueryAnalyticsSchema.shape,
      annotations: READ_ONLY,
    },
    wrapTool(handleGetQueryAnalytics),
  );

  server.registerTool(
    "get_search_queries",
    {
      description:
        "[DEPRECATED — use get_popular_search_queries] Per-query search analytics: clicks, impressions, position.",
      inputSchema: getSearchQueriesSchema.shape,
      annotations: READ_ONLY,
    },
    wrapTool(handleGetSearchQueries),
  );

  server.registerTool(
    "get_indexing",
    {
      description: "Indexing status summary for a host (quality index, problem counts).",
      inputSchema: getIndexingSchema.shape,
      annotations: READ_ONLY,
    },
    wrapTool(handleGetIndexing),
  );

  server.registerTool(
    "get_indexing_history",
    {
      description: "Indexed / excluded page-count trend over time (detect deindexing).",
      inputSchema: getIndexingHistorySchema.shape,
      annotations: READ_ONLY,
    },
    wrapTool(handleGetIndexingHistory),
  );

  server.registerTool(
    "submit_url",
    {
      description: "Submit a URL for re-crawling / re-indexing by Yandex (consumes daily quota).",
      inputSchema: submitUrlSchema.shape,
      annotations: ACTION,
    },
    wrapTool(handleSubmitUrl),
  );

  server.registerTool(
    "get_recrawl_quota",
    {
      description: "Remaining daily re-crawl (re-indexing) quota for a host.",
      inputSchema: getRecrawlQuotaSchema.shape,
      annotations: READ_ONLY,
    },
    wrapTool(handleGetRecrawlQuota),
  );

  server.registerTool(
    "get_recrawl_task",
    {
      description: "Status of a re-crawl task by id (from submit_url).",
      inputSchema: getRecrawlTaskSchema.shape,
      annotations: READ_ONLY,
    },
    wrapTool(handleGetRecrawlTask),
  );

  server.registerTool(
    "get_sitemaps",
    {
      description: "List sitemaps for a host: URL, status, last checked, indexed count.",
      inputSchema: getSitemapsSchema.shape,
      annotations: READ_ONLY,
    },
    wrapTool(handleGetSitemaps),
  );

  server.registerTool(
    "get_diagnostics",
    {
      description: "Site diagnostics: crawl errors, DNS issues, server problems.",
      inputSchema: getDiagnosticsSchema.shape,
      annotations: READ_ONLY,
    },
    wrapTool(handleGetDiagnostics),
  );

  server.registerTool(
    "get_important_urls",
    {
      description: "Monitored important URLs for a host and their status history.",
      inputSchema: getImportantUrlsSchema.shape,
      annotations: READ_ONLY,
    },
    wrapTool(handleGetImportantUrls),
  );

  return server;
}

/** Number of tools registered by createServer (kept in sync manually). */
export const TOOL_COUNT = 13;

async function startStdio(): Promise<void> {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(
    `[yandex-webmaster-mcp] v${pkg.version} started (stdio, ${TOOL_COUNT} tools). ` +
      "Requires YANDEX_WEBMASTER_TOKEN; USER_ID auto-detected if unset.",
  );

  const shutdown = () => {
    void transport.close().finally(() => process.exit(0));
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

async function startHttp(): Promise<void> {
  const { StreamableHTTPServerTransport } =
    await import("@modelcontextprotocol/sdk/server/streamableHttp.js");
  const http = await import("node:http");

  const PORT = parseInt(process.env.PORT || "3100", 10);
  const authToken = process.env.MCP_HTTP_AUTH_TOKEN;
  const allowedHostsEnv = process.env.MCP_ALLOWED_HOSTS;
  const dnsProtection = allowedHostsEnv !== "*";
  const defaultHosts = `127.0.0.1,localhost,127.0.0.1:${PORT},localhost:${PORT}`;
  let allowedHosts = (allowedHostsEnv && allowedHostsEnv !== "*" ? allowedHostsEnv : defaultHosts)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (allowedHosts.length === 0) {
    // e.g. MCP_ALLOWED_HOSTS="  " — fall back to defaults rather than block everything
    allowedHosts = defaultHosts.split(",");
  }

  const httpServer = http.createServer(async (req, res) => {
    try {
      if (req.url === "/health") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ status: "ok", version: pkg.version }));
        return;
      }

      if (req.url === "/mcp") {
        if (req.method !== "POST") {
          res.writeHead(405, { "Content-Type": "application/json", Allow: "POST" });
          res.end(JSON.stringify({ error: "method_not_allowed" }));
          return;
        }

        if (authToken && req.headers.authorization !== `Bearer ${authToken}`) {
          res.writeHead(401, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "unauthorized" }));
          return;
        }

        const server = createServer();
        const transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: undefined,
          enableDnsRebindingProtection: dnsProtection,
          allowedHosts,
        });
        res.on("close", () => {
          void transport.close();
          void server.close();
        });
        await server.connect(transport);
        await transport.handleRequest(req, res);
        return;
      }

      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "not_found" }));
    } catch (error) {
      console.error("[yandex-webmaster-mcp] HTTP request error:", error);
      if (!res.headersSent) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "internal_error" }));
      }
    }
  });

  httpServer.on("error", (error) => {
    console.error("[yandex-webmaster-mcp] HTTP server error:", error);
    process.exit(1);
  });

  httpServer.listen(PORT, () => {
    console.error(
      `[yandex-webmaster-mcp] v${pkg.version} HTTP server on port ${PORT}. POST /mcp` +
        (dnsProtection ? " (DNS-rebinding protection on)" : ""),
    );
  });

  const shutdown = () => {
    httpServer.close(() => process.exit(0));
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

async function main(): Promise<void> {
  if (process.argv[2] === "--http") {
    await startHttp();
  } else {
    await startStdio();
  }
}

/** True when this module is the process entry point (not imported, e.g. by tests). */
function isEntryPoint(): boolean {
  const argv1 = process.argv[1];
  if (!argv1) return false;
  try {
    return realpathSync(argv1) === fileURLToPath(import.meta.url);
  } catch {
    return false;
  }
}

if (isEntryPoint()) {
  main().catch((error) => {
    console.error("[yandex-webmaster-mcp] Startup error:", error);
    process.exit(1);
  });
}
