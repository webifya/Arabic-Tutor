import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { mkdir, readFile, unlink } from "node:fs/promises";
import path from "node:path";
import { cookies, headers } from "next/headers";

import { getRuntimeDirectory, writePrivateJson } from "./runtime-config";
import type { InstallerDraft } from "./types";

const SESSION_COOKIE = "lisan_install_session";
const SESSION_PATTERN = /^[a-f0-9]{64}$/;

function draftPath(sessionId: string): string {
  if (!SESSION_PATTERN.test(sessionId)) throw new Error("Invalid installer session");
  return path.join(getRuntimeDirectory(), "installer-drafts", `${sessionId}.json`);
}

export async function getOrCreateInstallerSession(): Promise<string> {
  const cookieStore = await cookies();
  const existing = cookieStore.get(SESSION_COOKIE)?.value;
  if (existing && SESSION_PATTERN.test(existing)) return existing;

  const sessionId = randomBytes(32).toString("hex");
  cookieStore.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60,
  });
  return sessionId;
}

export async function readDraft(sessionId: string): Promise<InstallerDraft> {
  try {
    return JSON.parse(await readFile(draftPath(sessionId), "utf8")) as InstallerDraft;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    return {
      version: 1,
      attempts: {},
      updatedAt: new Date().toISOString(),
    };
  }
}

export async function updateDraft(
  sessionId: string,
  patch: Partial<Omit<InstallerDraft, "version" | "attempts" | "updatedAt">>,
): Promise<InstallerDraft> {
  const current = await readDraft(sessionId);
  const next: InstallerDraft = {
    ...current,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  await writePrivateJson(draftPath(sessionId), next);
  return next;
}

export async function consumeAttempt(
  sessionId: string,
  action: string,
  maximum: number,
  windowMs: number,
): Promise<boolean> {
  const draft = await readDraft(sessionId);
  const now = Date.now();
  const recent = (draft.attempts[action] ?? []).filter((timestamp) => timestamp > now - windowMs);
  if (recent.length >= maximum) return false;
  draft.attempts[action] = [...recent, now];
  draft.updatedAt = new Date().toISOString();
  await writePrivateJson(draftPath(sessionId), draft);
  return true;
}

export async function consumeGlobalAttempt(
  action: string,
  maximum: number,
  windowMs: number,
): Promise<boolean> {
  const headerStore = await headers();
  const source =
    headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headerStore.get("x-real-ip") ||
    "unknown";
  const key = createHash("sha256").update(`${action}:${source}`).digest("hex");
  const directory = path.join(getRuntimeDirectory(), "rate-limits");
  await mkdir(directory, { recursive: true, mode: 0o700 });
  const filePath = path.join(directory, `${key}.json`);
  let attempts: number[] = [];
  try {
    attempts = JSON.parse(await readFile(filePath, "utf8")) as number[];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
  const now = Date.now();
  attempts = attempts.filter((timestamp) => timestamp > now - windowMs);
  if (attempts.length >= maximum) return false;
  await writePrivateJson(filePath, [...attempts, now]);
  return true;
}

export async function deleteDraft(sessionId: string): Promise<void> {
  try {
    await unlink(draftPath(sessionId));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
}
