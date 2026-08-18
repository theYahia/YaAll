import { z } from "zod";
import { yandexPost, getFolderId } from "../client.js";

const messageSchema = z.object({
  role: z.enum(["system", "user", "assistant"]).describe("Роль автора сообщения"),
  text: z.string().describe("Текст сообщения"),
});

export const completionSchema = z.object({
  model: z.string().default("yandexgpt-lite").describe("Модель (yandexgpt-lite, yandexgpt, yandexgpt-32k)"),
  messages: z.array(messageSchema).describe("Массив сообщений диалога"),
  temperature: z.number().min(0).max(1).optional().describe("Температура генерации (0–1)"),
  maxTokens: z.number().int().positive().default(2000).describe("Максимальное количество токенов"),
});

export async function handleCompletion(params: z.infer<typeof completionSchema>): Promise<string> {
  const folderId = getFolderId();
  const result = await yandexPost("/completion", {
    modelUri: `gpt://${folderId}/${params.model}`,
    completionOptions: {
      stream: false,
      temperature: params.temperature,
      maxTokens: params.maxTokens,
    },
    messages: params.messages,
  });
  return JSON.stringify(result, null, 2);
}
