import Link from "next/link";
import { SignupForm } from "../auth-form";
import { AuthPage } from "../login/page";
export default function SignupPage(){return <AuthPage title="শেখা শুরু করুন" intro="বাংলা থেকে আরবি শেখার জন্য একটি নিরাপদ অ্যাকাউন্ট তৈরি করুন।"><SignupForm/><div className="auth-links"><Link href="/login">আগে থেকেই অ্যাকাউন্ট আছে?</Link></div></AuthPage>}
