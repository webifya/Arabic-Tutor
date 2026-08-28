import { requireUser } from "@/lib/auth/session";
export default async function ProfilePage(){const user=await requireUser();return <main className="page-shell"><section className="foundation-card"><p className="eyebrow">প্রোফাইল</p><h1>{user.name}</h1><p className="description">{user.email}</p></section></main>}
