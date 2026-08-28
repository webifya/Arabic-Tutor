import "server-only";
import { z } from "zod";

const optionalUrl = z.string().url().optional().or(z.literal(""));

const serverEnvSchema = z.object({
  DATABASE_URL: optionalUrl,
  AUTH_SECRET: z.string().min(32).optional(),
  OPENAI_API_KEY: z.string().min(1).optional(),
  OPENAI_PROJECT_ID: z.string().min(1).optional(),
  STORAGE_DRIVER: z.enum(["local", "cpanel"]).default("local"),
  STORAGE_LOCAL_ROOT: z.string().min(1).default("storage"),
  AUDIO_RETENTION_ENABLED: z.enum(["true", "false"]).default("false"),
});

/**
 * Server-only configuration. Phase-specific services must validate their
 * required keys when initialized; Phase 0 can build without production secrets.
 */
export const serverEnv = serverEnvSchema.parse(process.env);
