import "server-only";

export const aiCapabilities = [
  "text_chat",
  "speech_to_text",
  "text_to_speech",
  "pronunciation_analysis",
  "content_generation",
] as const;

export type AiCapability = (typeof aiCapabilities)[number];
export type ProviderId = string;
export type ProviderModelId = string;

export type ProviderContext = {
  providerId: ProviderId;
  modelId: ProviderModelId;
  /** Opaque server-side lookup only. It never contains or exposes a secret. */
  credentialId: string;
  requestId: string;
};

export type ProviderHealth = {
  ok: boolean;
  checkedAt: Date;
  latencyMs?: number;
  errorCode?: string;
  safeMessage?: string;
};

export type ProviderModel = {
  id: ProviderModelId;
  displayName: string;
  capabilities: readonly AiCapability[];
  metadata?: Readonly<Record<string, unknown>>;
};

export interface AiProviderAdapter {
  readonly key: string;
  readonly displayName: string;
  readonly capabilities: readonly AiCapability[];
  testConnection(context: Omit<ProviderContext, "modelId" | "requestId">): Promise<ProviderHealth>;
  listModels(context: Omit<ProviderContext, "modelId" | "requestId">): Promise<ProviderModel[]>;
}

export type TextMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type TextGenerationRequest = {
  messages: readonly TextMessage[];
  responseSchemaName?: string;
  responseSchema?: Readonly<Record<string, unknown>>;
  maxOutputTokens?: number;
  temperature?: number;
};

export type TextGenerationResult = {
  text: string;
  structuredOutput?: unknown;
  inputTokens?: number;
  outputTokens?: number;
  providerRequestId?: string;
};

export interface TextChatProvider {
  generateText(
    context: ProviderContext,
    request: TextGenerationRequest,
  ): Promise<TextGenerationResult>;
}

export interface ContentGenerationProvider {
  generateContent(
    context: ProviderContext,
    request: TextGenerationRequest,
  ): Promise<TextGenerationResult>;
}

export type AudioInput = {
  bytes: Uint8Array;
  mediaType: string;
  languageCode?: string;
};

export type TranscriptionResult = {
  text: string;
  confidence?: number;
  segments?: readonly { text: string; startMs?: number; endMs?: number }[];
  providerRequestId?: string;
};

export interface SpeechToTextProvider {
  transcribe(context: ProviderContext, input: AudioInput): Promise<TranscriptionResult>;
}

export type SpeechSynthesisRequest = {
  text: string;
  languageCode: string;
  providerVoiceId: string;
  speakingRate?: number;
  styleInstructions?: string;
  providerMetadata?: Readonly<Record<string, unknown>>;
};

export type SpeechSynthesisResult = {
  audio: Uint8Array;
  mediaType: string;
  durationMs?: number;
  providerRequestId?: string;
};

export interface TextToSpeechProvider {
  synthesize(
    context: ProviderContext,
    request: SpeechSynthesisRequest,
  ): Promise<SpeechSynthesisResult>;
}

export type PronunciationAnalysisRequest = {
  audio: AudioInput;
  expectedText: string;
  languageCode: string;
};

export type PronunciationAnalysisResult = {
  recognizedText?: string;
  confidence?: number;
  providerScores?: Readonly<Record<string, number>>;
  wordFeedback?: readonly Readonly<Record<string, unknown>>[];
  providerRequestId?: string;
  /** Explicitly describes what the provider measured; never infer phoneme accuracy. */
  evidenceKind: "acoustic" | "transcription" | "provider_estimate";
};

export interface PronunciationAnalysisProvider {
  analyzePronunciation(
    context: ProviderContext,
    request: PronunciationAnalysisRequest,
  ): Promise<PronunciationAnalysisResult>;
}

export type ProviderRoute = {
  featureKey: string;
  capability: AiCapability;
  primary: Readonly<{ providerId: ProviderId; modelId: ProviderModelId }>;
  fallbacks: readonly Readonly<{ providerId: ProviderId; modelId: ProviderModelId }>[];
};

export interface ProviderRouter {
  resolveRoute(featureKey: string, capability: AiCapability): Promise<ProviderRoute>;
}
