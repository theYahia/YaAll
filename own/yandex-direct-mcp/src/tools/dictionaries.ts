import { z } from "zod";
import { apiPost } from "../client.js";

interface GeoRegion {
  GeoRegionId: number;
  GeoRegionName: string;
  GeoRegionType?: string;
  ParentId?: number | null;
}

// Справочник GeoRegions большой (тысячи записей) и стабильный — кешируем на время процесса.
let regionsCache: GeoRegion[] | null = null;

async function loadRegions(): Promise<GeoRegion[]> {
  if (regionsCache) return regionsCache;
  const data = await apiPost("dictionaries", "get", { DictionaryNames: ["GeoRegions"] }) as {
    result?: { GeoRegions?: GeoRegion[] };
  };
  regionsCache = data?.result?.GeoRegions ?? [];
  return regionsCache;
}

export const getRegionsSchema = z.object({
  search: z.string().optional().describe("Фильтр по названию региона (подстрока, регистронезависимо). Напр. 'москва'"),
  limit: z.number().int().positive().max(500).default(50).describe("Макс число регионов в ответе"),
});

export async function handleGetRegions(params: z.infer<typeof getRegionsSchema>): Promise<string> {
  let regions = await loadRegions();
  if (params.search) {
    const q = params.search.toLowerCase();
    regions = regions.filter((r) => String(r.GeoRegionName ?? "").toLowerCase().includes(q));
  }
  const limit = params.limit ?? 50;
  const limited = regions.slice(0, limit);
  const note = regions.length > limited.length
    ? `ℹ️ Показано ${limited.length} из ${regions.length}. Уточните search или увеличьте limit.\n\n`
    : "";
  return note + JSON.stringify(limited, null, 2);
}
