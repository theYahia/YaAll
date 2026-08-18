import { z } from "zod";
import { apiGet, apiPost } from "../client.js";
import { dateString, formatParam, hostIdParam, lastNDays } from "./common.js";
import { present } from "../format.js";

export const getIndexingSchema = z.object({
  host_id: hostIdParam,
  format: formatParam,
});

export async function handleGetIndexing(
  params: z.infer<typeof getIndexingSchema>,
): Promise<string> {
  const data = await apiGet(`/hosts/${params.host_id}/summary/`);
  return present(data, params.format);
}

export const getIndexingHistorySchema = z.object({
  host_id: hostIdParam,
  date_from: dateString.optional().describe("Start date YYYY-MM-DD (default: 30 days ago)"),
  date_to: dateString.optional().describe("End date YYYY-MM-DD (default: today)"),
  format: formatParam,
});

export async function handleGetIndexingHistory(
  params: z.infer<typeof getIndexingHistorySchema>,
): Promise<string> {
  const range =
    params.date_from && params.date_to
      ? { date_from: params.date_from, date_to: params.date_to }
      : lastNDays(30);
  const data = await apiGet(`/hosts/${params.host_id}/indexing/history`, {
    date_from: range.date_from,
    date_to: range.date_to,
  });
  return present(data, params.format);
}

export const submitUrlSchema = z.object({
  host_id: hostIdParam,
  url: z
    .string()
    .url()
    .refine((u) => /^https?:\/\//i.test(u), "Must be an http(s) URL")
    .describe("URL to submit for re-indexing"),
  format: formatParam,
});

export async function handleSubmitUrl(params: z.infer<typeof submitUrlSchema>): Promise<string> {
  const data = await apiPost(`/hosts/${params.host_id}/recrawl/queue`, {
    url: params.url,
  });
  return present(data, params.format);
}
