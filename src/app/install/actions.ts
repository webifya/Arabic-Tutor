"use server";

import { z } from "zod";

import { encryptSecret, hashPassword } from "@/lib/installer/crypto";
import { buildMysqlUrl, runPrismaMigrations, seedInstallation, testDatabaseConnection } from "@/lib/installer/database";
import {
  consumeAttempt,
  consumeGlobalAttempt,
  deleteDraft,
  getOrCreateInstallerSession,
  readDraft,
  updateDraft,
} from "@/lib/installer/draft";
import { withInstallationLock } from "@/lib/installer/lock";
import { testProviderConnection } from "@/lib/installer/provider-test";
import { ensureBootstrapConfig, getEffectiveRuntimeConfig, updateRuntimeConfig } from "@/lib/installer/runtime-config";
import { getInstallationState, getInstallerReadiness } from "@/lib/installer/status";

type ActionFailure = { ok: false; message: string; fields?: Record<string, string[]> };
type ActionResult<T = undefined> = { ok: true; data: T } | ActionFailure;

const databaseSchema = z.object({
  host: z.string().trim().min(1).max(253).regex(/^[a-zA-Z0-9._:-]+$/),
  port: z.coerce.number().int().min(1).max(65_535).default(3306),
  database: z.string().trim().min(1).max(64).regex(/^[a-zA-Z0-9_$-]+$/),
  username: z.string().min(1).max(128),
  password: z.string().max(512),
});

const applicationSchema = z.object({
  siteName: z.string().trim().min(1).max(100),
  tagline: z.string().trim().min(1).max(191),
  siteUrl: z.string().url().refine((value) => new URL(value).protocol === "https:" || process.env.NODE_ENV !== "production"),
  defaultLocale: z.enum(["bn", "en"]),
  defaultTimezone: z.string().min(1).max(100).refine((value) => {
    try {
      new Intl.DateTimeFormat("en", { timeZone: value });
      return true;
    } catch {
      return false;
    }
  }),
  adminEmail: z.string().trim().toLowerCase().email().max(191),
});

const strongPassword = z
  .string()
  .min(12)
  .max(128)
  .regex(/[a-z]/)
  .regex(/[A-Z]/)
  .regex(/[0-9]/)
  .regex(/[^A-Za-z0-9]/);

