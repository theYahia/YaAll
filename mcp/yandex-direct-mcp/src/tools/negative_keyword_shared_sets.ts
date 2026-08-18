import { z } from "zod";
import { apiPost } from "../client.js";
import { formatResult } from "../format.js";
import { apiId, apiIds, idField } from "../id.js";
import { buildPage, pageFields } from "../pagination.js";

export const listNegativeKeywordSharedSetsSchema = z.object({
  set_ids: z.array(idField("ID общего набора минус-фраз")).max(30).optional(),
  ...pageFields,
});

export async function handleListNegativeKeywordSharedSets(
  params: z.infer<typeof listNegativeKeywordSharedSetsSchema>,
): Promise<string> {
  const request: Record<string, unknown> = {
    FieldNames: ["Id", "Name", "NegativeKeywords", "Associated"],
  };
  if (params.set_ids?.length) request.SelectionCriteria = { Ids: apiIds(params.set_ids) };
  const page = buildPage(params);
  if (page) request.Page = page;
  return formatResult(await apiPost("negativekeywordsharedsets", "get", request), { money: false });
}

const addSet = z.object({
  name: z.string().min(1).max(255),
  negative_keywords: z.array(z.string().min(1)).min(1),
});
const updateSet = z.object({
  set_id: idField("ID общего набора минус-фраз"),
  name: z.string().min(1).max(255).optional(),
  negative_keywords: z.array(z.string().min(1)).optional(),
});

export const manageNegativeKeywordSharedSetsSchema = z.object({
  action: z.enum(["add", "update", "delete"]),
  add_sets: z.array(addSet).min(1).max(30).optional(),
  update_sets: z.array(updateSet).min(1).max(30).optional(),
  set_ids: z.array(idField("ID общего набора минус-фраз")).min(1).max(30).optional(),
});

export async function handleManageNegativeKeywordSharedSets(
  params: z.infer<typeof manageNegativeKeywordSharedSetsSchema>,
): Promise<string> {
  if (params.action === "add") {
    if (!params.add_sets?.length) throw new Error("Для action=add передайте add_sets.");
    return formatResult(await apiPost("negativekeywordsharedsets", "add", {
      NegativeKeywordSharedSets: params.add_sets.map(set => ({
        Name: set.name,
        NegativeKeywords: set.negative_keywords,
      })),
    }), { money: false });
  }

  if (params.action === "update") {
    if (!params.update_sets?.length) throw new Error("Для action=update передайте update_sets.");
    const sets = params.update_sets.map(set => {
      if (set.name === undefined && set.negative_keywords === undefined) {
        throw new Error("Для каждого update_sets укажите name и/или negative_keywords.");
      }
      const item: Record<string, unknown> = { Id: apiId(set.set_id) };
      if (set.name !== undefined) item.Name = set.name;
      if (set.negative_keywords !== undefined) item.NegativeKeywords = set.negative_keywords;
      return item;
    });
    return formatResult(await apiPost("negativekeywordsharedsets", "update", {
      NegativeKeywordSharedSets: sets,
    }), { money: false });
  }

  if (!params.set_ids?.length) throw new Error("Для action=delete передайте set_ids.");
  return formatResult(await apiPost("negativekeywordsharedsets", "delete", {
    SelectionCriteria: { Ids: apiIds(params.set_ids) },
  }), { money: false });
}

export const linkNegativeKeywordSetsSchema = z.object({
  ad_group_ids: z.array(idField("ID группы объявлений")).min(1).max(1000),
  set_ids: z.array(idField("ID общего набора минус-фраз")).max(3)
    .describe("ID общих наборов; пустой массив удаляет привязки"),
});

export async function handleLinkNegativeKeywordSets(
  params: z.infer<typeof linkNegativeKeywordSetsSchema>,
): Promise<string> {
  const sharedSets = { Items: apiIds(params.set_ids) };
  return formatResult(await apiPost("adgroups", "update", {
    AdGroups: params.ad_group_ids.map(adGroupId => ({
      Id: apiId(adGroupId),
      NegativeKeywordSharedSetIds: sharedSets,
    })),
  }), { money: false });
}
