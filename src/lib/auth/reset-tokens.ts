import "server-only";

import { createHash, randomBytes } from "node:crypto";
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { getPool, withTransaction } from "@/lib/db/mysql";
import { createId } from "./user-repository";

export const RESET_TOKEN_TTL_MS = 30 * 60_000;
export const hashResetToken = (token: string) => createHash("sha256").update(token).digest("hex");

export async function createPasswordResetToken(userId: string): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  const pool = await getPool();
  await pool.execute("UPDATE password_reset_tokens SET used_at=NOW(3) WHERE user_id=? AND used_at IS NULL", [userId]);
  await pool.execute(
    "INSERT INTO password_reset_tokens (id,user_id,token_hash,expires_at) VALUES (?,?,?,?)",
    [createId(), userId, hashResetToken(token), new Date(Date.now() + RESET_TOKEN_TTL_MS)],
  );
  return token;
}

export async function consumePasswordResetToken(token: string, passwordHash: string): Promise<boolean> {
  const tokenHash = hashResetToken(token);
  return withTransaction(async (connection) => {
    const [rows] = await connection.execute<RowDataPacket[]>(
      "SELECT id,user_id AS userId FROM password_reset_tokens WHERE token_hash=? AND used_at IS NULL AND expires_at>NOW(3) FOR UPDATE",
      [tokenHash],
    );
    const match = rows[0] as { id: string; userId: string } | undefined;
    if (!match) return false;
    const [updated] = await connection.execute<ResultSetHeader>("UPDATE users SET password_hash=?,session_version=session_version+1 WHERE id=? AND status='active'", [passwordHash, match.userId]);
    if (updated.affectedRows !== 1) return false;
    await connection.execute("UPDATE password_reset_tokens SET used_at=NOW(3) WHERE id=?", [match.id]);
    return true;
  });
}
