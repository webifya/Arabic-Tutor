import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { LogoutButton } from "@/components/auth/logout-button";
export default async function LearnPage(){const user=await requireUser();return <main className="page-shell"><section className="foundation-card"><p className="eyebrow">আপনার শেখার জায়গা</p><h1>আসসালামু আলাইকুম, {user.name}</h1><p className="description">Arabic Foundation for Bangla Speakers কোর্সটি প্রস্তুত হচ্ছে। এখন আপনার শেখার পছন্দগুলো ঠিক করুন।</p><div className="landing-actions"><Link className="button-link" href="/learn/onboarding">অনবোর্ডিং</Link><Link href="/profile">প্রোফাইল</Link><LogoutButton/></div></section></main>}
