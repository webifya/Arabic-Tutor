import { describe, expect, it } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { parseApplicationSettings } from "@/lib/settings/service";
import { assertSafeStorageKey, LocalStorageProvider } from "@/lib/storage/local";
import { isDuplicateAccountError } from "@/lib/auth/validation";

describe("Phase 1 services", () => {
  it("parses typed settings and safe defaults", () => {
    const settings = parseApplicationSettings([["app.name","Lisan Test"],["app.default_locale","en"],["installation.completed",true]]);
    expect(settings.appName).toBe("Lisan Test"); expect(settings.defaultLocale).toBe("en"); expect(settings.timezone).toBe("Asia/Dhaka"); expect(settings.installationCompleted).toBe(true);
  });
  it("rejects storage traversal and accepts generated key shape", () => {
    expect(assertSafeStorageKey("public/avatar/0123456789abcdef0123456789abcdef.webp")).toContain("public/avatar/");
    expect(() => assertSafeStorageKey("private/avatar/../../secret")).toThrow("UNSAFE_STORAGE_KEY");
    expect(() => assertSafeStorageKey("/absolute/path.jpg")).toThrow("UNSAFE_STORAGE_KEY");
  });
  it("writes, reads, and deletes an allowlisted private object", async () => {
    const root=await mkdtemp(path.join(tmpdir(),"lisan-storage-test-"));
    try {
      const storage=new LocalStorageProvider(root); const stored=await storage.put({data:new Uint8Array([82,73,70,70]),mimeType:"audio/wav",visibility:"private",purpose:"tts-audio"});
      expect(stored.key).toMatch(/^private\/tts-audio\//); expect(Array.from(await storage.read(stored.key))).toEqual([82,73,70,70]);
      await storage.delete(stored.key); await expect(storage.read(stored.key)).rejects.toMatchObject({code:"ENOENT"});
    } finally { await rm(root,{recursive:true,force:true}); }
  });
  it("classifies database duplicate email errors without exposing SQL", () => {
    expect(isDuplicateAccountError({code:"ER_DUP_ENTRY"})).toBe(true);
    expect(isDuplicateAccountError(new Error("internal"))).toBe(false);
  });
});
