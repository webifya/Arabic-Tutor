import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";

describe("Phase 1 course schema", () => {
  it("keeps courses language-independent and seeds the initial draft", () => {
    const schema=readFileSync("prisma/schema.prisma","utf8"); const migration=readFileSync("prisma/migrations/20260828000200_phase1_core_domain/migration.sql","utf8");
    expect(schema).toContain("sourceLanguageId"); expect(schema).toContain("targetLanguageId");
    expect(migration).toContain("arabic-foundation-bn"); expect(migration).toContain("'draft'");
    expect(migration).toContain("ON DUPLICATE KEY UPDATE");
  });
  it("does not rewrite the deployed installer migration", () => {
    const original=readFileSync("prisma/migrations/20260828000100_installer_foundation/migration.sql");
    expect(createHash("sha256").update(original).digest("hex")).toBe("da0369cbc2ecaf8afe40ab46f7da2a52ee2c083f4f44232c616071e764d27a5b");
  });
});
