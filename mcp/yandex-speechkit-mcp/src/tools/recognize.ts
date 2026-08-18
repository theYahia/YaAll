import { z } from "zod";
import { recognizeSpeech } from "../client.js";

export const recognizeSchema = z.object({
  audio_base64: z.string().describe("Audio data encoded as Base64"),
  lang: z.string().default("ru-RU").describe("Recognition language (ru-RU, en-US, tr-TR, kk-KK)"),
  format: z.string().default("oggopus").describe("Audio format (oggopus, lpcm)"),
});

export async function handleRecognize(params: z.infer<typeof recognizeSchema>): Promise<string> {
  const result = await recognizeSpeech(params.audio_base64, params.lang, params.format);
  return JSON.stringify(result, null, 2);
}
