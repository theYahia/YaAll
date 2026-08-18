import { z } from "zod";
import { apiGet } from "../client.js";
import { formatParam, hostIdParam } from "./common.js";
import { present } from "../format.js";

export const getRecrawlQuotaSchema = z.object({
  host_id: hostIdParam,
  format: formatParam,
});

export async function handleGetRecrawlQuota(
  params: z.infer<typeof getRecrawlQuotaSchema>,
): Promise<string> {
  const data = await apiGet(`/hosts/${params.host_id}/recrawl/quota`);
  return present(data, params.format);
}

export const getRecrawlTaskSchema = z.object({
  host_id: hostIdParam,
  task_id: z.string().describe("Task ID returned by submit_url"),
  format: formatParam,
});

export async function handleGetRecrawlTask(
  params: z.infer<typeof getRecrawlTaskSchema>,
): Promise<string> {
  const data = await apiGet(`/hosts/${params.host_id}/recrawl/task/${params.task_id}`);
  return present(data, params.format);
}
