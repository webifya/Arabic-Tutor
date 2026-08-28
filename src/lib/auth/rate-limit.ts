import "server-only";

import { createHash } from "node:crypto";
import type { RowDataPacket } from "mysql2/promise";
import { getPool } from "@/lib/db/mysql";

export function rateLimitKey(scope: string, subject: string): string {
  return `${scope}:${createHash("sha256").update(subject.trim().toLowerCase()).digest("hex")}`;
}

export async function consumeRateLimit(key: string, limit: number, windowMs: number): Promise<boolean> {
  const pool = await getPool();
  const now = new Date();
  const expires = new Date(now.getTime() + windowMs);
  await pool.execute(
    "INSERT INTO rate_limit_buckets (`key`,`count`,`window_start`,`expires_at`) VALUES (?,1,?,?) ON DUPLICATE KEY UPDATE `count`=IF(`expires_at`<=VALUES(`window_start`),1,`count`+1),`window_start`=IF(`expires_at`<=VALUES(`window_start`),VALUES(`window_start`),`window_start`),`expires_at`=IF(`expires_at`<=VALUES(`window_start`),VALUES(`expires_at`),`expires_at`)",
    [key, now, expires],
  );
  const [rows] = await pool.execute<RowDataPacket[]>("SELECT `count` FROM rate_limit_buckets WHERE `key`=? LIMIT 1", [key]);
  return Number(rows[0]?.count ?? limit + 1) <= limit;
}
