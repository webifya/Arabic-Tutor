import { connection } from "next/server";
import { redirect } from "next/navigation";

import { AdminLoginForm } from "./form";
import { isInstalled } from "@/lib/installer/status";

export default async function AdminLoginPage() {
  await connection();
  if (!(await isInstalled())) redirect("/install");
  return <AdminLoginForm />;
}
