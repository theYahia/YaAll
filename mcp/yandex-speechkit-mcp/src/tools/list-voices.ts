import { z } from "zod";
import { listVoices } from "../client.js";

export const listVoicesSchema = z.object({
  lang: z.string().optional().describe("Filter by language prefix (e.g. ru, en, kk)"),
});

export async function handleListVoices(params: z.infer<typeof listVoicesSchema>): Promise<string> {
  const voices = listVoices(params.lang);
  return JSON.stringify({ count: voices.length, voices }, null, 2);
}
