import { z } from "zod";
import { apiGet, apiPost } from "../client.js";

export const getPushCampaignsSchema = z.object({
  app_id: z.number().describe("ID приложения"),
});

export async function handleGetPushCampaigns(params: z.infer<typeof getPushCampaignsSchema>): Promise<string> {
  const data = await apiGet("/push/v1/management/campaigns", {
    app_id: String(params.app_id),
  });
  return JSON.stringify(data, null, 2);
}

export const sendPushSchema = z.object({
  app_id: z.number().describe("ID приложения"),
  group_id: z.number().describe("ID группы получателей"),
  message: z.string().describe("Текст push-уведомления"),
  title: z.string().optional().describe("Заголовок push-уведомления"),
});

export async function handleSendPush(params: z.infer<typeof sendPushSchema>): Promise<string> {
  const body: Record<string, unknown> = {
    app_id: params.app_id,
    group_id: params.group_id,
    messages: [{
      content: {
        text: params.message,
        ...(params.title ? { title: params.title } : {}),
      },
    }],
  };

  const data = await apiPost("/push/v1/management/send", body);
  return JSON.stringify(data, null, 2);
}
