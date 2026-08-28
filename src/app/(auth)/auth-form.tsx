"use client";

import { FormEvent, useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { forgotPasswordAction, resetPasswordAction, signupAction, type AuthActionResult } from "./actions";

export function LoginForm({destination="/learn"}:{destination?:string}) {
  const router = useRouter(); const [error,setError]=useState(""); const [pending,start]=useTransition();
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const data=new FormData(event.currentTarget); setError(""); start(async()=>{ const result=await signIn("credentials",{email:data.get("email"),password:data.get("password"),redirect:false}); if(!result?.ok)setError("ইমেইল অথবা পাসওয়ার্ড সঠিক নয়।"); else { router.push(destination); router.refresh(); } }); }
  return <form className="auth-form" onSubmit={submit}>{error&&<p className="form-message error" role="alert">{error}</p>}<Field label="ইমেইল" name="email" type="email" autoComplete="email"/><Field label="পাসওয়ার্ড" name="password" type="password" autoComplete="current-password"/><button disabled={pending}>{pending?"লগইন হচ্ছে…":"লগইন"}</button></form>;
}

export function SignupForm() {
  const router=useRouter(); const [result,setResult]=useState<AuthActionResult>(); const [pending,start]=useTransition();
  function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();const form=event.currentTarget;const data=new FormData(form);start(async()=>{const input={fullName:data.get("fullName"),email:data.get("email"),password:data.get("password"),confirmPassword:data.get("confirmPassword")};const next=await signupAction(input);setResult(next);if(next.ok){await signIn("credentials",{email:input.email,password:input.password,redirect:false});router.push("/learn/onboarding");router.refresh();}})}
  return <form className="auth-form" onSubmit={submit}>{result&&<p className={`form-message ${result.ok?"success":"error"}`} role="alert">{result.message}</p>}<Field label="পুরো নাম" name="fullName" autoComplete="name"/><Field label="ইমেইল" name="email" type="email" autoComplete="email"/><Field label="পাসওয়ার্ড" name="password" type="password" autoComplete="new-password"/><Field label="পাসওয়ার্ড আবার লিখুন" name="confirmPassword" type="password" autoComplete="new-password"/><button disabled={pending}>{pending?"তৈরি হচ্ছে…":"অ্যাকাউন্ট তৈরি করুন"}</button></form>;
}

export function ForgotForm(){const[result,setResult]=useState<AuthActionResult>();const[pending,start]=useTransition();function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();const data=new FormData(event.currentTarget);start(async()=>setResult(await forgotPasswordAction({email:data.get("email")})))}return <form className="auth-form" onSubmit={submit}>{result&&<p className="form-message success" role="status">{result.message}</p>}<Field label="ইমেইল" name="email" type="email" autoComplete="email"/><button disabled={pending}>{pending?"পাঠানো হচ্ছে…":"রিসেট লিংক চান"}</button></form>}
export function ResetForm({token}:{token:string}){const[result,setResult]=useState<AuthActionResult>();const[pending,start]=useTransition();function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();const data=new FormData(event.currentTarget);start(async()=>setResult(await resetPasswordAction({token,password:data.get("password"),confirmPassword:data.get("confirmPassword")})))}return <form className="auth-form" onSubmit={submit}>{result&&<p className={`form-message ${result.ok?"success":"error"}`} role="alert">{result.message}</p>}<Field label="নতুন পাসওয়ার্ড" name="password" type="password" autoComplete="new-password"/><Field label="পাসওয়ার্ড আবার লিখুন" name="confirmPassword" type="password" autoComplete="new-password"/><button disabled={pending}>{pending?"পরিবর্তন হচ্ছে…":"পাসওয়ার্ড পরিবর্তন করুন"}</button></form>}
function Field({label,name,type="text",autoComplete}:{label:string;name:string;type?:string;autoComplete?:string}){return <label><span>{label}</span><input required name={name} type={type} autoComplete={autoComplete}/></label>}
