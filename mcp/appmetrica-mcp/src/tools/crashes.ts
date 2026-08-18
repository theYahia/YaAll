import { z } from "zod";
import { apiGet } from "../client.js";

export const getCrashReportSchema = z.object({
  app_id: z.number().describe("ID приложения"),
  date1: z.string().describe("Дата начала YYYY-MM-DD"),
  date2: z.string().describe("Дата окончания YYYY-MM-DD"),
  limit: z.number().optional().describe("Максимум строк (по умолчанию 100)"),
});

export async function handleGetCrashReport(params: z.infer<typeof getCrashReportSchema>): Promise<string> {
  const data = await apiGet("/stat/v1/data", {
    id: String(params.app_id),
    metrics: "crashes,crash_free_users_percentage",
    dimensions: "crash_group",
    date1: params.date1,
    date2: params.date2,
    limit: String(params.limit ?? 100),
  });
  return JSON.stringify(data, null, 2);
}
