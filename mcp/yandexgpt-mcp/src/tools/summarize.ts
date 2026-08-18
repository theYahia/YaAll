import { z } from "zod";
import { yandexPost, getFolderId } from "../client.js";

export const summarizeSchema = z.object({
  model: z.string().default("yandexgpt").describe("Модель для суммаризации (yandexgpt, yandexgpt-lite)"),
  text: z.string().describe("Текст для суммаризации"),
  instruction: z.string().default("Summarize the text concisely.").describe("Инструкция для суммаризации"),
});

export async function handleSummarize(params: z.infer<typeof summarizeSchema>): Promise<string> {
  const folderId = getFolderId();
  const result = await yandexPost("/completion", {
    modelUri: `gpt://${folderId}/${params.model}`,
    completionOptions: {
      stream: false,
      temperature: 0.1,
      maxTokens: 2000,
    },
    messages: [
      { role: "system", text: params.instruction },
      { role: "user", text: params.text },
    ],
  });
  return JSON.stringify(result, null, 2);
}
