import { z } from "zod";
import { yandexPost, getFolderId } from "../client.js";

export const embedDocumentsSchema = z.object({
  model: z.string().default("text-search-doc").describe("Модель эмбеддингов (text-search-doc, text-search-query)"),
  texts: z.array(z.string()).describe("Массив текстов для получения эмбеддингов"),
});

export async function handleEmbedDocuments(params: z.infer<typeof embedDocumentsSchema>): Promise<string> {
  const folderId = getFolderId();
  const results = [];
  for (const text of params.texts) {
    const result = await yandexPost("/textEmbedding", {
      modelUri: `emb://${folderId}/${params.model}`,
      text,
    });
    results.push(result);
  }
  return JSON.stringify(results, null, 2);
}
