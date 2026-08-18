import { z } from "zod";
import { yandexClassify, getFolderId } from "../client.js";

export const classifySchema = z.object({
  model: z.string().default("yandexgpt-lite").describe("Модель для классификации"),
  text: z.string().describe("Текст для классификации"),
  labels: z.array(z.string()).describe("Массив меток для zero-shot классификации"),
  instruction: z.string().optional().describe("Дополнительная инструкция для классификатора"),
});

export async function handleClassify(params: z.infer<typeof classifySchema>): Promise<string> {
  const folderId = getFolderId();
  const result = await yandexClassify({
    modelUri: `cls://${folderId}/${params.model}`,
    taskDescription: params.instruction || "Classify the text into one of the given categories.",
    labels: params.labels.map(name => ({ name })),
    text: params.text,
  });
  return JSON.stringify(result, null, 2);
}
