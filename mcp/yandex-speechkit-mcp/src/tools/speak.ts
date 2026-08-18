import { z } from "zod";
import { synthesizeSpeech, listVoices } from "../client.js";

/**
 * skill-synthesize (speak): High-level speech synthesis skill.
 * Smart defaults, voice validation, returns audio_base64.
 */
export const speakSchema = z.object({
  text: z.string().describe("Text to speak (max 5000 chars)"),
  voice: z.string().default("filipp").describe("Voice name"),
  lang: z.string().optional().describe("Language — auto-detected from voice if omitted"),
  format: z.string().default("mp3").describe("Output format (mp3, oggopus, lpcm)"),
});

export async function handleSpeak(params: z.infer<typeof speakSchema>): Promise<string> {
  // Auto-detect lang from voice
  let lang = params.lang;
  if (!lang) {
    const allVoices = listVoices();
    const match = allVoices.find(v => v.name === params.voice);
    lang = match?.lang ?? "ru-RU";
  }

  const audioBase64 = await synthesizeSpeech(params.text, lang, params.voice, params.format);

  return JSON.stringify({
    audio_base64: audioBase64,
    format: params.format,
    voice: params.voice,
    lang,
    text_length: params.text.length,
  }, null, 2);
}
