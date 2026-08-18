/**
 * Static map tool: get_static_map.
 */

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getStaticMapUrl } from "../client.js";
import { success, error } from "../lib/formatters.js";

export function registerStaticMapTools(server: McpServer): void {
  server.tool(
    "get_static_map",
    "Generate a URL for a static map image with optional markers. Returns a URL that can be embedded.",
    {
      center_lat: z.number().min(-90).max(90).describe("Map center latitude"),
      center_lon: z.number().min(-180).max(180).describe("Map center longitude"),
      zoom: z.number().int().min(1).max(17).default(14).describe("Zoom level (1-17)"),
      width: z.number().int().min(100).max(650).default(450).describe("Image width in pixels"),
      height: z.number().int().min(100).max(450).default(300).describe("Image height in pixels"),
      markers: z.array(z.object({
        lat: z.number().min(-90).max(90),
        lon: z.number().min(-180).max(180),
        color: z.enum(["rd", "bl", "gn", "yw", "or", "wt"]).default("rd")
          .describe("Marker color: rd=red, bl=blue, gn=green, yw=yellow, or=orange, wt=white"),
      })).max(50).optional().describe("Markers to place on the map"),
    },
    async (params) => {
      try {
        const mapParams: Record<string, string> = {
          ll: `${params.center_lon},${params.center_lat}`,
          z: String(params.zoom),
          size: `${params.width},${params.height}`,
          l: "map",
        };

        if (params.markers?.length) {
          const pts = params.markers
            .map((m) => `${m.lon},${m.lat},pm2${m.color}l`)
            .join("~");
          mapParams.pt = pts;
        }

        const url = getStaticMapUrl(mapParams);
        return success({
          url,
          center: { lat: params.center_lat, lon: params.center_lon },
          zoom: params.zoom,
          size: `${params.width}x${params.height}`,
          markers_count: params.markers?.length || 0,
        });
      } catch {
        return error("YANDEX_MAPS_API_KEY is not set.");
      }
    },
  );
}
