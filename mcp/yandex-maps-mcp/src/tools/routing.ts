/**
 * Routing tools: get_route, get_route_matrix, get_distance.
 */

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { callRouter, callMatrix } from "../client.js";
import { success, error } from "../lib/formatters.js";
import type { RouterResponse, MatrixResponse } from "../types.js";

const coordSchema = z.string().regex(
  /^-?\d+\.?\d*,-?\d+\.?\d*$/,
  "Format: lat,lon (e.g. '55.7558,37.6173')",
);

export function registerRoutingTools(server: McpServer): void {
  server.tool(
    "get_route",
    "Calculate a route between two points. Returns distance, duration, and route geometry.",
    {
      origin: coordSchema.describe("Start point as 'lat,lon'"),
      destination: coordSchema.describe("End point as 'lat,lon'"),
      mode: z.enum(["driving", "transit", "walking", "truck"]).default("driving")
        .describe("Travel mode"),
    },
    async (params) => {
      const waypoints = `${params.origin}|${params.destination}`;
      const result = await callRouter(waypoints, params.mode);
      if (result.error) return error(result.error);

      const resp = result.data as RouterResponse;
      const routes = resp.features;
      if (!routes?.length) {
        return success({ status: "no_route", message: "No route found between the given points." });
      }

      return success({
        mode: params.mode,
        routes: routes.map((r) => ({
          duration: r.properties.RouteMetaData.Duration,
          distance: r.properties.RouteMetaData.Distance,
          points_count: r.geometry.coordinates.length,
        })),
      });
    },
  );

  server.tool(
    "get_route_matrix",
    "Calculate distance/duration matrix between multiple origins and destinations.",
    {
      origins: z.array(coordSchema).min(1).max(10).describe("Array of origin points as 'lat,lon'"),
      destinations: z.array(coordSchema).min(1).max(10).describe("Array of destination points as 'lat,lon'"),
      mode: z.enum(["driving", "transit", "walking", "truck"]).default("driving")
        .describe("Travel mode"),
    },
    async (params) => {
      const result = await callMatrix(
        params.origins.join("|"),
        params.destinations.join("|"),
        params.mode,
      );
      if (result.error) return error(result.error);

      const resp = result.data as MatrixResponse;
      return success({
        mode: params.mode,
        origins_count: params.origins.length,
        destinations_count: params.destinations.length,
        rows: resp.rows,
      });
    },
  );

  server.tool(
    "get_distance",
    "Get the driving distance and estimated travel time between two points.",
    {
      origin: coordSchema.describe("Start point as 'lat,lon'"),
      destination: coordSchema.describe("End point as 'lat,lon'"),
      mode: z.enum(["driving", "transit", "walking", "truck"]).default("driving")
        .describe("Travel mode"),
    },
    async (params) => {
      const waypoints = `${params.origin}|${params.destination}`;
      const result = await callRouter(waypoints, params.mode);
      if (result.error) return error(result.error);

      const resp = result.data as RouterResponse;
      const route = resp.features?.[0];
      if (!route) {
        return success({ status: "no_route", message: "No route found." });
      }

      return success({
        origin: params.origin,
        destination: params.destination,
        mode: params.mode,
        distance: route.properties.RouteMetaData.Distance,
        duration: route.properties.RouteMetaData.Duration,
      });
    },
  );
}
