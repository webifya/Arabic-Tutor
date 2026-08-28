import Link from "next/link";
import { ForgotForm } from "../auth-form";
import { AuthPage } from "../login/page";
export default function ForgotPage(){return <AuthPage title="পাসওয়ার্ড ফিরিয়ে নিন" intro="আপনার ইমেইল দিন। অ্যাকাউন্ট থাকলে নিরাপদ রিসেট নির্দেশনা পাঠানো হবে।"><ForgotForm/><div className="auth-links"><Link href="/login">লগইনে ফিরুন</Link></div></AuthPage>}
