export interface RecognizeResponse {
  result: string;
}

export interface SynthesizeParams {
  text: string;
  lang: string;
  voice: string;
  format: string;
  folderId: string;
}

export interface VoiceInfo {
  name: string;
  lang: string;
  gender: "male" | "female";
  emotion?: string[];
}

export interface HealthResponse {
  status: "ok" | "error";
  tools: number;
}
