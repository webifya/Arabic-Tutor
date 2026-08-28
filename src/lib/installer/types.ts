export const installationStates = [
  "not_started",
  "configuring",
  "migrating",
  "seeding",
  "creating_admin",
  "completed",
  "failed",
] as const;

export type InstallationState = (typeof installationStates)[number];

export type RuntimeConfig = {
  version: 1;
  installationId: string;
  installationState: InstallationState;
  databaseUrl?: string;
  authSecret: string;
  appEncryptionKey: string;
  failureCode?: string;
  updatedAt: string;
};

export type EncryptedEnvelope = {
  version: 1;
  algorithm: "aes-256-gcm";
  keyVersion: 1;
  iv: string;
  ciphertext: string;
  authTag: string;
};

export type InstallerDraft = {
  version: 1;
  databaseUrl?: string;
  databaseLabel?: string;
  application?: {
    siteName: string;
    tagline: string;
    siteUrl: string;
    defaultLocale: "bn" | "en";
    defaultTimezone: string;
    adminEmail: string;
  };
  administrator?: {
    fullName: string;
    email: string;
    passwordHash: string;
  };
  ai?: {
    provider: "openai" | "gemini" | "anthropic" | "openai_compatible";
    displayName: string;
    baseUrl?: string;
    modelId?: string;
    availableModels?: string[];
    encryptedCredential: EncryptedEnvelope;
  };
  voicePreset?: "adult_arabic_teacher" | "child_friendly" | "slow_pronunciation" | "conversation_tutor";
  attempts: Record<string, number[]>;
  updatedAt: string;
};
