import "server-only";

import type { ProviderId } from "./contracts";

export const voicePurposes = [
  "reference_pronunciation",
  "slow_pronunciation",
  "lesson_narration",
  "conversation_tutor",
  "feedback",
] as const;

export type VoicePurpose = (typeof voicePurposes)[number];
export type StudentMode = "standard" | "child";

export type VoiceProfile = {
  id: string;
  name: string;
  providerId: ProviderId;
  providerVoiceId: string;
  languageCode: string;
  speakingRate?: number;
  styleInstructions?: string;
  purpose: VoicePurpose;
  enabled: boolean;
  providerMetadata?: Readonly<Record<string, unknown>>;
};

export type VoiceProfileAssignment = {
  id: string;
  voiceProfileId: string;
  studentMode?: StudentMode;
  courseId?: string;
  activityType?: string;
  purpose?: VoicePurpose;
  priority: number;
  enabled: boolean;
};

/** Teaching tone/pedagogy is resolved independently from synthetic voice selection. */
export type TeachingStyle = {
  id: string;
  name: string;
  studentMode?: StudentMode;
  explanationLevel: "simple" | "standard" | "advanced";
  encouragementStyle: "gentle" | "neutral" | "direct";
  instructions: string;
  enabled: boolean;
};

export interface VoiceProfileResolver {
  resolve(input: {
    languageCode: string;
    purpose: VoicePurpose;
    studentMode: StudentMode;
    courseId?: string;
    activityType?: string;
  }): Promise<VoiceProfile>;
}
