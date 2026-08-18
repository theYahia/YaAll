import { z } from "zod";
import { apiPost, rublesToMicros } from "../client.js";
import { formatResult } from "../format.js";
import { apiId, idField } from "../id.js";

// Установка фиксированных ставок через сервис Bids (метод set). Деньги — в рублях,
// конвертируются в микроединицы. Цель — ровно один уровень: фразы / группы / кампании.
export const setKeywordBidsSchema = z.object({
  keyword_ids: z.array(idField("ID ключевой фразы")).optional().describe("ID ключевых фраз (ставки на уровне фраз)"),
  ad_group_ids: z.array(idField("ID группы объявлений")).optional().describe("ID групп (ставки на все фразы групп)"),
  campaign_ids: z.array(idField("ID кампании")).optional().describe("ID кампаний (ставки на все фразы кампаний)"),
  bid: z.number().positive().optional().describe("Ставка на поиске в рублях"),
  context_bid: z.number().positive().optional().describe("Ставка в сетях (РСЯ) в рублях"),
});

export async function handleSetKeywordBids(params: z.infer<typeof setKeywordBidsSchema>): Promise<string> {
  const targets: Array<[string, string[]]> = [];
  if (params.keyword_ids?.length) targets.push(["KeywordId", params.keyword_ids]);
  if (params.ad_group_ids?.length) targets.push(["AdGroupId", params.ad_group_ids]);
  if (params.campaign_ids?.length) targets.push(["CampaignId", params.campaign_ids]);

  if (targets.length !== 1) {
    throw new Error("Укажите ровно один уровень целей: keyword_ids ИЛИ ad_group_ids ИЛИ campaign_ids.");
  }
  if (params.bid === undefined && params.context_bid === undefined) {
    throw new Error("Укажите bid и/или context_bid (в рублях).");
  }

  const [field, ids] = targets[0];
  const base: Record<string, number> = {};
  if (params.bid !== undefined) base.Bid = rublesToMicros(params.bid);
  if (params.context_bid !== undefined) base.ContextBid = rublesToMicros(params.context_bid);

  const Bids = ids.map((id) => ({ [field]: apiId(id), ...base }));
  const data = await apiPost("bids", "set", { Bids });
  return formatResult(data); // ставки в ответе (если есть) тоже отдаём в рублях
}
