import { z } from "zod";
import { apiPost, rublesToMicros } from "../client.js";
import { formatResult } from "../format.js";
import { apiId, apiIds, idField } from "../id.js";
import { buildPage, pageFields } from "../pagination.js";

export const listDynamicTargetsSchema = z.object({
  dynamic_target_ids: z.array(idField("ID динамической цели")).max(10000).optional(),
  ad_group_ids: z.array(idField("ID группы объявлений")).max(1000).optional(),
  campaign_ids: z.array(idField("ID кампании")).max(100).optional(),
  states: z.array(z.enum(["ON", "SUSPENDED"])).optional(),
  ...pageFields,
});

export async function handleListDynamicTargets(
  params: z.infer<typeof listDynamicTargetsSchema>,
): Promise<string> {
  const selection: Record<string, unknown> = {};
  if (params.dynamic_target_ids?.length) selection.Ids = apiIds(params.dynamic_target_ids);
  if (params.ad_group_ids?.length) selection.AdGroupIds = apiIds(params.ad_group_ids);
  if (params.campaign_ids?.length) selection.CampaignIds = apiIds(params.campaign_ids);
  if (params.states?.length) selection.States = params.states;
  const request: Record<string, unknown> = {
    SelectionCriteria: selection,
    FieldNames: [
      "Id", "AdGroupId", "CampaignId", "Name", "Bid", "ContextBid",
      "StrategyPriority", "State", "StatusClarification", "Conditions", "ConditionType",
    ],
  };
  const page = buildPage(params);
  if (page) request.Page = page;
  return formatResult(await apiPost("dynamictextadtargets", "get", request));
}

const dynamicBid = z.object({
  dynamic_target_id: idField("ID динамической цели").optional(),
  ad_group_id: idField("ID группы объявлений").optional(),
  campaign_id: idField("ID кампании").optional(),
  bid: z.number().nonnegative().optional().describe("Ставка на поиске в рублях"),
  context_bid: z.number().nonnegative().optional().describe("Ставка в сетях в рублях"),
  strategy_priority: z.enum(["LOW", "NORMAL", "HIGH"]).optional(),
});
const dynamicTarget = z.object({
  ad_group_id: idField("ID группы динамических объявлений"),
  name: z.string().min(1),
  conditions: z.array(z.object({
    operand: z.string().min(1),
    operator: z.string().min(1),
    arguments: z.array(z.string().min(1)).min(1),
  })).min(1),
  bid: z.number().nonnegative().optional().describe("Ставка на поиске в рублях"),
  context_bid: z.number().nonnegative().optional().describe("Ставка в сетях в рублях"),
  strategy_priority: z.enum(["LOW", "NORMAL", "HIGH"]).optional(),
});

export const manageDynamicTargetsSchema = z.object({
  action: z.enum(["add", "set_bids", "suspend", "resume", "delete"]),
  targets: z.array(dynamicTarget).min(1).max(1000).optional(),
  bids: z.array(dynamicBid).min(1).max(10000).optional(),
  dynamic_target_ids: z.array(idField("ID динамической цели")).min(1).max(10000).optional(),
});

export async function handleManageDynamicTargets(
  params: z.infer<typeof manageDynamicTargetsSchema>,
): Promise<string> {
  if (params.action === "add") {
    if (!params.targets?.length) throw new Error("Для action=add передайте targets.");
    const targets = params.targets.map(target => {
      const item: Record<string, unknown> = {
        AdGroupId: apiId(target.ad_group_id),
        Name: target.name,
        Conditions: target.conditions.map(condition => ({
          Operand: condition.operand,
          Operator: condition.operator,
          Arguments: condition.arguments,
        })),
      };
      if (target.bid !== undefined) item.Bid = rublesToMicros(target.bid);
      if (target.context_bid !== undefined) item.ContextBid = rublesToMicros(target.context_bid);
      if (target.strategy_priority) item.StrategyPriority = target.strategy_priority;
      return item;
    });
    return formatResult(await apiPost("dynamictextadtargets", "add", { Webpages: targets }));
  }

  if (params.action === "set_bids") {
    if (!params.bids?.length) throw new Error("Для action=set_bids передайте bids.");
    const bids = params.bids.map(bid => {
      const selectors = [bid.dynamic_target_id, bid.ad_group_id, bid.campaign_id].filter(Boolean);
      if (selectors.length !== 1) {
        throw new Error("Каждая ставка должна содержать ровно один ID цели, группы или кампании.");
      }
      if (bid.bid === undefined && bid.context_bid === undefined && bid.strategy_priority === undefined) {
        throw new Error("Для каждой ставки укажите bid, context_bid и/или strategy_priority.");
      }
      const item: Record<string, unknown> = {};
      if (bid.dynamic_target_id) item.Id = apiId(bid.dynamic_target_id);
      if (bid.ad_group_id) item.AdGroupId = apiId(bid.ad_group_id);
      if (bid.campaign_id) item.CampaignId = apiId(bid.campaign_id);
      if (bid.bid !== undefined) item.Bid = rublesToMicros(bid.bid);
      if (bid.context_bid !== undefined) item.ContextBid = rublesToMicros(bid.context_bid);
      if (bid.strategy_priority) item.StrategyPriority = bid.strategy_priority;
      return item;
    });
    return formatResult(await apiPost("dynamictextadtargets", "setBids", { Bids: bids }));
  }

  if (!params.dynamic_target_ids?.length) {
    throw new Error(`Для action=${params.action} передайте dynamic_target_ids.`);
  }
  return formatResult(await apiPost("dynamictextadtargets", params.action, {
    SelectionCriteria: { Ids: apiIds(params.dynamic_target_ids) },
  }));
}
