import { z } from "zod";
import { y360Request, orgPath } from "../client.js";

export const listDepartmentsSchema = z.object({
  page: z.number().optional().describe("Page number"),
  per_page: z.number().optional().describe("Results per page"),
});

export async function handleListDepartments(params: z.infer<typeof listDepartmentsSchema>): Promise<string> {
  const qp: Record<string, string> = {};
  if (params.page) qp.page = String(params.page);
  if (params.per_page) qp.perPage = String(params.per_page);

  const result = await y360Request("GET", orgPath("departments"), undefined, qp);
  return JSON.stringify(result, null, 2);
}
