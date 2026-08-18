import { z } from "zod";
import { apiPost, rublesToMicros } from "../client.js";
import { formatResult } from "../format.js";
import { apiId, apiIds, idField } from "../id.js";
import { buildPage, pageFields } from "../pagination.js";

export const listAudienceTargetsSchema = z.object({
  audience_target_ids: z.array(idField("ID условия нацеливания")).max(10000).optional(),
  ad_group_ids: z.array(idField("ID группы объявлений")).max(1000).optional(),
  campaign_ids: z.array(idField("ID кампании")).max(100).optional(),
  retargeting_list_ids: z.array(idField("ID условия ретаргетинга")).max(1000).optional(),
  interest_ids: z.array(idField("ID интереса")).max(1000).optional(),
  states: z.array(z.enum(["ON", "SUSPENDED"])).optional(),
  ...pageFields,
});

export async function handleListAudienceTargets(
  params: z.infer<typeof listAudienceTargetsSchema>,
): Promise<string> {
  const selection: Record<string, unknown> = {};
  if (params.audience_target_ids?.length) selection.Ids = apiIds(params.audience_target_ids);
  if (params.ad_group_ids?.length) selection.AdGroupIds = apiIds(params.ad_group_ids);
  if (params.campaign_ids?.length) selection.CampaignIds = apiIds(params.campaign_ids);
  if (params.retargeting_list_ids?.length) selection.RetargetingListIds = apiIds(params.retargeting_list_ids);
  if (params.interest_ids?.length) selection.InterestIds = apiIds(params.interest_ids);
  if (params.states?.length) selection.States = params.states;
  if (!Object.keys(selection).some(key => key !== "States")) {
    throw new Error("Укажите хотя бы один фильтр ID для list_audience_targets.");
  }
  const request: Record<string, unknown> = {
    SelectionCriteria: selection,
    FieldNames: [
      "Id", "AdGroupId", "CampaignId", "RetargetingListId",
      "InterestId", "ContextBid", "StrategyPriority", "State",
    ],
  };
  const page = buildPage(params);
  if (page) request.Page = page;
  return formatResult(await apiPost("audiencetargets", "get", request));
}

const priority = z.enum(["LOW", "NORMAL", "HIGH"]);
const audienceTarget = z.object({
  ad_group_id: idField("ID группы объявлений"),
  retargeting_list_id: idField("ID условия ретаргетинга").optional(),
  interest_id: idField("ID интереса").optional(),
  context_bid: z.number().nonnegative().optional().describe("Ставка в рублях"),
  strategy_priority: priority.optional(),
});
const audienceBid = z.object({
  audience_target_id: idField("ID условия нацеливания").optional(),
  ad_group_id: idField("ID группы объявлений").optional(),
  campaign_id: idField("ID кампании").optional(),
  context_bid: z.number().nonnegative().optional().describe("Ставка в рублях"),
  strategy_priority: priority.optional(),
});

export const setAudienceTargetsSchema = z.object({
  action: z.enum(["add", "set_bids", "suspend", "resume", "delete"]),
  targets: z.array(audienceTarget).min(1).max(1000).optional(),
  bids: z.array(audienceBid).min(1).max(10000).optional(),
  audience_target_ids: z.array(idField("ID условия нацеливания")).min(1).max(10000).optional(),
});

export async function handleSetAudienceTargets(
  params: z.infer<typeof setAudienceTargetsSchema>,
): Promise<string> {
  if (params.action === "add") {
    if (!params.targets?.length) throw new Error("Для action=add передайте targets.");
    const targets = params.targets.map(target => {
      if ((target.retargeting_list_id ? 1 : 0) + (target.interest_id ? 1 : 0) !== 1) {
        throw new Error("Каждая цель должна содержать ровно одно из retargeting_list_id/interest_id.");
      }
      const item: Record<string, unknown> = { AdGroupId: apiId(target.ad_group_id) };
      if (target.retargeting_list_id) item.RetargetingListId = apiId(target.retargeting_list_id);
      if (target.interest_id) item.InterestId = apiId(target.interest_id);
      if (target.context_bid !== undefined) item.ContextBid = rublesToMicros(target.context_bid);
      if (target.strategy_priority) item.StrategyPriority = target.strategy_priority;
      return item;
    });
    return formatResult(await apiPost("audiencetargets", "add", { AudienceTargets: targets }));
  }

  if (params.action === "set_bids") {
    if (!params.bids?.length) throw new Error("Для action=set_bids передайте bids.");
    const bids = params.bids.map(bid => {
      const selectors = [bid.audience_target_id, bid.ad_group_id, bid.campaign_id].filter(Boolean);
      if (selectors.length !== 1) {
        throw new Error("Каждая ставка должна содержать ровно один ID цели, группы или кампании.");
      }
      if (bid.context_bid === undefined && bid.strategy_priority === undefined) {
        throw new Error("Для каждой ставки укажите context_bid и/или strategy_priority.");
      }
      const item: Record<string, unknown> = {};
      if (bid.audience_target_id) item.Id = apiId(bid.audience_target_id);
      if (bid.ad_group_id) item.AdGroupId = apiId(bid.ad_group_id);
      if (bid.campaign_id) item.CampaignId = apiId(bid.campaign_id);
      if (bid.context_bid !== undefined) item.ContextBid = rublesToMicros(bid.context_bid);
      if (bid.strategy_priority) item.StrategyPriority = bid.strategy_priority;
      return item;
    });
    return formatResult(await apiPost("audiencetargets", "setBids", { Bids: bids }));
  }

  if (!params.audience_target_ids?.length) {
    throw new Error(`Для action=${params.action} передайте audience_target_ids.`);
  }
  return formatResult(await apiPost("audiencetargets", params.action, {
    SelectionCriteria: { Ids: apiIds(params.audience_target_ids) },
  }));
}
