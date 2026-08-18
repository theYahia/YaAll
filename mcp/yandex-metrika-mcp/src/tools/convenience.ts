import { z } from "zod";
import { apiGet } from "../client.js";

// --- get_traffic_summary ---
export const getTrafficSummarySchema = z.object({
  counter_id: z.number().describe("Yandex.Metrica counter ID"),
  date1: z.string().describe("Start date YYYY-MM-DD"),
  date2: z.string().describe("End date YYYY-MM-DD"),
});

export async function handleGetTrafficSummary(params: z.infer<typeof getTrafficSummarySchema>): Promise<string> {
  const query: Record<string, string> = {
    ids: String(params.counter_id),
    date1: params.date1,
    date2: params.date2,
    metrics: "ym:s:visits,ym:s:pageviews,ym:s:users,ym:s:bounceRate,ym:s:avgVisitDurationSeconds",
  };
  const data = await apiGet("/stat/v1/data", query);
  return JSON.stringify(data, null, 2);
}

// --- get_traffic_sources ---
export const getTrafficSourcesSchema = z.object({
  counter_id: z.number().describe("Yandex.Metrica counter ID"),
  date1: z.string().describe("Start date YYYY-MM-DD"),
  date2: z.string().describe("End date YYYY-MM-DD"),
});

export async function handleGetTrafficSources(params: z.infer<typeof getTrafficSourcesSchema>): Promise<string> {
  const query: Record<string, string> = {
    ids: String(params.counter_id),
    date1: params.date1,
    date2: params.date2,
    metrics: "ym:s:visits,ym:s:users,ym:s:bounceRate",
    dimensions: "ym:s:lastTrafficSource",
  };
  const data = await apiGet("/stat/v1/data", query);
  return JSON.stringify(data, null, 2);
}

// --- get_top_pages ---
export const getTopPagesSchema = z.object({
  counter_id: z.number().describe("Yandex.Metrica counter ID"),
  date1: z.string().describe("Start date YYYY-MM-DD"),
  date2: z.string().describe("End date YYYY-MM-DD"),
  limit: z.number().optional().describe("Number of pages to return (default 20)"),
});

export async function handleGetTopPages(params: z.infer<typeof getTopPagesSchema>): Promise<string> {
  const query: Record<string, string> = {
    ids: String(params.counter_id),
    date1: params.date1,
    date2: params.date2,
    metrics: "ym:s:visits,ym:s:pageviews,ym:s:bounceRate,ym:s:avgVisitDurationSeconds",
    dimensions: "ym:s:startURL",
    sort: "-ym:s:pageviews",
    limit: String(params.limit ?? 20),
  };
  const data = await apiGet("/stat/v1/data", query);
  return JSON.stringify(data, null, 2);
}
