import { z } from "zod";
import { apiPost } from "../client.js";
import { formatResult } from "../format.js";
import { apiIds, idField } from "../id.js";
import { buildPage, pageFields } from "../pagination.js";

export const listBusinessesSchema = z.object({
  business_ids: z.array(idField("ID профиля организации")).max(10000).optional(),
  ...pageFields,
});

export async function handleListBusinesses(
  params: z.infer<typeof listBusinessesSchema>,
): Promise<string> {
  const request: Record<string, unknown> = {
    FieldNames: [
      "Id", "Name", "Address", "Phone", "ProfileUrl", "InternalUrl",
      "IsPublished", "MergedIds", "Rubric", "Urls", "HasOffice",
    ],
  };
  if (params.business_ids?.length) request.SelectionCriteria = { Ids: apiIds(params.business_ids) };
  const page = buildPage(params);
  if (page) request.Page = page;
  return formatResult(await apiPost("businesses", "get", request), { money: false });
}
