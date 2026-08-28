import { connection } from "next/server";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { getAuthOptions } from "@/lib/auth/options";
import { isInstalled } from "@/lib/installer/status";

export default async function AdminPage() {
  await connection();
  if (!(await isInstalled())) redirect("/install");
  const session = await getServerSession(await getAuthOptions());
  if (!session?.user || !["admin", "super_admin"].includes(session.user.role ?? "")) redirect("/admin/login");
  return <main className="page-shell"><section className="foundation-card"><p className="eyebrow">Lisan administration</p><h1>Installation is ready</h1><p className="description">Signed in as {session.user.email}. Product administration will be added in its planned phase.</p></section></main>;
}
