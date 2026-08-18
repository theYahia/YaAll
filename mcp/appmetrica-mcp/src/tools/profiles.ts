import { z } from "zod";
import { apiGet } from "../client.js";

export const getProfilesSchema = z.object({
  app_id: z.number().describe("ID приложения"),
  filters: z.string().optional().describe("Фильтр профилей (например, по стране или ОС)"),
  limit: z.number().optional().describe("Максимум профилей (по умолчанию 50)"),
});

export async function handleGetProfiles(params: z.infer<typeof getProfilesSchema>): Promise<string> {
  const queryParams: Record<string, string> = {
    id: String(params.app_id),
    limit: String(params.limit ?? 50),
  };
  if (params.filters) queryParams.filters = params.filters;

  const data = await apiGet("/management/v1/profiles", queryParams);
  return JSON.stringify(data, null, 2);
}
