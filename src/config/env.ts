import "server-only";
import { z } from "zod";
import { getEffectiveRuntimeConfig } from "@/lib/installer/runtime-config";

const optionalUrl = z.string().url().optional().or(z.literal(""));
const optionalEncryptionKey = z.string().min(43).optional().or(z.literal(""));

const serverEnvSchema = z.object({
  DATABASE_URL: optionalUrl,
  AUTH_SECRET: z.string().min(32).optional(),
  OPENAI_API_KEY: z.string().min(1).optional(),
  OPENAI_PROJECT_ID: z.string().min(1).optional(),
  APP_ENCRYPTION_KEY: optionalEncryptionKey,
  STORAGE_DRIVER: z.enum(["local", "cpanel"]).default("local"),
  STORAGE_LOCAL_ROOT: z.string().min(1).default("storage"),
  AUDIO_RETENTION_ENABLED: z.enum(["true", "false"]).default("false"),
});

/**
 * Server-only configuration. Phase-specific services must validate their
 * required keys when initialized; Phase 0 can build without production secrets.
 */
export async function getServerEnv() {
  const runtime = await getEffectiveRuntimeConfig();
  return serverEnvSchema.parse({
    ...process.env,
    DATABASE_URL: process.env.DATABASE_URL || runtime?.databaseUrl,
    AUTH_SECRET: process.env.AUTH_SECRET || runtime?.authSecret,
    APP_ENCRYPTION_KEY: process.env.APP_ENCRYPTION_KEY || runtime?.appEncryptionKey,
  });
}
