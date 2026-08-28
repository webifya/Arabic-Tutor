import { connection } from "next/server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

import { InstallerWizard } from "./wizard";
import { getInstallationState } from "@/lib/installer/status";

export default async function InstallPage() {
  await connection();
  if ((await getInstallationState()) === "completed") redirect("/admin/login");
  const headerStore = await headers();
  const protocol = headerStore.get("x-forwarded-proto")?.split(",")[0] ?? (process.env.NODE_ENV === "production" ? "https" : "http");
  const host = headerStore.get("x-forwarded-host")?.split(",")[0] ?? headerStore.get("host") ?? "localhost:3000";
  return <InstallerWizard defaultSiteUrl={`${protocol}://${host}`} />;
}
