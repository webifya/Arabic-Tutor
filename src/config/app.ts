import { z } from "zod";

const publicConfigSchema = z.object({
  appName: z.string().min(1),
  tagline: z.string().min(1),
  defaultLocale: z.enum(["bn", "en"]),
  primaryColor: z.string().regex(/^#[0-9a-f]{6}$/i),
  secondaryColor: z.string().regex(/^#[0-9a-f]{6}$/i),
});

export const appConfig = publicConfigSchema.parse({
  appName: process.env.NEXT_PUBLIC_APP_NAME ?? "Lisan",
  tagline: process.env.NEXT_PUBLIC_APP_TAGLINE ?? "আরবি শিখুন সহজভাবে",
  defaultLocale: process.env.NEXT_PUBLIC_DEFAULT_LOCALE ?? "bn",
  primaryColor: "#176b5b",
  secondaryColor: "#dba83f",
});

export type AppConfig = z.infer<typeof publicConfigSchema>;
