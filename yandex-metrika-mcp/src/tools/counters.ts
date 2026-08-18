import { z } from "zod";
import { apiGet, apiPost, apiPut, apiDelete } from "../client.js";

// --- list_counters ---
export const listCountersSchema = z.object({
  search_string: z.string().optional().describe("Filter counters by name or site URL substring"),
  field: z.string().optional().describe("Fields to return, comma-separated (e.g. 'name,site,status')"),
  per_page: z.number().optional().describe("Results per page (default 100, max 10000)"),
});

export async function handleListCounters(params: z.infer<typeof listCountersSchema>): Promise<string> {
  const query: Record<string, string> = {};
  if (params.search_string) query.search_string = params.search_string;
  if (params.field) query.field = params.field;
  if (params.per_page) query.per_page = String(params.per_page);

  const data = await apiGet("/management/v1/counters", query);
  return JSON.stringify(data, null, 2);
}

// --- get_counter ---
export const getCounterSchema = z.object({
  counter_id: z.number().describe("Counter ID to retrieve details for"),
});

export async function handleGetCounter(params: z.infer<typeof getCounterSchema>): Promise<string> {
  const data = await apiGet(`/management/v1/counter/${params.counter_id}`);
  return JSON.stringify(data, null, 2);
}

// --- create_counter ---
export const createCounterSchema = z.object({
  name: z.string().describe("Counter display name"),
  site: z.string().describe("Website domain (e.g. 'example.com')"),
  mirrors: z.array(z.string()).optional().describe("Mirror domains to track alongside the main site"),
});

export async function handleCreateCounter(params: z.infer<typeof createCounterSchema>): Promise<string> {
  const body: Record<string, unknown> = {
    name: params.name,
    site: params.site,
  };
  if (params.mirrors?.length) {
    body.mirrors2 = params.mirrors.map(m => ({ site: m }));
  }
  const data = await apiPost("/management/v1/counters", { counter: body });
  return JSON.stringify(data, null, 2);
}

// --- update_counter ---
export const updateCounterSchema = z.object({
  counter_id: z.number().describe("Counter ID to update"),
  name: z.string().optional().describe("New counter display name"),
  site: z.string().optional().describe("New website domain"),
});

export async function handleUpdateCounter(params: z.infer<typeof updateCounterSchema>): Promise<string> {
  const body: Record<string, unknown> = {};
  if (params.name) body.name = params.name;
  if (params.site) body.site = params.site;

  const data = await apiPut(`/management/v1/counter/${params.counter_id}`, { counter: body });
  return JSON.stringify(data, null, 2);
}

// --- delete_counter ---
export const deleteCounterSchema = z.object({
  counter_id: z.number().describe("Counter ID to delete. This action is irreversible."),
});

export async function handleDeleteCounter(params: z.infer<typeof deleteCounterSchema>): Promise<string> {
  const data = await apiDelete(`/management/v1/counter/${params.counter_id}`);
  return JSON.stringify(data, null, 2);
}
