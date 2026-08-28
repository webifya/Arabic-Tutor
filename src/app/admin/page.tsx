import { connection } from "next/server";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { isInstalled } from "@/lib/installer/status";

export default async function AdminPage() {
  await connection();
  if (!(await isInstalled())) redirect("/install");
  const user = await requireAdmin();
  return <main className="page-shell"><section className="foundation-card"><p className="eyebrow">Lisan administration</p><h1>অ্যাডমিন ভিত্তি প্রস্তুত</h1><p className="description">{user.email} হিসেবে নিরাপদ server-side authorization যাচাই হয়েছে। পূর্ণ প্রশাসন পরবর্তী ধাপে যোগ হবে।</p></section></main>;
}
