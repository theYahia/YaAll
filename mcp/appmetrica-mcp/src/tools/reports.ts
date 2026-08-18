import { z } from "zod";
import { apiGet } from "../client.js";

export const getReportSchema = z.object({
  app_id: z.number().describe("ID приложения в AppMetrica"),
  metrics: z.array(z.string()).describe("Метрики: sessions, users, new_users, events, crashes, etc."),
  dimensions: z.array(z.string()).optional().describe("Группировки: date, os, country, city, device, etc."),
  date1: z.string().describe("Дата начала YYYY-MM-DD"),
  date2: z.string().describe("Дата окончания YYYY-MM-DD"),
  filters: z.string().optional().describe("Фильтр в формате AppMetrica API"),
  limit: z.number().optional().describe("Максимум строк (по умолчанию 100)"),
});

export async function handleGetReport(params: z.infer<typeof getReportSchema>): Promise<string> {
  const queryParams: Record<string, string> = {
    id: String(params.app_id),
    metrics: params.metrics.join(","),
    date1: params.date1,
    date2: params.date2,
    limit: String(params.limit ?? 100),
  };
  if (params.dimensions) queryParams.dimensions = params.dimensions.join(",");
  if (params.filters) queryParams.filters = params.filters;

  const data = await apiGet("/stat/v1/data", queryParams);
  return JSON.stringify(data, null, 2);
}

export const getCohortsSchema = z.object({
  app_id: z.number().describe("ID приложения"),
  cohort_type: z.string().default("install_date").describe("Тип когорты: install_date, first_event_date"),
  metrics: z.array(z.string()).describe("Метрики когорт: retention_rate, sessions_per_user, etc."),
  date1: z.string().describe("Дата начала"),
  date2: z.string().describe("Дата окончания"),
});

export async function handleGetCohorts(params: z.infer<typeof getCohortsSchema>): Promise<string> {
  const data = await apiGet("/stat/v1/data", {
    id: String(params.app_id),
    metrics: params.metrics.join(","),
    dimensions: `cohort_${params.cohort_type}`,
    date1: params.date1,
    date2: params.date2,
  });
  return JSON.stringify(data, null, 2);
}
