import { requireUser } from "@/lib/auth/session";
export default async function ProfileLayout({children}:{children:React.ReactNode}) { await requireUser(); return children; }
