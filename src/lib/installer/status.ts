import "server-only";

import { access, mkdir } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";

import { databaseReportsInstalled } from "./database";
import {
  checkRuntimeWritable,
  getEffectiveRuntimeConfig,
  readRuntimeConfig,
  updateRuntimeConfig,
} from "./runtime-config";
import type { InstallationState } from "./types";
import { getApplicationRoot } from "./paths";

export type InstallerReadiness = {
  nodeCompatible: boolean;
  runtimeWritable: boolean;
  storageWritable: boolean;
  prismaAvailable: boolean;
  databaseDriverAvailable: boolean;
  bootstrapSecretsAvailable: boolean;
  databaseConfigured: boolean;
};

export async function getInstallationState(): Promise<InstallationState> {
  const fileConfig = await readRuntimeConfig();
  if (!fileConfig) return "not_started";
  if (fileConfig.installationState === "completed") return "completed";

  const effective = await getEffectiveRuntimeConfig();
  if (effective?.databaseUrl && (await databaseReportsInstalled(effective.databaseUrl))) {
    await updateRuntimeConfig({ installationState: "completed", databaseUrl: effective.databaseUrl });
    return "completed";
  }
  return fileConfig.installationState;
}

export async function getInstallerReadiness(): Promise<InstallerReadiness> {
  const runtimeWritable = await checkRuntimeWritable();
  const applicationRoot = getApplicationRoot();
  const storageRoot = path.resolve(applicationRoot, process.env.STORAGE_LOCAL_ROOT || "storage");
  let storageWritable = false;
  let prismaAvailable = false;
  let databaseDriverAvailable = false;
  try {
    await mkdir(storageRoot, { recursive: true });
    await access(storageRoot, constants.W_OK);
    storageWritable = true;
  } catch {
    storageWritable = false;
  }
  try {
    await access(path.join(applicationRoot, "node_modules", "prisma", "build", "index.js"));
    prismaAvailable = true;
  } catch {
    prismaAvailable = false;
  }
  try {
    await import("mysql2/promise");
    databaseDriverAvailable = true;
  } catch {
    databaseDriverAvailable = false;
  }
  const major = Number(process.versions.node.split(".")[0]);
  const minor = Number(process.versions.node.split(".")[1]);
  const nodeCompatible =
    (major === 20 && minor >= 19) || (major === 22 && minor >= 12) || major === 24;
  const effective = await getEffectiveRuntimeConfig();
  return {
    nodeCompatible,
    runtimeWritable,
    storageWritable,
    prismaAvailable,
    databaseDriverAvailable,
    bootstrapSecretsAvailable: Boolean(effective?.authSecret && effective.appEncryptionKey),
    databaseConfigured: Boolean(effective?.databaseUrl),
  };
}

export async function isInstalled(): Promise<boolean> {
  return (await getInstallationState()) === "completed";
}
