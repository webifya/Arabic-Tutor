import "server-only";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { getAuthOptions } from "./options";
import { isInstalled } from "@/lib/installer/status";
import type { Role } from "./roles";
import { hasRole, isAdminRole, isRole } from "./roles";

export async function getSession() { return getServerSession(await getAuthOptions()); }
export async function requireSession() { if (!(await isInstalled())) redirect("/install"); const session = await getSession(); if (!session?.user) redirect("/login"); return session; }
export async function requireUser() { return (await requireSession()).user; }
export async function requireRole(allowed: readonly Role[]) { const user = await requireUser(); if (!isRole(user.role) || !hasRole(user.role, allowed)) redirect("/learn"); return user; }
export async function requireAdmin() { if (!(await isInstalled())) redirect("/install"); const session = await getSession(); if (!session?.user) redirect("/login?next=/admin"); const user=session.user; if (!isRole(user.role) || !isAdminRole(user.role)) redirect("/learn"); return user; }
export async function requireSuperAdmin() { return requireRole(["super_admin"]); }
