import { z } from "zod";
import { apiPost } from "../client.js";
import { formatResult } from "../format.js";
import { apiIds, idField } from "../id.js";
import { buildPage, pageFields } from "../pagination.js";

export const listFeedsSchema = z.object({
  feed_ids: z.array(idField("ID фида")).max(10000).optional(),
  ...pageFields,
});

export async function handleListFeeds(params: z.infer<typeof listFeedsSchema>): Promise<string> {
  const request: Record<string, unknown> = {
    FieldNames: [
      "Id", "Name", "BusinessType", "SourceType", "FilterSchema", "UpdatedAt",
      "CampaignIds", "NumberOfItems", "Status", "TitleAndTextSources",
    ],
    FileFeedFieldNames: ["Filename"],
    UrlFeedFieldNames: ["Login", "Url", "RemoveUtmTags"],
  };
  if (params.feed_ids?.length) request.SelectionCriteria = { Ids: apiIds(params.feed_ids) };
  const page = buildPage(params);
  if (page) request.Page = page;
  return formatResult(await apiPost("feeds", "get", request), { money: false });
}
