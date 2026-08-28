import "server-only";

import { randomBytes, randomUUID } from "node:crypto";
import { access, chmod, mkdir, open, readFile, rename, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";
import { z } from "zod";

import type { InstallationState, RuntimeConfig } from "./types";
import { getApplicationRoot } from "./paths";

const runtimeConfigSchema = z.object({
  version: z.literal(1),
  installationId: z.string().uuid(),
  installationState: z.enum([
    "not_started",
    "configuring",
    "migrating",
    "seeding",
    "creating_admin",
    "completed",
    "failed",
  ]),
  databaseUrl: z.string().url().optional(),
  authSecret: z.string().min(43),
  appEncryptionKey: z.string().min(43),
  failureCode: z.string().max(100).optional(),
  updatedAt: z.string().datetime(),
});

export function getRuntimeConfigPath(): string {
  const configured = process.env.LISAN_RUNTIME_CONFIG_PATH?.trim();
  return configured ? path.resolve(configured) : path.join(getApplicationRoot(), ".runtime-config.json");
}

export function getRuntimeDirectory(): string {
  return path.join(path.dirname(getRuntimeConfigPath()), ".runtime");
}

async function writePrivateJson(filePath: string, value: unknown): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true, mode: 0o700 });
  const temporaryPath = `${filePath}.${process.pid}.${randomUUID()}.tmp`;
  await writeFile(temporaryPath, `${JSON.stringify(value, null, 2)}\n`, {
    encoding: "utf8",
    mode: 0o600,
    flag: "wx",
  });
  await rename(temporaryPath, filePath);
  await chmod(filePath, 0o600);
}

export async function readRuntimeConfig(): Promise<RuntimeConfig | null> {
  try {
    const raw = await readFile(getRuntimeConfigPath(), "utf8");
    return runtimeConfigSchema.parse(JSON.parse(raw));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

export async function ensureBootstrapConfig(): Promise<RuntimeConfig> {
  const existing = await readRuntimeConfig();
  if (existing) return existing;

  const config: RuntimeConfig = {
    version: 1,
    installationId: randomUUID(),
    installationState: "not_started",
    authSecret: randomBytes(48).toString("base64url"),
    appEncryptionKey: randomBytes(32).toString("base64"),
    updatedAt: new Date().toISOString(),
  };
  await mkdir(path.dirname(getRuntimeConfigPath()), { recursive: true, mode: 0o700 });
  try {
    const handle = await open(getRuntimeConfigPath(), "wx", 0o600);
    try {
      await handle.writeFile(`${JSON.stringify(config, null, 2)}\n`, "utf8");
      await handle.sync();
    } finally {
      await handle.close();
    }
    return config;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        const concurrentConfig = await readRuntimeConfig();
        if (concurrentConfig) return concurrentConfig;
      } catch {
        await new Promise((resolve) => setTimeout(resolve, 25));
      }
    }
    throw new Error("Bootstrap configuration is being initialized; retry the request");
  }
}

export async function updateRuntimeConfig(
  patch: Partial<Pick<RuntimeConfig, "databaseUrl" | "failureCode">> & {
    installationState?: InstallationState;
  },
): Promise<RuntimeConfig> {
  const current = await ensureBootstrapConfig();
  const next: RuntimeConfig = {
    ...current,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  if (patch.failureCode === undefined && patch.installationState !== "failed") {
    delete next.failureCode;
  }
  await writePrivateJson(getRuntimeConfigPath(), next);
  return next;
}

export async function getEffectiveRuntimeConfig(): Promise<RuntimeConfig | null> {
  const fileConfig = await readRuntimeConfig();
  if (!fileConfig) return null;
  return {
    ...fileConfig,
    databaseUrl: process.env.DATABASE_URL || fileConfig.databaseUrl,
    authSecret: process.env.AUTH_SECRET || fileConfig.authSecret,
    appEncryptionKey: process.env.APP_ENCRYPTION_KEY || fileConfig.appEncryptionKey,
  };
}

export async function checkRuntimeWritable(): Promise<boolean> {
  const directory = path.dirname(getRuntimeConfigPath());
  try {
    await mkdir(directory, { recursive: true, mode: 0o700 });
    await access(directory, constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

export { writePrivateJson };
