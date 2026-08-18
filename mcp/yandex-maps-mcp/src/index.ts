#!/usr/bin/env node

/**
 * @theyahia/yandex-maps-mcp — MCP server for Yandex Maps API
 *
 * 10 tools: geocode, reverse_geocode, search_places, get_route,
 * get_route_matrix, suggest_address, get_static_map, get_organization,
 * search_organizations, get_distance.
 *
 * Security:
 *   - stdout reserved for JSON-RPC — all logs go to stderr
 *   - API key never logged or in error responses
 *   - Input validation via Zod on every tool call
 *   - Hard timeout (10s) on all API requests
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { registerGeocodingTools } from "./tools/geocoding.js";
import { registerRoutingTools } from "./tools/routing.js";
import { registerSearchTools } from "./tools/search.js";
import { registerStaticMapTools } from "./tools/static-map.js";

// ---------------------------------------------------------------------------
// Environment validation
// ---------------------------------------------------------------------------

const apiKey = process.env.YANDEX_MAPS_API_KEY;

if (!apiKey) {
  console.error(
    "[yandex-maps-mcp] FATAL: YANDEX_MAPS_API_KEY is not set.\n" +
    "  Get your key at https://developer.tech.yandex.ru/\n" +
    "  Then add it to your MCP client env configuration.",
  );
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Server setup
// ---------------------------------------------------------------------------

const server = new McpServer({
  name: "yandex-maps-mcp",
  version: "1.0.0",
});

// Geocoding (2)
registerGeocodingTools(server);    // geocode, reverse_geocode

// Routing (3)
registerRoutingTools(server);      // get_route, get_route_matrix, get_distance

// Search & Suggest (4)
registerSearchTools(server);       // search_places, get_organization, search_organizations, suggest_address

// Static Maps (1)
registerStaticMapTools(server);    // get_static_map

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

const transport = new StdioServerTransport();
await server.connect(transport);

console.error("[yandex-maps-mcp] Server started — 10 tools ready.");
