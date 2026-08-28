import { z } from "zod";
import { apiPost } from "../client.js";
import { formatResult } from "../format.js";
import { apiId, apiIds, idField } from "../id.js";
import { buildPage, pageFields } from "../pagination.js";

const adjustmentType = z.enum([
  "MOBILE_ADJUSTMENT",
  "TABLET_ADJUSTMENT",
  "DESKTOP_ADJUSTMENT",
  "DESKTOP_ONLY_ADJUSTMENT",
  "DEMOGRAPHICS_ADJUSTMENT",
]);

export const getBidAdjustmentsSchema = z.object({
  campaign_ids: z.array(idField("ID кампании")).min(1).max(10).optional(),
  ad_group_ids: z.array(idField("ID группы объявлений")).min(1).max(1000).optional(),
  adjustment_ids: z.array(idField("ID корректировки")).min(1).max(10000).optional(),
  types: z.array(adjustmentType).optional(),
  levels: z.array(z.enum(["CAMPAIGN", "AD_GROUP"])).min(1)
    .describe("Уровни корректировок: CAMPAIGN и/или AD_GROUP"),
  ...pageFields,
});

export async function handleGetBidAdjustments(params: z.infer<typeof getBidAdjustmentsSchema>): Promise<string> {
  const selection: Record<string, unknown> = { Levels: params.levels };
  if (params.campaign_ids) selection.CampaignIds = apiIds(params.campaign_ids);
  if (params.ad_group_ids) selection.AdGroupIds = apiIds(params.ad_group_ids);
  if (params.adjustment_ids) selection.Ids = apiIds(params.adjustment_ids);
  if (!params.campaign_ids && !params.ad_group_ids && !params.adjustment_ids) {
    throw new Error("Укажите campaign_ids, ad_group_ids или adjustment_ids.");
  }
  if (params.types) selection.Types = params.types;

  const request: Record<string, unknown> = {
    SelectionCriteria: selection,
    FieldNames: ["Id", "CampaignId", "AdGroupId", "Level", "Type"],
    MobileAdjustmentFieldNames: ["BidModifier", "OperatingSystemType"],
    TabletAdjustmentFieldNames: ["BidModifier", "OperatingSystemType"],
    DesktopAdjustmentFieldNames: ["BidModifier"],
    DesktopOnlyAdjustmentFieldNames: ["BidModifier"],
    DemographicsAdjustmentFieldNames: ["Gender", "Age", "BidModifier", "Enabled"],
  };
  const page = buildPage(params);
  if (page) request.Page = page;
  return formatResult(await apiPost("bidmodifiers", "get", request), { money: false });
}

const bidAdjustmentSchema = z.object({
  adjustment_id: idField("ID существующей корректировки"),
  bid_modifier: z.number().int().min(0).max(1300).describe("Коэффициент в процентах, 0–1300"),
});

export const setBidAdjustmentsSchema = z.object({
  adjustments: z.array(bidAdjustmentSchema).min(1).max(1000),
});

export async function handleSetBidAdjustments(params: z.infer<typeof setBidAdjustmentsSchema>): Promise<string> {
  return formatResult(await apiPost("bidmodifiers", "set", {
    BidModifiers: params.adjustments.map((item) => ({
      Id: apiId(item.adjustment_id),
      BidModifier: item.bid_modifier,
    })),
  }), { money: false });
}
