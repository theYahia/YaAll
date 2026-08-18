/**
 * Search tools: search_places, get_organization, search_organizations, suggest_address.
 */

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { callSearch, callSuggest } from "../client.js";
import { success, error } from "../lib/formatters.js";
import type { SearchResponse, SuggestResponse } from "../types.js";

export function registerSearchTools(server: McpServer): void {
  server.tool(
    "search_places",
    "Search for places, businesses, and points of interest near a location.",
    {
      query: z.string().min(1).max(200).describe("Search query (e.g. 'аптека', 'кофейня')"),
      lat: z.number().min(-90).max(90).describe("Center latitude"),
      lon: z.number().min(-180).max(180).describe("Center longitude"),
      radius: z.number().int().min(100).max(100000).default(5000)
        .describe("Search radius in meters"),
      type: z.enum(["biz", "geo"]).default("biz")
        .describe("Search type: biz (businesses) or geo (toponym)"),
      results: z.number().int().min(1).max(50).default(10)
        .describe("Max results"),
    },
    async (params) => {
      const result = await callSearch({
        text: params.query,
        ll: `${params.lon},${params.lat}`,
        spn: `${params.radius / 111000},${params.radius / 111000}`,
        type: params.type,
        results: String(params.results),
      });
      if (result.error) return error(result.error);

      const resp = result.data as SearchResponse;
      if (!resp.features?.length) {
        return success({ status: "no_results", message: `No places found for "${params.query}".` });
      }

      return success({
        found: resp.properties?.ResponseMetaData?.SearchResponse?.found,
        results: resp.features.map((f) => ({
          name: f.properties.name,
          description: f.properties.description,
          coordinates: {
            lon: f.geometry.coordinates[0],
            lat: f.geometry.coordinates[1],
          },
          company: f.properties.CompanyMetaData ? {
            id: f.properties.CompanyMetaData.id,
            address: f.properties.CompanyMetaData.address,
            url: f.properties.CompanyMetaData.url,
            phones: f.properties.CompanyMetaData.Phones?.map((p) => p.formatted),
            hours: f.properties.CompanyMetaData.Hours?.text,
            categories: f.properties.CompanyMetaData.Categories?.map((c) => c.name),
          } : null,
        })),
      });
    },
  );

  server.tool(
    "get_organization",
    "Get detailed information about a specific organization by its Yandex Maps ID.",
    {
      organization_id: z.string().min(1).describe("Yandex Maps organization ID"),
    },
    async (params) => {
      const result = await callSearch({
        text: params.organization_id,
        type: "biz",
        results: "1",
      });
      if (result.error) return error(result.error);

      const resp = result.data as SearchResponse;
      const feat = resp.features?.[0];
      if (!feat?.properties.CompanyMetaData) {
        return success({ status: "not_found", message: `Organization ${params.organization_id} not found.` });
      }

      const c = feat.properties.CompanyMetaData;
      return success({
        id: c.id,
        name: c.name,
        address: c.address,
        url: c.url,
        phones: c.Phones?.map((p) => p.formatted),
        hours: c.Hours?.text,
        categories: c.Categories?.map((cat) => cat.name),
        coordinates: {
          lon: feat.geometry.coordinates[0],
          lat: feat.geometry.coordinates[1],
        },
      });
    },
  );

  server.tool(
    "search_organizations",
    "Search for organizations/businesses by name or category near a location.",
    {
      query: z.string().min(1).max(200).describe("Organization name or category"),
      lat: z.number().min(-90).max(90).describe("Center latitude"),
      lon: z.number().min(-180).max(180).describe("Center longitude"),
      radius: z.number().int().min(100).max(100000).default(5000)
        .describe("Search radius in meters"),
      results: z.number().int().min(1).max(50).default(10).describe("Max results"),
    },
    async (params) => {
      const result = await callSearch({
        text: params.query,
        ll: `${params.lon},${params.lat}`,
        spn: `${params.radius / 111000},${params.radius / 111000}`,
        type: "biz",
        results: String(params.results),
      });
      if (result.error) return error(result.error);

      const resp = result.data as SearchResponse;
      if (!resp.features?.length) {
        return success({ status: "no_results", message: `No organizations found for "${params.query}".` });
      }

      return success({
        found: resp.properties?.ResponseMetaData?.SearchResponse?.found,
        organizations: resp.features
          .filter((f) => f.properties.CompanyMetaData)
          .map((f) => {
            const c = f.properties.CompanyMetaData!;
            return {
              id: c.id,
              name: c.name,
              address: c.address,
              phones: c.Phones?.map((p) => p.formatted),
              categories: c.Categories?.map((cat) => cat.name),
              coordinates: {
                lon: f.geometry.coordinates[0],
                lat: f.geometry.coordinates[1],
              },
            };
          }),
      });
    },
  );

  server.tool(
    "suggest_address",
    "Autocomplete an address — returns suggestions as the user types.",
    {
      text: z.string().min(1).max(200).describe("Partial address text"),
      lat: z.number().min(-90).max(90).optional().describe("User location latitude for ranking"),
      lon: z.number().min(-180).max(180).optional().describe("User location longitude for ranking"),
      results: z.number().int().min(1).max(10).default(7).describe("Max suggestions"),
    },
    async (params) => {
      const searchParams: Record<string, string> = {
        text: params.text,
        results: String(params.results),
        types: "geo",
      };
      if (params.lat != null && params.lon != null) {
        searchParams.ll = `${params.lon},${params.lat}`;
      }

      const result = await callSuggest(searchParams);
      if (result.error) return error(result.error);

      const resp = result.data as SuggestResponse;
      if (!resp.results?.length) {
        return success({ status: "no_suggestions", message: `No suggestions for "${params.text}".` });
      }

      return success({
        suggestions: resp.results.map((s) => ({
          title: s.title.text,
          subtitle: s.subtitle?.text,
          tags: s.tags,
          distance: s.distance,
        })),
      });
    },
  );
}
