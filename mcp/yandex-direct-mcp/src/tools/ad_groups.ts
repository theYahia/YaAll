import { z } from "zod";
import { apiPost } from "../client.js";
import { formatResult } from "../format.js";
import { pageFields, buildPage } from "../pagination.js";

export const listAdGroupsSchema = z.object({
  campaign_ids: z.array(z.number()).describe("ID кампаний для выборки групп"),
  ...pageFields,
});

export async function handleListAdGroups(params: z.infer<typeof listAdGroupsSchema>): Promise<string> {
  const requestParams: Record<string, unknown> = {
    SelectionCriteria: { CampaignIds: params.campaign_ids },
    FieldNames: ["Id", "Name", "CampaignId", "RegionIds", "Status", "Type"],
  };
  const page = buildPage(params);
  if (page) requestParams.Page = page;

  const data = await apiPost("adgroups", "get", requestParams);
  return formatResult(data);
}

export const createAdGroupSchema = z.object({
  campaign_id: z.number().describe("ID кампании"),
  name: z.string().describe("Название группы объявлений"),
  region_ids: z.array(z.number()).describe("Коды регионов показа (например [225] = Россия). См. get_regions."),
});

export async function handleCreateAdGroup(params: z.infer<typeof createAdGroupSchema>): Promise<string> {
  const data = await apiPost("adgroups", "add", {
    AdGroups: [{
      Name: params.name,
      CampaignId: params.campaign_id,
      RegionIds: params.region_ids,
    }],
  });
  return formatResult(data);
}

export const deleteAdGroupsSchema = z.object({
  ad_group_ids: z.array(z.number()).min(1).describe("ID групп объявлений для удаления"),
});

export async function handleDeleteAdGroups(params: z.infer<typeof deleteAdGroupsSchema>): Promise<string> {
  const data = await apiPost("adgroups", "delete", {
    SelectionCriteria: { Ids: params.ad_group_ids },
  });
  return formatResult(data);
}
