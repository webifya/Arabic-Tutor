import "server-only";

import type { RowDataPacket } from "mysql2/promise";
import { getPool } from "@/lib/db/mysql";

export type ApplicationSettings = {
  appName: string; tagline: string; defaultLocale: "bn" | "en"; timezone: string; installationCompleted: boolean;
};
let cache: { expiresAt: number; value: ApplicationSettings } | undefined;
const keys = ["app.name", "app.tagline", "app.default_locale", "app.default_timezone", "installation.completed"];

export function parseApplicationSettings(entries: Iterable<readonly [string, unknown]>): ApplicationSettings {
  const values = new Map(entries);
  return {
    appName: String(values.get("app.name") ?? "Lisan"), tagline: String(values.get("app.tagline") ?? "আরবি শিখুন সহজভাবে"),
    defaultLocale: values.get("app.default_locale") === "en" ? "en" : "bn",
    timezone: String(values.get("app.default_timezone") ?? "Asia/Dhaka"),
    installationCompleted: values.get("installation.completed") === true || values.get("installation.completed") === 1,
  };
}

export async function getApplicationSettings(): Promise<ApplicationSettings> {
  if (cache && cache.expiresAt > Date.now()) return cache.value;
  const [rows] = await (await getPool()).query<RowDataPacket[]>("SELECT `key`,`value` FROM app_settings WHERE `key` IN (?)", [keys]);
  const value = parseApplicationSettings(rows.map((row) => [String(row.key), row.value] as const));
  cache = { value, expiresAt: Date.now() + 30_000 };
  return value;
}

export function clearSettingsCache(): void { cache = undefined; }
