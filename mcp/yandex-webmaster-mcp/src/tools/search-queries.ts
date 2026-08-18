import { z } from "zod";
import { apiGet } from "../client.js";
import { dateString, formatParam, hostIdParam, lastNDays } from "./common.js";
import { formatDate, formatNumber, mdTable, present, renderAuto } from "../format.js";
import type { PopularQueriesResponse } from "../types.js";

const INDICATOR = z.enum([
  "TOTAL_SHOWS",
  "TOTAL_CLICKS",
  "AVG_SHOW_POSITION",
  "AVG_CLICK_POSITION",
]);

const INDICATOR_LABELS: Record<string, string> = {
  TOTAL_SHOWS: "Shows",
  TOTAL_CLICKS: "Clicks",
  AVG_SHOW_POSITION: "Avg Show Pos",
  AVG_CLICK_POSITION: "Avg Click Pos",
};

function indicatorLabel(key: string): string {
  return INDICATOR_LABELS[key] ?? key;
}

// --- Popular search queries: per-query analytics (/search-queries/popular) ---

export const getPopularSearchQueriesSchema = z.object({
  host_id: hostIdParam,
  order_by: z
    .enum(["TOTAL_SHOWS", "TOTAL_CLICKS"])
    .optional()
    .describe("Sort field (default TOTAL_SHOWS)"),
  query_indicator: z.array(INDICATOR).optional().describe("Indicators to return (default: all)"),
  device_type_indicator: z
    .enum(["ALL", "DESKTOP", "MOBILE", "TABLET", "MOBILE_AND_TABLET"])
    .optional()
    .describe("Device type (default ALL)"),
  date_from: dateString.optional().describe("Start date YYYY-MM-DD (default: 7 days ago)"),
  date_to: dateString.optional().describe("End date YYYY-MM-DD (default: today)"),
  offset: z.number().int().min(0).optional().describe("Pagination offset"),
  limit: z.number().int().min(1).max(500).optional().describe("Max rows (default 50, max 500)"),
  format: formatParam,
});

function renderPopular(data: unknown): string {
  const queries = (data as PopularQueriesResponse)?.queries;
  if (!Array.isArray(queries)) return renderAuto(data);
  if (queries.length === 0) return "_(no queries for this period)_";

  const indicatorKeys: string[] = [];
  for (const q of queries) {
    for (const k of Object.keys(q.indicators ?? {})) {
      if (!indicatorKeys.includes(k)) indicatorKeys.push(k);
    }
  }

  const rows = queries.map((q) => {
    const row: Record<string, unknown> = { query: q.query_text };
    for (const k of indicatorKeys) row[k] = q.indicators?.[k];
    return row;
  });

  return mdTable(rows, [
    { key: "query", label: "Query" },
    ...indicatorKeys.map((k) => ({
      key: k,
      label: indicatorLabel(k),
      format: (v: unknown) => formatNumber(v),
    })),
  ]);
}

export async function handleGetPopularSearchQueries(
  params: z.infer<typeof getPopularSearchQueriesSchema>,
): Promise<string> {
  const range =
    params.date_from && params.date_to
      ? { date_from: params.date_from, date_to: params.date_to }
      : lastNDays();
  const data = await apiGet(`/hosts/${params.host_id}/search-queries/popular`, {
    order_by: params.order_by ?? "TOTAL_SHOWS",
    query_indicator: params.query_indicator,
    device_type_indicator: params.device_type_indicator,
    date_from: range.date_from,
    date_to: range.date_to,
    offset: params.offset,
    limit: params.limit ?? 50,
  });
  return present(data, params.format, renderPopular);
}

// --- Aggregate traffic time series (/search-queries/all/history) ---

export const getQueryAnalyticsSchema = z.object({
  host_id: hostIdParam,
  query_indicator: z.array(INDICATOR).optional().describe("Indicators to return (default: all)"),
  device_type_indicator: z
    .enum(["ALL", "DESKTOP", "MOBILE", "TABLET", "MOBILE_AND_TABLET"])
    .optional()
    .describe("Device type (default ALL)"),
  date_from: dateString.optional().describe("Start date YYYY-MM-DD (default: 7 days ago)"),
  date_to: dateString.optional().describe("End date YYYY-MM-DD (default: today)"),
  format: formatParam,
});

/** Renders a {indicators: {KEY: [{date, value}]}} shape as a merged date table. */
function renderSeries(data: unknown): string {
  const indicators = (
    data as { indicators?: Record<string, Array<{ date?: string; value?: number }>> }
  )?.indicators;
  if (!indicators || typeof indicators !== "object") return renderAuto(data);
  const keys = Object.keys(indicators);
  if (keys.length === 0) return renderAuto(data);

  const byDate = new Map<string, Record<string, unknown>>();
  for (const k of keys) {
    const series = indicators[k];
    if (!Array.isArray(series)) continue;
    for (const point of series) {
      const date = formatDate(point.date);
      const row = byDate.get(date) ?? { date };
      row[k] = point.value;
      byDate.set(date, row);
    }
  }
  const rows = [...byDate.values()];
  if (rows.length === 0) return renderAuto(data);

  return mdTable(rows, [
    { key: "date", label: "Date" },
    ...keys.map((k) => ({
      key: k,
      label: indicatorLabel(k),
      format: (v: unknown) => formatNumber(v),
    })),
  ]);
}

export async function handleGetQueryAnalytics(
  params: z.infer<typeof getQueryAnalyticsSchema>,
): Promise<string> {
  const range =
    params.date_from && params.date_to
      ? { date_from: params.date_from, date_to: params.date_to }
      : lastNDays();
  const data = await apiGet(`/hosts/${params.host_id}/search-queries/all/history`, {
    query_indicator: params.query_indicator,
    device_type_indicator: params.device_type_indicator,
    date_from: range.date_from,
    date_to: range.date_to,
  });
  return present(data, params.format, renderSeries);
}

// --- Deprecated alias: get_search_queries -> popular per-query data ---

export const getSearchQueriesSchema = z.object({
  host_id: hostIdParam,
  date_from: dateString.optional().describe("Start date YYYY-MM-DD (default: 7 days ago)"),
  date_to: dateString.optional().describe("End date YYYY-MM-DD (default: today)"),
  format: formatParam,
});

export async function handleGetSearchQueries(
  params: z.infer<typeof getSearchQueriesSchema>,
): Promise<string> {
  return handleGetPopularSearchQueries({
    host_id: params.host_id,
    order_by: "TOTAL_SHOWS",
    date_from: params.date_from,
    date_to: params.date_to,
    limit: 50,
    format: params.format,
  });
}
