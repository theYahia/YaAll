import { z } from "zod";

/** Shared output-format parameter: compact Markdown by default, raw JSON on request. */
export const formatParam = z
  .enum(["markdown", "json"])
  .default("markdown")
  .describe("Output format: 'markdown' (compact, default) or 'json' (raw API response)");

/** YYYY-MM-DD date string. */
export const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");

export const hostIdParam = z.string().describe("Host ID from get_hosts");

/** Default date range: the last `days` days, formatted YYYY-MM-DD. */
export function lastNDays(days = 7): { date_from: string; date_to: string } {
  const to = new Date();
  const from = new Date(to);
  from.setDate(from.getDate() - days);
  return {
    date_from: from.toISOString().slice(0, 10),
    date_to: to.toISOString().slice(0, 10),
  };
}
