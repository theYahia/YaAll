import { z } from "zod";
import { apiPost } from "../client.js";
import { formatResult } from "../format.js";
import { pageFields, buildPage } from "../pagination.js";
import { apiId, apiIds, idField } from "../id.js";

export const listAdGroupsSchema = z.object({
  campaign_ids: z.array(idField("ID кампании")).describe("ID кампаний для выборки групп"),
  ...pageFields,
});

export async function handleListAdGroups(params: z.infer<typeof listAdGroupsSchema>): Promise<string> {
  const requestParams: Record<string, unknown> = {
    SelectionCriteria: { CampaignIds: apiIds(params.campaign_ids) },
    FieldNames: ["Id", "Name", "CampaignId", "RegionIds", "Status", "Type"],
  };
  const page = buildPage(params);
  if (page) requestParams.Page = page;

  const data = await apiPost("adgroups", "get", requestParams);
  return formatResult(data);
}

export const createAdGroupSchema = z.object({
  campaign_id: idField("ID кампании"),
  name: z.string().describe("Название группы объявлений"),
  region_ids: z.array(idField("ID региона")).describe("Коды регионов показа (например [\"225\"] = Россия). См. get_regions."),
});

export async function handleCreateAdGroup(params: z.infer<typeof createAdGroupSchema>): Promise<string> {
  const data = await apiPost("adgroups", "add", {
    AdGroups: [{
      Name: params.name,
      CampaignId: apiId(params.campaign_id),
      RegionIds: apiIds(params.region_ids),
    }],
  });
  return formatResult(data);
}

export const deleteAdGroupsSchema = z.object({
  ad_group_ids: z.array(idField("ID группы объявлений")).min(1).describe("ID групп объявлений для удаления"),
});

export async function handleDeleteAdGroups(params: z.infer<typeof deleteAdGroupsSchema>): Promise<string> {
  const data = await apiPost("adgroups", "delete", {
    SelectionCriteria: { Ids: apiIds(params.ad_group_ids) },
  });
  return formatResult(data);
}
