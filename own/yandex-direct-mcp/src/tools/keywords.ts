import { z } from "zod";
import { apiPost } from "../client.js";
import { formatResult } from "../format.js";
import { pageFields, buildPage } from "../pagination.js";

export const listKeywordsSchema = z.object({
  ad_group_ids: z.array(z.number()).describe("ID групп объявлений"),
  ...pageFields,
});

export async function handleListKeywords(params: z.infer<typeof listKeywordsSchema>): Promise<string> {
  const requestParams: Record<string, unknown> = {
    SelectionCriteria: { AdGroupIds: params.ad_group_ids },
    FieldNames: ["Id", "Keyword", "CampaignId", "AdGroupId", "Status", "State", "Bid", "ContextBid"],
  };
  const page = buildPage(params);
  if (page) requestParams.Page = page;

  const data = await apiPost("keywords", "get", requestParams);
  return formatResult(data); // Bid/ContextBid конвертируются в рубли
}

export const addKeywordsSchema = z.object({
  ad_group_id: z.number().describe("ID группы объявлений"),
  keywords: z.array(z.string()).min(1).describe("Массив ключевых фраз"),
});

export async function handleAddKeywords(params: z.infer<typeof addKeywordsSchema>): Promise<string> {
  const data = await apiPost("keywords", "add", {
    Keywords: params.keywords.map(kw => ({
      AdGroupId: params.ad_group_id,
      Keyword: kw,
    })),
  });
  return formatResult(data);
}

const KEYWORD_ACTIONS: Record<string, string> = {
  suspend: "suspend",
  resume: "resume",
  delete: "delete",
};

export const manageKeywordsSchema = z.object({
  keyword_ids: z.array(z.number()).min(1).describe("ID ключевых фраз"),
  action: z.enum(["suspend", "resume", "delete"]).describe("Действие: suspend/resume/delete"),
});

export async function handleManageKeywords(params: z.infer<typeof manageKeywordsSchema>): Promise<string> {
  const method = KEYWORD_ACTIONS[params.action];
  const data = await apiPost("keywords", method, {
    SelectionCriteria: { Ids: params.keyword_ids },
  });
  return formatResult(data);
}
