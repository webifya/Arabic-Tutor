import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { decryptSecret, encryptSecret, hashPassword, verifyPassword } from "@/lib/installer/crypto";
import { buildMysqlUrl } from "@/lib/installer/database";

describe("installer security primitives", () => {
  it("URL-encodes database credentials", () => {
    const url = buildMysqlUrl({
      host: "localhost",
      port: 3306,
      database: "lisan_db",
      username: "user@account",
      password: "p@ss:/?#% word",
    });
    expect(url).toBe(
      "mysql://user%40account:p%40ss%3A%2F%3F%23%25%20word@localhost:3306/lisan_db",
    );
  });

  it("hashes passwords with a unique salt and verifies them", async () => {
    const first = await hashPassword("A-strong-password-42!");
    const second = await hashPassword("A-strong-password-42!");
    expect(first).not.toBe(second);
    expect(first).not.toContain("A-strong-password-42!");
    await expect(verifyPassword("A-strong-password-42!", first)).resolves.toBe(true);
    await expect(verifyPassword("wrong-password", first)).resolves.toBe(false);
  });

  it("encrypts provider credentials with authenticated encryption", () => {
    const key = Buffer.alloc(32, 7).toString("base64");
    const envelope = encryptSecret("provider-secret", key);
    expect(JSON.stringify(envelope)).not.toContain("provider-secret");
    expect(decryptSecret(envelope, key)).toBe("provider-secret");
  });
});
