import { z } from "zod";
import { yandexPost, getFolderId } from "../client.js";

export const tokenizeSchema = z.object({
  model: z.string().default("yandexgpt-lite").describe("Модель для токенизации"),
  text: z.string().describe("Текст для токенизации"),
});

export async function handleTokenize(params: z.infer<typeof tokenizeSchema>): Promise<string> {
  const folderId = getFolderId();
  const result = await yandexPost("/tokenize", {
    modelUri: `gpt://${folderId}/${params.model}`,
    text: params.text,
  });
  return JSON.stringify(result, null, 2);
}