const administratorSchema = z
  .object({
    fullName: z.string().trim().min(2).max(191),
    email: z.string().trim().toLowerCase().email().max(191),
    password: strongPassword,
    confirmPassword: z.string(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

const aiSchema = z.object({
  provider: z.enum(["openai", "gemini", "anthropic", "openai_compatible"]),
  displayName: z.string().trim().min(1).max(191),
  apiKey: z.string().min(8).max(1_000),
  baseUrl: z.string().url().optional().or(z.literal("")),
  modelId: z.string().trim().max(191).optional(),
});

const voiceSchema = z.enum([
  "adult_arabic_teacher",
  "child_friendly",
  "slow_pronunciation",
  "conversation_tutor",
]);

async function ensureInstallerOpen(): Promise<ActionFailure | null> {
  if ((await getInstallationState()) === "completed") {
    return { ok: false, message: "Installation is already complete." };
  }
  return null;
}

function validationFailure(error: z.ZodError): ActionResult<never> {
  return { ok: false, message: "Please correct the highlighted values.", fields: error.flatten().fieldErrors };
}

export async function startInstaller(): Promise<ActionResult<Awaited<ReturnType<typeof getInstallerReadiness>>>> {
  const closed = await ensureInstallerOpen();
  if (closed) return closed;
  if (!(await consumeGlobalAttempt("installer_start", 30, 10 * 60_000))) {
    return { ok: false, message: "Too many setup requests. Please wait and try again." };
  }
  await ensureBootstrapConfig();
  await getOrCreateInstallerSession();
  return { ok: true, data: await getInstallerReadiness() };
}

export async function testAndSaveDatabase(input: unknown): Promise<ActionResult<{ label: string }>> {
  const closed = await ensureInstallerOpen();
  if (closed) return closed;
  const parsed = databaseSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  const sessionId = await getOrCreateInstallerSession();
  if (!(await consumeAttempt(sessionId, "database_test", 5, 60_000))) {
    return { ok: false, message: "Too many database tests. Please wait one minute." };
  }
  const databaseUrl = buildMysqlUrl(parsed.data);
  try {
    await testDatabaseConnection(databaseUrl);
  } catch {
    return { ok: false, message: "Could not connect to the database. Check the values and cPanel database permissions." };
  }
  const label = `${parsed.data.username}@${parsed.data.host}:${parsed.data.port}/${parsed.data.database}`;
  await updateDraft(sessionId, { databaseUrl, databaseLabel: label });
  return { ok: true, data: { label } };
}

export async function saveApplication(input: unknown): Promise<ActionResult<undefined>> {
  const closed = await ensureInstallerOpen();
  if (closed) return closed;
  const parsed = applicationSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  await updateDraft(await getOrCreateInstallerSession(), { application: parsed.data });
  return { ok: true, data: undefined };
}

export async function saveAdministrator(input: unknown): Promise<ActionResult<undefined>> {
  const closed = await ensureInstallerOpen();
  if (closed) return closed;
  const parsed = administratorSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  const passwordHash = await hashPassword(parsed.data.password);
  await updateDraft(await getOrCreateInstallerSession(), {
    administrator: { fullName: parsed.data.fullName, email: parsed.data.email, passwordHash },
  });
  return { ok: true, data: undefined };
}

export async function testAndSaveAi(input: unknown): Promise<ActionResult<{ models: string[] }>> {
  const closed = await ensureInstallerOpen();
  if (closed) return closed;
  const parsed = aiSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  const sessionId = await getOrCreateInstallerSession();
  if (!(await consumeAttempt(sessionId, "provider_test", 5, 5 * 60_000))) {
    return { ok: false, message: "Too many provider tests. Please wait before trying again." };
  }
  try {
    const models = await testProviderConnection({
      ...parsed.data,
      baseUrl: parsed.data.baseUrl || undefined,
    });
    await ensureBootstrapConfig();
    const runtime = await getEffectiveRuntimeConfig();
    if (!runtime) throw new Error("BOOTSTRAP_CONFIG_UNAVAILABLE");
    await updateDraft(sessionId, {
      ai: {
        provider: parsed.data.provider,
        displayName: parsed.data.displayName,
        baseUrl: parsed.data.baseUrl || undefined,
        modelId: parsed.data.modelId || models[0],
        availableModels: models.slice(0, 100),
        encryptedCredential: encryptSecret(parsed.data.apiKey, runtime.appEncryptionKey),
      },
    });
    return { ok: true, data: { models: models.slice(0, 100) } };
  } catch {
    return { ok: false, message: "The provider connection test failed. Verify the credential and provider settings." };
  }
}

export async function selectAiModel(input: unknown): Promise<ActionResult<undefined>> {
  const closed = await ensureInstallerOpen();
  if (closed) return closed;
  const parsed = z.string().trim().min(1).max(191).safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  const sessionId = await getOrCreateInstallerSession();
  const draft = await readDraft(sessionId);
  if (!draft.ai || !(draft.ai.availableModels ?? []).includes(parsed.data)) {
    return { ok: false, message: "Select a model returned by the tested provider." };
  }
  await updateDraft(sessionId, { ai: { ...draft.ai, modelId: parsed.data } });
  return { ok: true, data: undefined };
}

export async function skipAi(): Promise<ActionResult<undefined>> {
  const closed = await ensureInstallerOpen();
  if (closed) return closed;
  await updateDraft(await getOrCreateInstallerSession(), { ai: undefined });
  return { ok: true, data: undefined };
}

export async function saveVoice(input: unknown): Promise<ActionResult<undefined>> {
  const closed = await ensureInstallerOpen();
  if (closed) return closed;
  if (input === null || input === "") {
    await updateDraft(await getOrCreateInstallerSession(), { voicePreset: undefined });
    return { ok: true, data: undefined };
  }
  const parsed = voiceSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  const sessionId = await getOrCreateInstallerSession();
  const draft = await readDraft(sessionId);
  if (!draft.ai || !["openai", "gemini"].includes(draft.ai.provider)) {
    return { ok: false, message: "The configured provider does not advertise installer-supported TTS. Skip voice setup and configure it later." };
  }
  await updateDraft(sessionId, { voicePreset: parsed.data });
  return { ok: true, data: undefined };
}

export async function completeInstallation(): Promise<ActionResult<{ adminEmail: string }>> {
  const closed = await ensureInstallerOpen();
  if (closed) return closed;
  const sessionId = await getOrCreateInstallerSession();
  if (!(await consumeAttempt(sessionId, "install", 3, 10 * 60_000))) {
    return { ok: false, message: "Too many installation attempts. Wait ten minutes before retrying." };
  }
  const draft = await readDraft(sessionId);
  if (!draft.databaseUrl || !draft.application || !draft.administrator) {
    return { ok: false, message: "Database, application, and administrator steps must be completed first." };
  }
  try {
    return await withInstallationLock(async () => {
      if ((await getInstallationState()) === "completed") {
        return { ok: false, message: "Installation is already complete." };
      }
      await updateRuntimeConfig({ installationState: "configuring", databaseUrl: draft.databaseUrl });
      await testDatabaseConnection(draft.databaseUrl as string);
      await updateRuntimeConfig({ installationState: "migrating" });
      await runPrismaMigrations(draft.databaseUrl as string);
      await updateRuntimeConfig({ installationState: "seeding" });
      await updateRuntimeConfig({ installationState: "creating_admin" });
      await seedInstallation(draft.databaseUrl as string, draft);
      await updateRuntimeConfig({ installationState: "completed" });
      await deleteDraft(sessionId);
      return { ok: true, data: { adminEmail: draft.administrator?.email as string } };
    });
  } catch (error) {
    const failureCode = error instanceof Error && error.message === "INSTALLATION_IN_PROGRESS"
      ? "INSTALLATION_IN_PROGRESS"
      : "INSTALLATION_FAILED";
    await updateRuntimeConfig({ installationState: "failed", failureCode });
    return {
      ok: false,
      message:
        failureCode === "INSTALLATION_IN_PROGRESS"
          ? "Another installation attempt is already running. Wait for it to finish."
          : "Installation could not be completed. Your secrets were not exposed; review the server log and retry safely.",
    };
  }
}

export async function getSafeSummary(): Promise<ActionResult<Record<string, string | boolean>>> {
  const closed = await ensureInstallerOpen();
  if (closed) return closed;
  const draft = await readDraft(await getOrCreateInstallerSession());
  const runtime = await getEffectiveRuntimeConfig();
  return {
    ok: true,
    data: {
      database: draft.databaseLabel ?? "Not configured",
      siteName: draft.application?.siteName ?? "Not configured",
      siteUrl: draft.application?.siteUrl ?? "Not configured",
      administrator: draft.administrator?.email ?? "Not configured",
      aiProvider: draft.ai?.displayName ?? "Skipped",
      voiceProfile: draft.voicePreset ?? "Skipped",
      generatedSecrets: Boolean(runtime?.authSecret && runtime.appEncryptionKey),
    },
  };
}
