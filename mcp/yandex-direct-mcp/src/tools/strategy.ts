import { z } from "zod";
import { apiPost, rublesToMicros } from "../client.js";
import { formatResult } from "../format.js";
import { apiId, idField } from "../id.js";

export const getStrategySchema = z.object({
  campaign_id: idField("ID текстово-графической кампании"),
});

export async function handleGetStrategy(params: z.infer<typeof getStrategySchema>): Promise<string> {
  return formatResult(await apiPost("campaigns", "get", {
    SelectionCriteria: { Ids: [apiId(params.campaign_id)] },
    FieldNames: ["Id", "Name", "Type"],
    TextCampaignFieldNames: ["BiddingStrategy"],
  }));
}

const searchType = z.enum(["HIGHEST_POSITION", "WB_MAXIMUM_CLICKS", "SERVING_OFF"]);
const networkType = z.enum(["NETWORK_DEFAULT", "WB_MAXIMUM_CLICKS", "SERVING_OFF"]);

export const setStrategySchema = z.object({
  campaign_id: idField("ID текстово-графической кампании"),
  search_type: searchType,
  network_type: networkType,
  weekly_spend_limit: z.number().positive().optional().describe(
    "Недельный бюджет в рублях; обязателен, если выбран WB_MAXIMUM_CLICKS",
  ),
  bid_ceiling: z.number().positive().optional().describe("Максимальная ставка в рублях для WB_MAXIMUM_CLICKS"),
  network_limit_percent: z.number().int().min(1).max(100).optional().describe(
    "Доля расходов в сетях для NETWORK_DEFAULT",
  ),
});

function strategyPart(
  type: z.infer<typeof searchType> | z.infer<typeof networkType>,
  params: z.infer<typeof setStrategySchema>,
): Record<string, unknown> {
  const part: Record<string, unknown> = { BiddingStrategyType: type };
  if (type === "WB_MAXIMUM_CLICKS") {
    if (params.weekly_spend_limit === undefined) {
      throw new Error("weekly_spend_limit обязателен для стратегии WB_MAXIMUM_CLICKS.");
    }
    const settings: Record<string, number> = {
      WeeklySpendLimit: rublesToMicros(params.weekly_spend_limit),
    };
    if (params.bid_ceiling !== undefined) settings.BidCeiling = rublesToMicros(params.bid_ceiling);
    part.WbMaximumClicks = settings;
  } else if (type === "NETWORK_DEFAULT") {
    part.NetworkDefault = params.network_limit_percent === undefined
      ? {}
      : { LimitPercent: params.network_limit_percent };
  }
  return part;
}

export async function handleSetStrategy(params: z.infer<typeof setStrategySchema>): Promise<string> {
  return formatResult(await apiPost("campaigns", "update", {
    Campaigns: [{
      Id: apiId(params.campaign_id),
      TextCampaign: {
        BiddingStrategy: {
          Search: strategyPart(params.search_type, params),
          Network: strategyPart(params.network_type, params),
        },
      },
    }],
  }));
}
