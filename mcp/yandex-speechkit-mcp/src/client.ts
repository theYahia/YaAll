const STT_BASE = "https://stt.api.cloud.yandex.net/speech/v1/stt:recognize";
const TTS_BASE = "https://tts.api.cloud.yandex.net/speech/v1/tts:synthesize";
const TIMEOUT = 60_000;
const MAX_RETRIES = 3;

export interface AuthHeaders {
  Authorization: string;
}

/**
 * Returns auth headers. Supports:
 * - YANDEX_SPEECHKIT_API_KEY  (preferred)
 * - YANDEX_API_KEY            (legacy compat)
 * - IAM_TOKEN                 (short-lived IAM token)
 */
export function getAuthHeaders(): AuthHeaders {
  const apiKey = process.env.YANDEX_SPEECHKIT_API_KEY || process.env.YANDEX_API_KEY;
  if (apiKey) return { Authorization: `Api-Key ${apiKey}` };

  const iamToken = process.env.IAM_TOKEN;
  if (iamToken) return { Authorization: `Bearer ${iamToken}` };

  throw new Error(
    "Auth not configured. Set YANDEX_SPEECHKIT_API_KEY (or YANDEX_API_KEY) or IAM_TOKEN.",
  );
}

export function getFolderId(): string {
  const folderId = process.env.FOLDER_ID || process.env.YANDEX_FOLDER_ID;
  if (!folderId) throw new Error("FOLDER_ID (or YANDEX_FOLDER_ID) not set.");
  return folderId;
}

export async function recognizeSpeech(audioBase64: string, lang: string, format: string): Promise<unknown> {
  const folderId = getFolderId();
  const audioBuffer = Buffer.from(audioBase64, "base64");

  const params = new URLSearchParams({ lang, folderId, format });

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT);

    try {
      const response = await fetch(`${STT_BASE}?${params.toString()}`, {
        method: "POST",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/octet-stream",
        },
        body: audioBuffer,
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (response.ok) return response.json();

      if ((response.status === 429 || response.status >= 500) && attempt < MAX_RETRIES) {
        const delay = Math.min(1000 * 2 ** (attempt - 1), 8000);
        console.error(`[speechkit] ${response.status}, retry in ${delay}ms (${attempt}/${MAX_RETRIES})`);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }

      const text = await response.text().catch(() => "");
      throw new Error(`SpeechKit STT HTTP ${response.status}: ${text || response.statusText}`);
    } catch (error) {
      clearTimeout(timer);
      if (error instanceof DOMException && error.name === "AbortError" && attempt < MAX_RETRIES) {
        console.error(`[speechkit] timeout, retry (${attempt}/${MAX_RETRIES})`);
        continue;
      }
      throw error;
    }
  }
  throw new Error("SpeechKit STT: all retries exhausted");
}

export async function synthesizeSpeech(text: string, lang: string, voice: string, format: string): Promise<string> {
  const folderId = getFolderId();

  const formBody = new URLSearchParams({ text, lang, voice, format, folderId });

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT);

    try {
      const response = await fetch(TTS_BASE, {
        method: "POST",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formBody.toString(),
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer).toString("base64");
      }

      if ((response.status === 429 || response.status >= 500) && attempt < MAX_RETRIES) {
        const delay = Math.min(1000 * 2 ** (attempt - 1), 8000);
        console.error(`[speechkit] ${response.status}, retry in ${delay}ms (${attempt}/${MAX_RETRIES})`);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }

      const errText = await response.text().catch(() => "");
      throw new Error(`SpeechKit TTS HTTP ${response.status}: ${errText || response.statusText}`);
    } catch (error) {
      clearTimeout(timer);
      if (error instanceof DOMException && error.name === "AbortError" && attempt < MAX_RETRIES) {
        console.error(`[speechkit] timeout, retry (${attempt}/${MAX_RETRIES})`);
        continue;
      }
      throw error;
    }
  }
  throw new Error("SpeechKit TTS: all retries exhausted");
}

/** Static voice catalogue — Yandex SpeechKit v1/v3 */
export interface VoiceInfo {
  name: string;
  lang: string;
  gender: "male" | "female";
  emotion?: string[];
}

export const VOICES: VoiceInfo[] = [
  { name: "alena", lang: "ru-RU", gender: "female", emotion: ["neutral", "good"] },
  { name: "filipp", lang: "ru-RU", gender: "male" },
  { name: "ermil", lang: "ru-RU", gender: "male", emotion: ["neutral", "good"] },
  { name: "jane", lang: "ru-RU", gender: "female", emotion: ["neutral", "good", "evil"] },
  { name: "madirus", lang: "ru-RU", gender: "male" },
  { name: "omazh", lang: "ru-RU", gender: "female", emotion: ["neutral", "evil"] },
  { name: "zahar", lang: "ru-RU", gender: "male", emotion: ["neutral", "good"] },
  { name: "dasha", lang: "ru-RU", gender: "female" },
  { name: "julia", lang: "ru-RU", gender: "female" },
  { name: "lera", lang: "ru-RU", gender: "female" },
  { name: "marina", lang: "ru-RU", gender: "female" },
  { name: "alexander", lang: "ru-RU", gender: "male" },
  { name: "kirill", lang: "ru-RU", gender: "male" },
  { name: "anton", lang: "ru-RU", gender: "male" },
  { name: "john", lang: "en-US", gender: "male" },
  { name: "amira", lang: "kk-KK", gender: "female" },
  { name: "madi", lang: "kk-KK", gender: "male" },
  { name: "lea", lang: "de-DE", gender: "female" },
  { name: "nigora", lang: "uz-UZ", gender: "female" },
];

export function listVoices(lang?: string): VoiceInfo[] {
  if (!lang) return VOICES;
  return VOICES.filter(v => v.lang.toLowerCase().startsWith(lang.toLowerCase()));
}
