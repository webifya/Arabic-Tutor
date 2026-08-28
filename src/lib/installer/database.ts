import "server-only";

import { randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import path from "node:path";
import { createConnection } from "mysql2/promise";
import type { Connection } from "mysql2/promise";

import type { InstallerDraft } from "./types";
import { getApplicationRoot } from "./paths";

export function buildMysqlUrl(input: {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
}): string {
  const host = input.host.includes(":") && !input.host.startsWith("[") ? `[${input.host}]` : input.host;
  return `mysql://${encodeURIComponent(input.username)}:${encodeURIComponent(input.password)}@${host}:${input.port}/${encodeURIComponent(input.database)}`;
}

export async function testDatabaseConnection(databaseUrl: string): Promise<void> {
  const connection = await createConnection({ uri: databaseUrl, connectTimeout: 7_000 });
  try {
    await connection.query("SELECT 1");
  } finally {
    await connection.end();
  }
}

export async function databaseReportsInstalled(databaseUrl: string): Promise<boolean> {
  try {
    const connection = await createConnection({ uri: databaseUrl, connectTimeout: 3_000 });
    try {
      const [rows] = await connection.execute(
        "SELECT `value` FROM `app_settings` WHERE `key` = ? LIMIT 1",
        ["installation.completed"],
      );
      const value = (rows as { value: unknown }[])[0]?.value;
      return value === true || value === 1 || value === "true" || value === "1";
    } finally {
      await connection.end();
    }
  } catch {
    return false;
  }
}

export async function runPrismaMigrations(databaseUrl: string): Promise<void> {
  const applicationRoot = getApplicationRoot();
  const prismaCli = path.join(applicationRoot, "node_modules", "prisma", "build", "index.js");
  await new Promise<void>((resolve, reject) => {
    const child = spawn(process.execPath, [prismaCli, "migrate", "deploy"], {
      cwd: applicationRoot,
      env: { ...process.env, DATABASE_URL: databaseUrl },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let safeError = "";
    child.stderr.on("data", (chunk: Buffer) => {
      safeError = `${safeError}${chunk.toString("utf8")}`.slice(-2_000);
    });
    const timer = setTimeout(() => {
      child.kill("SIGTERM");
      reject(new Error("Migration timed out"));
    }, 120_000);
    child.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.on("exit", (code) => {
      clearTimeout(timer);
      if (code === 0) resolve();
      else reject(new Error(`Migration failed (${code ?? "unknown"}): ${safeError}`));
    });
  });
}

async function setSetting(connection: Connection, key: string, value: unknown): Promise<void> {
  await connection.execute(
    "INSERT INTO `app_settings` (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)",
    [key, JSON.stringify(value)],
  );
}

export async function seedInstallation(databaseUrl: string, draft: InstallerDraft): Promise<void> {
  if (!draft.application || !draft.administrator) throw new Error("Installer draft is incomplete");
  const connection = await createConnection({ uri: databaseUrl, connectTimeout: 7_000 });
  await connection.beginTransaction();
  try {
    await setSetting(connection, "app.name", draft.application.siteName);
    await setSetting(connection, "app.tagline", draft.application.tagline);
    await setSetting(connection, "app.url", draft.application.siteUrl);
    await setSetting(connection, "app.default_locale", draft.application.defaultLocale);
    await setSetting(connection, "app.default_timezone", draft.application.defaultTimezone);
    await setSetting(connection, "app.admin_email", draft.application.adminEmail);

    for (const language of [
      ["lang_bn", "bn", "Bengali", "বাংলা", "ltr"],
      ["lang_ar", "ar", "Arabic", "العربية", "rtl"],
      ["lang_en", "en", "English", "English", "ltr"],
    ]) {
      await connection.execute(
        "INSERT INTO `languages` (`id`, `code`, `name`, `native_name`, `direction`) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `native_name` = VALUES(`native_name`), `direction` = VALUES(`direction`)",
        language,
      );
    }

    await connection.execute(
      "INSERT INTO `users` (`id`, `email`, `full_name`, `password_hash`, `role`, `email_verified_at`) VALUES (?, ?, ?, ?, 'super_admin', CURRENT_TIMESTAMP(3))",
      [
        randomUUID().replaceAll("-", ""),
        draft.administrator.email.toLowerCase(),
        draft.administrator.fullName,
        draft.administrator.passwordHash,
      ],
    );

    let providerId: string | null = null;
    if (draft.ai) {
      providerId = randomUUID().replaceAll("-", "");
      await connection.execute(
        "INSERT INTO `ai_providers` (`id`, `adapter_key`, `display_name`, `base_url`, `enabled`) VALUES (?, ?, ?, ?, true)",
        [providerId, draft.ai.provider, draft.ai.displayName, draft.ai.baseUrl ?? null],
      );
      await connection.execute(
        "INSERT INTO `ai_provider_credentials` (`id`, `provider_id`, `label`, `encrypted_envelope`, `key_version`) VALUES (?, ?, ?, ?, 1)",
        [
          randomUUID().replaceAll("-", ""),
          providerId,
          "Initial installer credential",
          JSON.stringify(draft.ai.encryptedCredential),
        ],
      );
      if (draft.ai.modelId) {
        await connection.execute(
          "INSERT INTO `ai_provider_models` (`id`, `provider_id`, `provider_model_id`, `display_name`, `capabilities`) VALUES (?, ?, ?, ?, ?)",
          [
            randomUUID().replaceAll("-", ""),
            providerId,
            draft.ai.modelId,
            draft.ai.modelId,
            JSON.stringify(["text_chat", "content_generation"]),
          ],
        );
      }
    }

    if (draft.voicePreset) {
      const presets = {
        adult_arabic_teacher: ["Adult Arabic Teacher", "reference_pronunciation", 1],
        child_friendly: ["Child Friendly", "lesson_narration", 1],
        slow_pronunciation: ["Slow Pronunciation", "slow_pronunciation", 0.75],
        conversation_tutor: ["Conversation Tutor", "conversation_tutor", 1],
      } as const;
      const [name, purpose, rate] = presets[draft.voicePreset];
      const voiceProfileId = randomUUID().replaceAll("-", "");
      await connection.execute(
        "INSERT INTO `voice_profiles` (`id`, `name`, `provider_id`, `language_code`, `speaking_rate`, `purpose`, `enabled`) VALUES (?, ?, ?, 'ar', ?, ?, false)",
        [voiceProfileId, name, providerId, rate, purpose],
      );
      await setSetting(connection, "voice.default_profile_id", voiceProfileId);
    }

    await setSetting(connection, "installation.completed", true);
    await setSetting(connection, "installation.completed_at", new Date().toISOString());
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    await connection.end();
  }
}
