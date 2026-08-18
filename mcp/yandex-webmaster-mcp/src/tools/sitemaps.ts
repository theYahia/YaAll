import { z } from "zod";
import { apiGet } from "../client.js";
import { formatParam, hostIdParam } from "./common.js";
import { present } from "../format.js";

export const getSitemapsSchema = z.object({
  host_id: hostIdParam,
  format: formatParam,
});

export async function handleGetSitemaps(
  params: z.infer<typeof getSitemapsSchema>,
): Promise<string> {
  const data = await apiGet(`/hosts/${params.host_id}/sitemaps/`);
  return present(data, params.format);
}
