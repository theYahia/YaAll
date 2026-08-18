import { z } from "zod";
import { synthesizeSpeech } from "../client.js";

export const synthesizeSchema = z.object({
  text: z.string().describe("Text to synthesize (max 5000 chars)"),
  lang: z.string().default("ru-RU").describe("Synthesis language (ru-RU, en-US, tr-TR, kk-KK)"),
  voice: z.string().default("filipp").describe("Voice name (filipp, alena, jane, dasha, john, etc.)"),
  format: z.string().default("oggopus").describe("Audio format (oggopus, lpcm, mp3)"),
  emotion: z.string().optional().describe("Emotion (neutral, good, evil) — only for voices that support it"),
  speed: z.number().min(0.1).max(3.0).default(1.0).describe("Speech speed multiplier (0.1–3.0)"),
});

export async function handleSynthesize(params: z.infer<typeof synthesizeSchema>): Promise<string> {
  const audioBase64 = await synthesizeSpeech(params.text, params.lang, params.voice, params.format);
  return JSON.stringify({
    audio_base64: audioBase64,
    format: params.format,
    voice: params.voice,
    lang: params.lang,
  }, null, 2);
}
