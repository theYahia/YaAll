import { z } from "zod";
import { apiGet } from "../client.js";

export const getDeeplinksSchema = z.object({
  app_id: z.number().describe("ID приложения"),
});

export async function handleGetDeeplinks(params: z.infer<typeof getDeeplinksSchema>): Promise<string> {
  const data = await apiGet("/management/v1/deeplinks", {
    id: String(params.app_id),
  });
  return JSON.stringify(data, null, 2);
}
