import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/installer/crypto";
import { hasRole, isAdminRole, isRole } from "@/lib/auth/roles";
import { hashResetToken } from "@/lib/auth/reset-tokens";
import { signupSchema } from "@/lib/auth/validation";

describe("Phase 1 authentication primitives", () => {
  it("preserves installer scrypt password compatibility", async () => {
    const hash = await hashPassword("Secure!Student123");
    expect(await verifyPassword("Secure!Student123", hash)).toBe(true);
    expect(await verifyPassword("wrong", hash)).toBe(false);
  });
  it("checks roles without trusting arbitrary strings", () => {
    expect(isRole("student")).toBe(true); expect(isRole("owner")).toBe(false);
    expect(hasRole("student", ["student"])).toBe(true); expect(isAdminRole("student")).toBe(false);
    expect(isAdminRole("admin")).toBe(true); expect(isAdminRole("super_admin")).toBe(true);
  });
  it("validates signup confirmation and strong passwords", () => {
    expect(signupSchema.safeParse({ fullName:"A B",email:"a@example.com",password:"Secure!Student123",confirmPassword:"Secure!Student123" }).success).toBe(true);
    expect(signupSchema.safeParse({ fullName:"A B",email:"a@example.com",password:"weak",confirmPassword:"weak" }).success).toBe(false);
  });
  it("hashes reset tokens deterministically without retaining plaintext", () => {
    expect(hashResetToken("secret-token")).toMatch(/^[a-f0-9]{64}$/);
    expect(hashResetToken("secret-token")).toBe(hashResetToken("secret-token"));
    expect(hashResetToken("secret-token")).not.toContain("secret-token");
  });
});
