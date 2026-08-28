"use server";

import { hashPassword } from "@/lib/installer/crypto";
import { createStudent, findUserByEmail } from "@/lib/auth/user-repository";
import { consumeRateLimit, rateLimitKey } from "@/lib/auth/rate-limit";
import { createPasswordResetToken, consumePasswordResetToken } from "@/lib/auth/reset-tokens";
import { forgotPasswordSchema, isDuplicateAccountError, resetPasswordSchema, signupSchema } from "@/lib/auth/validation";
import { getEmailProvider } from "@/lib/email/provider";
import { isInstalled } from "@/lib/installer/status";

export type AuthActionResult = { ok: boolean; message: string; fields?: Record<string, string[]> };
const invalid = (error: { flatten(): { fieldErrors: Record<string, string[]> } }): AuthActionResult => ({ ok: false, message: "দয়া করে তথ্যগুলো ঠিক করুন।", fields: error.flatten().fieldErrors });
async function installerClosed(): Promise<boolean> { return isInstalled(); }

export async function signupAction(input: unknown): Promise<AuthActionResult> {
  if (!(await installerClosed())) return { ok: false, message: "আগে সাইট ইনস্টল সম্পন্ন করুন।" };
  const parsed = signupSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  if (!(await consumeRateLimit(rateLimitKey("signup", parsed.data.email), 5, 60 * 60_000))) return { ok: false, message: "অনেকবার চেষ্টা করা হয়েছে। পরে আবার চেষ্টা করুন।" };
  try {
    await createStudent({ fullName: parsed.data.fullName, email: parsed.data.email, passwordHash: await hashPassword(parsed.data.password) });
    return { ok: true, message: "অ্যাকাউন্ট তৈরি হয়েছে।" };
  } catch (error) {
    if (isDuplicateAccountError(error)) return { ok: false, message: "এই ইমেইল দিয়ে ইতিমধ্যে একটি অ্যাকাউন্ট আছে।" };
    return { ok: false, message: "অ্যাকাউন্ট তৈরি করা যায়নি। পরে আবার চেষ্টা করুন।" };
  }
}

export async function forgotPasswordAction(input: unknown): Promise<AuthActionResult> {
  if (!(await installerClosed())) return { ok: false, message: "আগে সাইট ইনস্টল সম্পন্ন করুন।" };
  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const generic = "এই ইমেইলের অ্যাকাউন্ট থাকলে রিসেট নির্দেশনা পাঠানো হবে। SMTP না থাকলে সাইট প্রশাসককে ইমেইল সেবা কনফিগার করতে হবে।";
  if (!(await consumeRateLimit(rateLimitKey("password-reset", parsed.data.email), 3, 60 * 60_000))) return { ok: true, message: generic };
  const user = await findUserByEmail(parsed.data.email);
  if (user?.status === "active") {
    const token = await createPasswordResetToken(user.id);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    try {
      await (await getEmailProvider()).send({
        to: user.email, subject: "Lisan পাসওয়ার্ড রিসেট",
        text: `৩০ মিনিটের মধ্যে পাসওয়ার্ড পরিবর্তন করুন: ${baseUrl}/reset-password?token=${encodeURIComponent(token)}`,
      });
    } catch { /* The public response remains enumeration-safe and never claims confirmed delivery. */ }
  }
  return { ok: true, message: generic };
}

export async function resetPasswordAction(input: unknown): Promise<AuthActionResult> {
  if (!(await installerClosed())) return { ok: false, message: "আগে সাইট ইনস্টল সম্পন্ন করুন।" };
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  if (!(await consumeRateLimit(rateLimitKey("reset-token", parsed.data.token), 5, 30 * 60_000))) return { ok: false, message: "লিংকটি ব্যবহার করা যাচ্ছে না। নতুন লিংক নিন।" };
  const ok = await consumePasswordResetToken(parsed.data.token, await hashPassword(parsed.data.password));
  return ok ? { ok: true, message: "পাসওয়ার্ড পরিবর্তন হয়েছে। এখন লগইন করুন।" } : { ok: false, message: "লিংকটি অবৈধ, ব্যবহৃত, অথবা মেয়াদোত্তীর্ণ।" };
}
