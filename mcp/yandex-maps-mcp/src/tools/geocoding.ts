/**
 * Geocoding tools: geocode, reverse_geocode.
 */

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { callGeocoder } from "../client.js";
import { success, error, parsePos } from "../lib/formatters.js";
import type { GeocoderResponse } from "../types.js";

export function registerGeocodingTools(server: McpServer): void {
  server.tool(
    "geocode",
    "Convert a text address to geographic coordinates (latitude/longitude). Supports Russian and international addresses.",
    {
      address: z.string().min(1).max(300).describe("Address to geocode (e.g. 'Москва, Тверская 1')"),
      results: z.number().int().min(1).max(10).default(5).describe("Max number of results"),
    },
    async (params) => {
      const result = await callGeocoder({
        geocode: params.address,
        results: String(params.results),
      });
      if (result.error) return error(result.error);

      const resp = result.data as GeocoderResponse;
      const members = resp.response?.GeoObjectCollection?.featureMember;
      if (!members?.length) {
        return success({ status: "no_results", message: `No results for "${params.address}".` });
      }

      return success({
        found: resp.response.GeoObjectCollection.metaDataProperty.GeocoderResponseMetaData.found,
        results: members.map((m) => {
          const geo = m.GeoObject;
          const meta = geo.metaDataProperty.GeocoderMetaData;
          const pos = parsePos(geo.Point.pos);
          return {
            name: geo.name,
            description: geo.description,
            formatted_address: meta.Address.formatted,
            kind: meta.kind,
            precision: meta.precision,
            coordinates: pos,
            postal_code: meta.Address.postal_code || null,
            country_code: meta.Address.country_code,
            components: meta.Address.Components,
          };
        }),
      });
    },
  );

  server.tool(
    "reverse_geocode",
    "Convert geographic coordinates to a street address (reverse geocoding).",
    {
      lat: z.number().min(-90).max(90).describe("Latitude"),
      lon: z.number().min(-180).max(180).describe("Longitude"),
      results: z.number().int().min(1).max(10).default(3).describe("Max number of results"),
      kind: z.enum(["house", "street", "metro", "district", "locality"]).optional()
        .describe("Filter by address component kind"),
    },
    async (params) => {
      const geocodeParams: Record<string, string> = {
        geocode: `${params.lon},${params.lat}`,
        results: String(params.results),
      };
      if (params.kind) geocodeParams.kind = params.kind;

      const result = await callGeocoder(geocodeParams);
      if (result.error) return error(result.error);

      const resp = result.data as GeocoderResponse;
      const members = resp.response?.GeoObjectCollection?.featureMember;
      if (!members?.length) {
        return success({ status: "no_results", message: `No address found at ${params.lat}, ${params.lon}.` });
      }

      return success({
        coordinates: { lat: params.lat, lon: params.lon },
        results: members.map((m) => {
          const geo = m.GeoObject;
          const meta = geo.metaDataProperty.GeocoderMetaData;
          return {
            name: geo.name,
            description: geo.description,
            formatted_address: meta.Address.formatted,
            kind: meta.kind,
            precision: meta.precision,
            components: meta.Address.Components,
          };
        }),
      });
    },
  );
}
