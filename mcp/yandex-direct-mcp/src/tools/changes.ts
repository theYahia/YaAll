import { z } from "zod";
import { apiPost } from "../client.js";
import { formatResult } from "../format.js";
import { apiIds, idField } from "../id.js";

const timestamp = z.string()
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/, "Ожидается YYYY-MM-DDThh:mm:ssZ")
  .refine(value => !Number.isNaN(Date.parse(value)), "Некорректная дата")
  .describe("Момент времени ISO 8601, например 2026-07-23T00:00:00Z");

export const getChangesSchema = z.object({
  mode: z.enum(["campaigns", "objects"]),
  timestamp,
  campaign_ids: z.array(idField("ID кампании")).min(1).max(3000).optional(),
  ad_group_ids: z.array(idField("ID группы объявлений")).min(1).max(10000).optional(),
  ad_ids: z.array(idField("ID объявления")).min(1).max(50000).optional(),
  field_names: z.array(z.enum(["CampaignIds", "AdGroupIds", "AdIds", "CampaignsStat"]))
    .min(1).optional(),
});

export async function handleGetChanges(params: z.infer<typeof getChangesSchema>): Promise<string> {
  if (params.mode === "campaigns") {
    return formatResult(await apiPost("changes", "checkCampaigns", {
      Timestamp: params.timestamp,
    }), { money: false });
  }

  const selectors = [
    params.campaign_ids?.length ? "CampaignIds" : undefined,
    params.ad_group_ids?.length ? "AdGroupIds" : undefined,
    params.ad_ids?.length ? "AdIds" : undefined,
  ].filter((value): value is string => value !== undefined);
  if (selectors.length !== 1) {
    throw new Error("Для mode=objects передайте ровно один из campaign_ids/ad_group_ids/ad_ids.");
  }
  const request: Record<string, unknown> = {
    Timestamp: params.timestamp,
    FieldNames: params.field_names ?? selectors,
  };
  if (params.campaign_ids?.length) request.CampaignIds = apiIds(params.campaign_ids);
  if (params.ad_group_ids?.length) request.AdGroupIds = apiIds(params.ad_group_ids);
  if (params.ad_ids?.length) request.AdIds = apiIds(params.ad_ids);
  return formatResult(await apiPost("changes", "check", request), { money: false });
}
