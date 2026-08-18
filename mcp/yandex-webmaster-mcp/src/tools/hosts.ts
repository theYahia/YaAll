import { z } from "zod";
import { apiGet } from "../client.js";
import { formatParam } from "./common.js";
import { mdTable, present, renderAuto } from "../format.js";
import type { WebmasterHostsResponse } from "../types.js";

export const getHostsSchema = z.object({
  format: formatParam,
});

function renderHosts(data: unknown): string {
  const hosts = (data as WebmasterHostsResponse)?.hosts;
  if (!Array.isArray(hosts)) return renderAuto(data);
  if (hosts.length === 0) return "_(no hosts in this account)_";
  return mdTable(hosts, [
    { key: "host_id", label: "Host ID" },
    {
      key: "unicode_host_url",
      label: "URL",
      format: (_v, r) => String(r.unicode_host_url ?? r.ascii_host_url ?? ""),
    },
    { key: "verified", label: "Verified", format: (v) => (v ? "✓" : "✗") },
  ]);
}

export async function handleGetHosts(params: z.infer<typeof getHostsSchema>): Promise<string> {
  const data = await apiGet(`/hosts/`);
  return present(data, params.format, renderHosts);
}
