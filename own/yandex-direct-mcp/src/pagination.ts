import { z } from "zod";

// Общие zod-поля пагинации для list-инструментов (Page: Limit/Offset, макс Limit=10000).
// LimitedBy в ответе (через formatResult) подсказывает offset следующей страницы.
export const pageFields = {
  limit: z.number().int().positive().max(10000).optional().describe("Сколько объектов вернуть (макс 10000)"),
  offset: z.number().int().nonnegative().optional().describe("Смещение выборки для пагинации (= LimitedBy предыдущей страницы)"),
};

export function buildPage(params: { limit?: number; offset?: number }): Record<string, number> | undefined {
  if (params.limit === undefined && params.offset === undefined) return undefined;
  const page: Record<string, number> = {};
  if (params.limit !== undefined) page.Limit = params.limit;
  if (params.offset !== undefined) page.Offset = params.offset;
  return page;
}
