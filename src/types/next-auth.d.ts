import type { DefaultSession, DefaultUser } from "next-auth";
import type { Role } from "@/lib/auth/roles";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & { id: string; role: Role; status: string; sessionVersion: number };
  }

  interface User extends DefaultUser {
    role?: Role;
    status?: string;
    sessionVersion?: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: Role;
    status?: string;
    sessionVersion?: number;
  }
}
