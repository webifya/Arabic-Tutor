import { z } from "zod";

export const strongPassword = z.string().min(12).max(128).regex(/[a-z]/).regex(/[A-Z]/).regex(/[0-9]/).regex(/[^A-Za-z0-9]/);
export const signupSchema = z.object({
  fullName: z.string().trim().min(2).max(191),
  email: z.string().trim().toLowerCase().email().max(191),
  password: strongPassword,
  confirmPassword: z.string(),
}).refine((value) => value.password === value.confirmPassword, { path: ["confirmPassword"], message: "Passwords do not match" });
export const forgotPasswordSchema = z.object({ email: z.string().trim().toLowerCase().email().max(191) });
export const resetPasswordSchema = z.object({ token: z.string().min(32).max(200), password: strongPassword, confirmPassword: z.string() })
  .refine((value) => value.password === value.confirmPassword, { path: ["confirmPassword"], message: "Passwords do not match" });
export function isDuplicateAccountError(error: unknown): boolean { return (error as { code?: string })?.code === "ER_DUP_ENTRY"; }
