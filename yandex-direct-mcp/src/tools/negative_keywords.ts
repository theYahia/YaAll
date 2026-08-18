import { z } from "zod";
import { apiPost } from "../client.js";
import { formatResult } from "../format.js";

// Минус-фразы задаются через поле NegativeKeywords (ArrayOfString {Items:[...]}) методом update.
// Передача пустого массива очищает минус-фразы.

export const setCampaignNegativeKeywordsSchema = z.object({
  campaign_id: z.number().describe("ID кампании"),
  negative_keywords: z.array(z.string()).describe("Минус-фразы кампании (пустой массив — очистить)"),
});

export async function handleSetCampaignNegativeKeywords(
  params: z.infer<typeof setCampaignNegativeKeywordsSchema>,
): Promise<string> {
  const data = await apiPost("campaigns", "update", {
    Campaigns: [{
      Id: params.campaign_id,
      NegativeKeywords: { Items: params.negative_keywords },
    }],
  });
  return formatResult(data);
}

export const setAdGroupNegativeKeywordsSchema = z.object({
  ad_group_id: z.number().describe("ID группы объявлений"),
  negative_keywords: z.array(z.string()).describe("Минус-фразы группы (пустой массив — очистить)"),
});

export async function handleSetAdGroupNegativeKeywords(
  params: z.infer<typeof setAdGroupNegativeKeywordsSchema>,
): Promise<string> {
  const data = await apiPost("adgroups", "update", {
    AdGroups: [{
      Id: params.ad_group_id,
      NegativeKeywords: { Items: params.negative_keywords },
    }],
  });
  return formatResult(data);
}
