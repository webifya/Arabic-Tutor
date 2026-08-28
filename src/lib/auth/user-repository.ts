import "server-only";

import { randomBytes } from "node:crypto";
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { getPool, withTransaction } from "@/lib/db/mysql";
import type { Role } from "./roles";

export type AuthUser = {
  id: string; email: string; fullName: string; passwordHash: string; role: Role;
  status: string; sessionVersion: number; onboardingState: string;
};

const id = () => randomBytes(16).toString("hex");

export async function findUserByEmail(email: string): Promise<AuthUser | null> {
  const [rows] = await (await getPool()).execute<RowDataPacket[]>(
    "SELECT id,email,full_name AS fullName,password_hash AS passwordHash,role,status,session_version AS sessionVersion,onboarding_state AS onboardingState FROM users WHERE email=? LIMIT 1",
    [email],
  );
  return (rows[0] as AuthUser | undefined) ?? null;
}

export async function findUserById(userId: string): Promise<AuthUser | null> {
  const [rows] = await (await getPool()).execute<RowDataPacket[]>(
    "SELECT id,email,full_name AS fullName,password_hash AS passwordHash,role,status,session_version AS sessionVersion,onboarding_state AS onboardingState FROM users WHERE id=? LIMIT 1",
    [userId],
  );
  return (rows[0] as AuthUser | undefined) ?? null;
}

export async function createStudent(input: { fullName: string; email: string; passwordHash: string }): Promise<{ id: string }> {
  return withTransaction(async (connection) => {
    const [languages] = await connection.query<RowDataPacket[]>("SELECT id,code FROM languages WHERE code IN ('bn','ar')");
    const byCode = new Map(languages.map((row) => [String(row.code), String(row.id)]));
    if (!byCode.get("bn") || !byCode.get("ar")) throw new Error("CORE_LANGUAGES_MISSING");
    const userId = id();
    await connection.execute(
      "INSERT INTO users (id,email,full_name,password_hash,role,status,native_language_id,learning_language_id,country,timezone,daily_goal_minutes,student_mode,onboarding_state) VALUES (?,?,?,?, 'student','active',?,?, 'BD','Asia/Dhaka',10,'standard','not_started')",
      [userId, input.email, input.fullName, input.passwordHash, byCode.get("bn"), byCode.get("ar")],
    );
    const [courses] = await connection.query<RowDataPacket[]>("SELECT id FROM courses WHERE slug='arabic-foundation-bn' LIMIT 1");
    if (courses[0]) {
      await connection.execute("INSERT IGNORE INTO course_enrollments (id,user_id,course_id,status) VALUES (?,?,?,'active')", [id(), userId, courses[0].id]);
    }
    return { id: userId };
  });
}

export async function updatePassword(userId: string, passwordHash: string): Promise<void> {
  const [result] = await (await getPool()).execute<ResultSetHeader>(
    "UPDATE users SET password_hash=?,session_version=session_version+1 WHERE id=? AND status='active'",
    [passwordHash, userId],
  );
  if (result.affectedRows !== 1) throw new Error("PASSWORD_UPDATE_FAILED");
}

export { id as createId };
