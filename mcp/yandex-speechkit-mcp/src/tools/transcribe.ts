import { z } from "zod";
import { recognizeSpeech } from "../client.js";

/**
 * skill-transcribe: High-level transcription skill.
 * Accepts audio_base64, auto-detects format, returns clean text.
 */
export const transcribeSchema = z.object({
  audio_base64: z.string().describe("Audio data encoded as Base64"),
  lang: z.string().default("ru-RU").describe("Language (ru-RU, en-US, kk-KK)"),
  format: z.string().default("oggopus").describe("Audio format (oggopus, lpcm)"),
  return_raw: z.boolean().default(false).describe("Return raw API response instead of plain text"),
});

export async function handleTranscribe(params: z.infer<typeof transcribeSchema>): Promise<string> {
  const result = await recognizeSpeech(params.audio_base64, params.lang, params.format) as { result?: string };

  if (params.return_raw) return JSON.stringify(result, null, 2);

  return result?.result ?? "(no speech detected)";
}
