import { z } from "zod";
import { apiGet } from "../client.js";

// --- get_report ---
export const getReportSchema = z.object({
  counter_id: z.number().describe("Yandex.Metrica counter ID"),
  metrics: z.array(z.string()).describe("Metrics array, e.g. ['ym:s:visits', 'ym:s:pageviews', 'ym:s:bounceRate', 'ym:s:avgVisitDurationSeconds']"),
  dimensions: z.array(z.string()).optional().describe("Dimensions array, e.g. ['ym:s:trafficSource', 'ym:s:browser', 'ym:s:country', 'ym:s:deviceCategory']"),
  date1: z.string().describe("Start date YYYY-MM-DD"),
  date2: z.string().describe("End date YYYY-MM-DD"),
  filters: z.string().optional().describe("Filter expression, e.g. ym:s:trafficSource=='organic'"),
  sort: z.string().optional().describe("Sort field, prefix with '-' for descending, e.g. '-ym:s:visits'"),
  limit: z.number().optional().describe("Max rows to return (default 100)"),
});

export async function handleGetReport(params: z.infer<typeof getReportSchema>): Promise<string> {
  const query: Record<string, string> = {
    ids: String(params.counter_id),
    date1: params.date1,
    date2: params.date2,
    metrics: params.metrics.join(","),
  };
  if (params.dimensions?.length) query.dimensions = params.dimensions.join(",");
  if (params.filters) query.filters = params.filters;
  if (params.sort) query.sort = params.sort;
  if (params.limit) query.limit = String(params.limit);

  const data = await apiGet("/stat/v1/data", query);
  return JSON.stringify(data, null, 2);
}

// --- get_report_comparison ---
export const getReportComparisonSchema = z.object({
  counter_id: z.number().describe("Yandex.Metrica counter ID"),
  metrics: z.array(z.string()).describe("Metrics to compare"),
  dimensions: z.array(z.string()).optional().describe("Dimensions to group by"),
  date1_a: z.string().describe("Period A start date YYYY-MM-DD"),
  date2_a: z.string().describe("Period A end date YYYY-MM-DD"),
  date1_b: z.string().describe("Period B start date YYYY-MM-DD"),
  date2_b: z.string().describe("Period B end date YYYY-MM-DD"),
});

export async function handleGetReportComparison(params: z.infer<typeof getReportComparisonSchema>): Promise<string> {
  const query: Record<string, string> = {
    ids: String(params.counter_id),
    date1_a: params.date1_a,
    date2_a: params.date2_a,
    date1_b: params.date1_b,
    date2_b: params.date2_b,
    metrics: params.metrics.join(","),
  };
  if (params.dimensions?.length) query.dimensions = params.dimensions.join(",");

  const data = await apiGet("/stat/v1/data", query);
  return JSON.stringify(data, null, 2);
}

// --- get_report_drilldown ---
export const getReportDrilldownSchema = z.object({
  counter_id: z.number().describe("Yandex.Metrica counter ID"),
  metrics: z.array(z.string()).describe("Metrics to retrieve"),
  dimensions: z.array(z.string()).describe("Dimensions for drill-down hierarchy"),
  date1: z.string().describe("Start date YYYY-MM-DD"),
  date2: z.string().describe("End date YYYY-MM-DD"),
  parent_id: z.string().optional().describe("Parent row ID to drill into. Omit for top-level."),
});

export async function handleGetReportDrilldown(params: z.infer<typeof getReportDrilldownSchema>): Promise<string> {
  const query: Record<string, string> = {
    ids: String(params.counter_id),
    date1: params.date1,
    date2: params.date2,
    metrics: params.metrics.join(","),
    dimensions: params.dimensions.join(","),
  };
  if (params.parent_id) query.parent_id = params.parent_id;

  const data = await apiGet("/stat/v1/data/drilldown", query);
  return JSON.stringify(data, null, 2);
}
