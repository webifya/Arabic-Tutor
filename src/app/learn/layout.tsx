import { requireUser } from "@/lib/auth/session";
export default async function LearnLayout({children}:{children:React.ReactNode}){await requireUser();return children}
