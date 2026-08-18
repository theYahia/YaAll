import { z } from "zod";

const DECIMAL_ID = /^[1-9]\d*$/;

export function idField(description: string) {
  return z.string().regex(DECIMAL_ID, "ID должен быть положительным целым числом в виде строки").describe(description);
}

export function apiId(id: string): bigint {
  return BigInt(id);
}

export function apiIds(ids: string[]): bigint[] {
  return ids.map(apiId);
}
