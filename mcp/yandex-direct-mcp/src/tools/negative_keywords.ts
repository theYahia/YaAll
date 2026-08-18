import { z } from "zod";
import { apiPost } from "../client.js";
import { formatResult } from "../format.js";
import { apiId, idField } from "../id.js";

// Минус-фразы задаются через поле NegativeKeywords (ArrayOfString {Items:[...]}) методом update.
// Передача пустого массива очищает минус-фразы.

export const setCampaignNegativeKeywordsSchema = z.object({
  campaign_id: idField("ID кампании"),
  negative_keywords: z.array(z.string()).describe("Минус-фразы кампании (пустой массив — очистить)"),
});

export async function handleSetCampaignNegativeKeywords(
  params: z.infer<typeof setCampaignNegativeKeywordsSchema>,
): Promise<string> {
  const data = await apiPost("campaigns", "update", {
    Campaigns: [{
      Id: apiId(params.campaign_id),
      NegativeKeywords: { Items: params.negative_keywords },
    }],
  });
  return formatResult(data);
}

export const getCampaignNegativeKeywordsSchema = z.object({
  campaign_ids: z.array(idField("ID кампании")).min(1).max(1000).describe("ID кампаний"),
});

export async function handleGetCampaignNegativeKeywords(
  params: z.infer<typeof getCampaignNegativeKeywordsSchema>,
): Promise<string> {
  const data = await apiPost("campaigns", "get", {
    SelectionCriteria: { Ids: params.campaign_ids.map(apiId) },
    FieldNames: ["Id", "Name", "NegativeKeywords"],
  });
  return formatResult(data, { money: false });
}

export const setAdGroupNegativeKeywordsSchema = z.object({
  ad_group_id: idField("ID группы объявлений"),
  negative_keywords: z.array(z.string()).describe("Минус-фразы группы (пустой массив — очистить)"),
});

export async function handleSetAdGroupNegativeKeywords(
  params: z.infer<typeof setAdGroupNegativeKeywordsSchema>,
): Promise<string> {
  const data = await apiPost("adgroups", "update", {
    AdGroups: [{
      Id: apiId(params.ad_group_id),
      NegativeKeywords: { Items: params.negative_keywords },
    }],
  });
  return formatResult(data);
}
