import "server-only";

import { mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import path from "node:path";
import { getApplicationRoot } from "@/lib/installer/paths";
import type { PutObjectInput, StorageProvider, StoredObject } from "./types";

const allowedMime: Record<string, readonly string[]> = {
  "lesson-image": ["image/jpeg", "image/png", "image/webp", "image/avif"],
  avatar: ["image/jpeg", "image/png", "image/webp"],
  "tts-audio": ["audio/mpeg", "audio/ogg", "audio/wav", "audio/mp4"],
  "temporary-audio": ["audio/webm", "audio/ogg", "audio/wav", "audio/mpeg", "audio/mp4"],
};
const mimeExtension: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif", "audio/mpeg": "mp3", "audio/ogg": "ogg", "audio/wav": "wav", "audio/mp4": "m4a", "audio/webm": "webm" };

export function assertSafeStorageKey(key: string): string {
  if (!/^(public|private)\/[a-z-]+\/[a-f0-9]{32}\.[a-z0-9]{2,5}$/.test(key) || key.includes("..") || path.isAbsolute(key)) throw new Error("UNSAFE_STORAGE_KEY");
  return key;
}

export class LocalStorageProvider implements StorageProvider {
  private readonly root: string;
  constructor(root = process.env.STORAGE_LOCAL_ROOT || "storage") {
    this.root = path.resolve(getApplicationRoot(), root);
  }
  private resolve(key: string): string {
    const safe = assertSafeStorageKey(key);
    const target = path.resolve(this.root, safe);
    if (!target.startsWith(`${this.root}${path.sep}`)) throw new Error("UNSAFE_STORAGE_KEY");
    return target;
  }
  async put(input: PutObjectInput): Promise<StoredObject> {
    if (!allowedMime[input.purpose]?.includes(input.mimeType)) throw new Error("UNSUPPORTED_MEDIA_TYPE");
    const extension = mimeExtension[input.mimeType];
    if (!extension || (input.extension && input.extension.toLowerCase().replace(/^\./, "") !== extension)) throw new Error("INVALID_EXTENSION");
    const key = `${input.visibility}/${input.purpose}/${randomBytes(16).toString("hex")}.${extension}`;
    const target = this.resolve(key);
    await mkdir(path.dirname(target), { recursive: true, mode: 0o700 });
    const temporary = `${target}.tmp`;
    await writeFile(temporary, input.data, { mode: 0o600, flag: "wx" });
    await rename(temporary, target);
    return { key, size: input.data.byteLength, mimeType: input.mimeType, visibility: input.visibility,
      publicUrl: input.visibility === "public" && process.env.STORAGE_PUBLIC_BASE_URL ? `${process.env.STORAGE_PUBLIC_BASE_URL.replace(/\/$/, "")}/${key.slice(7)}` : undefined };
  }
  async read(key: string): Promise<Uint8Array> { return readFile(this.resolve(key)); }
  async delete(key: string): Promise<void> { try { await unlink(this.resolve(key)); } catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; } }
}
