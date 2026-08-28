import Link from "next/link";
import { ResetForm } from "../auth-form";
import { AuthPage } from "../login/page";
export default async function ResetPage({searchParams}:{searchParams:Promise<{token?:string}>}){const token=(await searchParams).token||"";return <AuthPage title="নতুন পাসওয়ার্ড" intro="শক্তিশালী ও অন্য কোথাও ব্যবহার না করা পাসওয়ার্ড বেছে নিন।">{token?<ResetForm token={token}/>:<p className="form-message error">রিসেট লিংকটি অসম্পূর্ণ।</p>}<div className="auth-links"><Link href="/forgot-password">নতুন লিংক নিন</Link></div></AuthPage>}
