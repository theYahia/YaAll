import { z } from "zod";
import { yandexGetOperation } from "../client.js";

export const getOperationSchema = z.object({
  operation_id: z.string().describe("ID операции, полученный из async_completion"),
});

export async function handleGetOperation(params: z.infer<typeof getOperationSchema>): Promise<string> {
  const result = await yandexGetOperation(params.operation_id);
  return JSON.stringify(result, null, 2);
}
