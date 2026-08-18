import { z } from "zod";
import { apiPost } from "../client.js";
import { formatResult } from "../format.js";
import { apiId, apiIds, idField } from "../id.js";
import { buildPage, pageFields } from "../pagination.js";

const RETARGETING_TYPES = ["RETARGETING", "AUDIENCE"] as const;

export const listRetargetingListsSchema = z.object({
  retargeting_list_ids: z.array(idField("ID условия ретаргетинга")).max(10000).optional(),
  types: z.array(z.enum(RETARGETING_TYPES)).optional(),
  ...pageFields,
});

export async function handleListRetargetingLists(
  params: z.infer<typeof listRetargetingListsSchema>,
): Promise<string> {
  const selection: Record<string, unknown> = {};
  if (params.retargeting_list_ids?.length) selection.Ids = apiIds(params.retargeting_list_ids);
  if (params.types?.length) selection.Types = params.types;
  const request: Record<string, unknown> = {
    FieldNames: [
      "Type", "Id", "Name", "Description", "Rules", "IsAvailable",
      "Scope", "AvailableForTargetsInAdGroupTypes",
    ],
  };
  if (Object.keys(selection).length) request.SelectionCriteria = selection;
  const page = buildPage(params);
  if (page) request.Page = page;
  return formatResult(await apiPost("retargetinglists", "get", request), { money: false });
}

const ruleArgument = z.object({
  external_id: idField("ID цели или сегмента"),
  membership_life_span: z.number().int().min(1).max(540).optional(),
});

const rule = z.object({
  operator: z.enum(["ALL", "ANY", "NONE"]),
  arguments: z.array(ruleArgument).min(1),
});

export const addRetargetingListSchema = z.object({
  name: z.string().min(1).max(250),
  type: z.enum(RETARGETING_TYPES).default("RETARGETING"),
  description: z.string().max(4096).optional(),
  rules: z.array(rule).min(1),
});

export async function handleAddRetargetingList(
  params: z.infer<typeof addRetargetingListSchema>,
): Promise<string> {
  const item: Record<string, unknown> = {
    Name: params.name,
    Type: params.type,
    Rules: params.rules.map(ruleItem => ({
      Operator: ruleItem.operator,
      Arguments: ruleItem.arguments.map(argument => {
        const result: Record<string, unknown> = { ExternalId: apiId(argument.external_id) };
        if (argument.membership_life_span !== undefined) {
          result.MembershipLifeSpan = argument.membership_life_span;
        }
        return result;
      }),
    })),
  };
  if (params.description !== undefined) item.Description = params.description;
  return formatResult(await apiPost("retargetinglists", "add", {
    RetargetingLists: [item],
  }), { money: false });
}
