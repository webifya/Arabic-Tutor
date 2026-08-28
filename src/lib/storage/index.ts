import "server-only";
import { LocalStorageProvider } from "./local";
import type { StorageProvider } from "./types";

export function getStorageProvider(): StorageProvider {
  const driver = process.env.STORAGE_DRIVER || "local";
  if (driver !== "local") throw new Error(`Unsupported storage driver: ${driver}`);
  return new LocalStorageProvider();
}
