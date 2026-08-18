import { z } from "zod";
import { trackerRequest } from "../client.js";

export const listQueuesSchema = z.object({});

export async function handleListQueues(_params: z.infer<typeof listQueuesSchema>): Promise<string> {
  const result = await trackerRequest("GET", "queues");
  return JSON.stringify(result, null, 2);
}

export const getQueueSchema = z.object({
  queue_key: z.string().describe("Queue key (e.g. PROJ)"),
});

export async function handleGetQueue(params: z.infer<typeof getQueueSchema>): Promise<string> {
  const result = await trackerRequest("GET", `queues/${params.queue_key}`);
  return JSON.stringify(result, null, 2);
}
