import { z } from "zod";
import { apiPost } from "../client.js";
import { formatResult } from "../format.js";
import { apiIds, idField } from "../id.js";
import { buildPage, pageFields } from "../pagination.js";

export const listAdExtensionsSchema = z.object({
  ad_extension_ids: z.array(idField("ID уточнения")).max(10000).optional(),
  states: z.array(z.enum(["ON", "DELETED"])).optional(),
  statuses: z.array(z.enum(["ACCEPTED", "DRAFT", "MODERATION", "REJECTED"])).optional(),
  ...pageFields,
});

export async function handleListAdExtensions(params: z.infer<typeof listAdExtensionsSchema>): Promise<string> {
  const selection: Record<string, unknown> = { Types: ["CALLOUT"] };
  if (params.ad_extension_ids?.length) selection.Ids = apiIds(params.ad_extension_ids);
  if (params.states?.length) selection.States = params.states;
  if (params.statuses?.length) selection.Statuses = params.statuses;

  const request: Record<string, unknown> = {
    SelectionCriteria: selection,
    FieldNames: ["Id", "Type", "Status", "StatusClarification", "Associated"],
    CalloutFieldNames: ["CalloutText"],
  };
  const page = buildPage(params);
  if (page) request.Page = page;
  return formatResult(await apiPost("adextensions", "get", request), { money: false });
}

export const addAdExtensionsSchema = z.object({
  callouts: z.array(z.string().min(1).max(25)).min(1).max(1000)
    .describe("Тексты уточнений, каждый до 25 символов"),
});

export async function handleAddAdExtensions(
  params: z.infer<typeof addAdExtensionsSchema>,
): Promise<string> {
  return formatResult(await apiPost("adextensions", "add", {
    AdExtensions: params.callouts.map(CalloutText => ({ Callout: { CalloutText } })),
  }), { money: false });
}

export const deleteAdExtensionsSchema = z.object({
  ad_extension_ids: z.array(idField("ID уточнения")).min(1).max(1000),
});

export async function handleDeleteAdExtensions(
  params: z.infer<typeof deleteAdExtensionsSchema>,
): Promise<string> {
  return formatResult(await apiPost("adextensions", "delete", {
    SelectionCriteria: { Ids: apiIds(params.ad_extension_ids) },
  }), { money: false });
}
