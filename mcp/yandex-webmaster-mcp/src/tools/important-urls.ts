import { z } from "zod";
import { apiGet } from "../client.js";
import { formatParam, hostIdParam } from "./common.js";
import { present } from "../format.js";

export const getImportantUrlsSchema = z.object({
  host_id: hostIdParam,
  format: formatParam,
});

export async function handleGetImportantUrls(
  params: z.infer<typeof getImportantUrlsSchema>,
): Promise<string> {
  const data = await apiGet(`/hosts/${params.host_id}/important-urls/`);
  return present(data, params.format);
}
