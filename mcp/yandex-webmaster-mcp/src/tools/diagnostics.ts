import { z } from "zod";
import { apiGet } from "../client.js";
import { formatParam, hostIdParam } from "./common.js";
import { present } from "../format.js";

export const getDiagnosticsSchema = z.object({
  host_id: hostIdParam,
  format: formatParam,
});

export async function handleGetDiagnostics(
  params: z.infer<typeof getDiagnosticsSchema>,
): Promise<string> {
  const data = await apiGet(`/hosts/${params.host_id}/diagnostics/`);
  return present(data, params.format);
}
