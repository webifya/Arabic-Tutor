import { requireUser } from "@/lib/auth/session";
export default async function SettingsPage(){await requireUser();return <main className="page-shell"><section className="foundation-card"><p className="eyebrow">সেটিংস</p><h1>অ্যাকাউন্ট সেটিংস</h1><p className="description">নিরাপদ অ্যাকাউন্ট ও শেখার পছন্দ পরিচালনার ভিত্তি প্রস্তুত।</p></section></main>}
