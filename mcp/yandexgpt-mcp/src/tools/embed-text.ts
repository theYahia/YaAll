import { z } from "zod";
import { yandexPost, getFolderId } from "../client.js";

export const embedTextSchema = z.object({
  model: z.string().default("text-search-doc").describe("Модель эмбеддингов (text-search-doc, text-search-query)"),
  text: z.string().describe("Текст для получения эмбеддинга"),
});

export async function handleEmbedText(params: z.infer<typeof embedTextSchema>): Promise<string> {
  const folderId = getFolderId();
  const result = await yandexPost("/textEmbedding", {
    modelUri: `emb://${folderId}/${params.model}`,
    text: params.text,
  });
  return JSON.stringify(result, null, 2);
}
