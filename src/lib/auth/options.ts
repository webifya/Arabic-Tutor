import "server-only";

import CredentialsProvider from "next-auth/providers/credentials";
import type { NextAuthOptions } from "next-auth";
import { createConnection } from "mysql2/promise";

import { verifyPassword } from "@/lib/installer/crypto";
import { getEffectiveRuntimeConfig } from "@/lib/installer/runtime-config";

export async function getAuthOptions(): Promise<NextAuthOptions> {
  const runtime = await getEffectiveRuntimeConfig();
  if (!runtime?.databaseUrl || !runtime.authSecret) throw new Error("Application is not installed");
  return {
    secret: runtime.authSecret,
    session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
    pages: { signIn: "/admin/login" },
    providers: [
      CredentialsProvider({
        name: "Administrator credentials",
        credentials: {
          email: { label: "Email", type: "email" },
          password: { label: "Password", type: "password" },
        },
        async authorize(credentials) {
          const email = credentials?.email?.trim().toLowerCase();
          const password = credentials?.password;
          if (!email || !password) return null;
          const connection = await createConnection({ uri: runtime.databaseUrl as string, connectTimeout: 5_000 });
          try {
            const [rows] = await connection.execute(
              "SELECT `id`, `email`, `full_name`, `password_hash`, `role` FROM `users` WHERE `email` = ? LIMIT 1",
              [email],
            );
            const user = (rows as { id: string; email: string; full_name: string; password_hash: string; role: string }[])[0];
            if (!user || !(await verifyPassword(password, user.password_hash))) return null;
            if (user.role !== "admin" && user.role !== "super_admin") return null;
            return { id: user.id, email: user.email, name: user.full_name, role: user.role };
          } finally {
            await connection.end();
          }
        },
      }),
    ],
    callbacks: {
      jwt({ token, user }) {
        if (user?.role) token.role = user.role;
        return token;
      },
      session({ session, token }) {
        if (session.user) {
          session.user.id = token.sub ?? "";
          session.user.role = token.role;
        }
        return session;
      },
    },
  };
}
