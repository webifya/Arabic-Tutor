import { connection } from "next/server";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { isInstalled } from "@/lib/installer/status";

export default async function AuthLayout({children}:{children:React.ReactNode}) {
  await connection();
  if (!(await isInstalled())) redirect("/install");
  if ((await getSession())?.user) redirect("/learn");
  return children;
}
