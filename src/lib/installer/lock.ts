import "server-only";

import { open, stat, unlink } from "node:fs/promises";
import path from "node:path";

import { getRuntimeDirectory } from "./runtime-config";

const STALE_AFTER_MS = 15 * 60 * 1_000;

function lockPath(): string {
  return path.join(getRuntimeDirectory(), "installation.lock");
}

export async function withInstallationLock<T>(operation: () => Promise<T>): Promise<T> {
  const filePath = lockPath();
  try {
    const details = await stat(filePath);
    if (Date.now() - details.mtimeMs > STALE_AFTER_MS) await unlink(filePath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }

  let handle;
  try {
    handle = await open(filePath, "wx", 0o600);
    await handle.writeFile(`${process.pid}:${Date.now()}\n`, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "EEXIST") {
      throw new Error("INSTALLATION_IN_PROGRESS");
    }
    throw error;
  }

  try {
    return await operation();
  } finally {
    await handle.close();
    await unlink(filePath).catch(() => undefined);
  }
}
