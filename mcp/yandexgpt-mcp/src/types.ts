export interface CompletionMessage {
  role: "system" | "user" | "assistant";
  text: string;
}

export interface CompletionOptions {
  stream: boolean;
  temperature?: number;
  maxTokens?: number;
}

export interface CompletionRequest {
  modelUri: string;
  completionOptions: CompletionOptions;
  messages: CompletionMessage[];
}

export interface CompletionAlternative {
  message: CompletionMessage;
  status: string;
}

export interface CompletionResult {
  alternatives: CompletionAlternative[];
  usage: { inputTextTokens: string; completionTokens: string; totalTokens: string };
  modelVersion: string;
}

export interface CompletionResponse {
  result: CompletionResult;
}

export interface AsyncCompletionResponse {
  id: string;
  description: string;
  createdAt: string;
  createdBy: string;
  modifiedAt: string;
  done: boolean;
}

export interface TokenizeRequest {
  modelUri: string;
  text: string;
}

export interface TokenizeResponse {
  tokens: Array<{ id: string; text: string }>;
  modelVersion: string;
}

export interface EmbeddingResponse {
  embedding: number[];
  numTokens: string;
  modelVersion: string;
}

export interface ClassificationLabel {
  name: string;
}

export interface ClassificationResult {
  predictions: Array<{ label: string; confidence: number }>;
  modelVersion: string;
}

export interface OperationResponse {
  id: string;
  description: string;
  createdAt: string;
  modifiedAt: string;
  done: boolean;
  response?: unknown;
  error?: { code: number; message: string };
}
