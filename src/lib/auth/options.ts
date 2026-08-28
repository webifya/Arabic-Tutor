import "server-only";
import CredentialsProvider from "next-auth/providers/credentials";
import type { NextAuthOptions } from "next-auth";
import { verifyPassword } from "@/lib/installer/crypto";
import { getEffectiveRuntimeConfig } from "@/lib/installer/runtime-config";
import { consumeRateLimit, rateLimitKey } from "./rate-limit";
import { findUserByEmail, findUserById } from "./user-repository";
import { isRole } from "./roles";

export async function getAuthOptions(): Promise<NextAuthOptions> {
  const runtime = await getEffectiveRuntimeConfig();
  if (!runtime?.databaseUrl || !runtime.authSecret) throw new Error("Application is not installed");
  const production = process.env.NODE_ENV === "production";
  return {
    secret: runtime.authSecret,
    session: { strategy: "jwt", maxAge: 8 * 60 * 60, updateAge: 30 * 60 },
    jwt: { maxAge: 8 * 60 * 60 },
    pages: { signIn: "/login" },
    cookies: {
      sessionToken: { name: production ? "__Secure-lisan.session-token" : "lisan.session-token", options: { httpOnly: true, sameSite: "lax", path: "/", secure: production, maxAge: 8 * 60 * 60 } },
      csrfToken: { name: production ? "__Host-lisan.csrf-token" : "lisan.csrf-token", options: { httpOnly: true, sameSite: "lax", path: "/", secure: production } },
      callbackUrl: { name: production ? "__Secure-lisan.callback-url" : "lisan.callback-url", options: { httpOnly: true, sameSite: "lax", path: "/", secure: production } },
    },
    providers: [CredentialsProvider({
      name: "Email and password",
      credentials: { email: { label: "Email", type: "email" }, password: { label: "Password", type: "password" } },
      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password;
        if (!email || !password || !(await consumeRateLimit(rateLimitKey("login", email), 10, 15 * 60_000))) return null;
        const user = await findUserByEmail(email);
        if (!user || user.status !== "active" || !isRole(user.role) || !(await verifyPassword(password, user.passwordHash))) return null;
        return { id: user.id, email: user.email, name: user.fullName, role: user.role, status: user.status, sessionVersion: user.sessionVersion };
      },
    })],
    callbacks: {
      async jwt({ token, user }) {
        if (user) { token.role = user.role; token.status = user.status; token.sessionVersion = user.sessionVersion; }
        if (!token.sub) return token;
        const current = await findUserById(token.sub);
        if (!current || current.status !== "active" || current.sessionVersion !== token.sessionVersion || !isRole(current.role)) { token.status = "invalid"; return token; }
        token.role = current.role; token.status = current.status; token.name = current.fullName; token.email = current.email;
        return token;
      },
      session({ session, token }) {
        if (session.user && token.status === "active" && token.sub && isRole(token.role)) {
          session.user.id = token.sub; session.user.role = token.role; session.user.status = "active"; session.user.sessionVersion = Number(token.sessionVersion);
        } else session.user = undefined as never;
        return session;
      },
    },
  };
}
