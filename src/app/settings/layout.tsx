import { requireUser } from "@/lib/auth/session";
export default async function SettingsLayout({children}:{children:React.ReactNode}) { await requireUser(); return children; }
