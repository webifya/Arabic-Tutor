"use client";

import { FormEvent, useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export function AdminLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    startTransition(async () => {
      const result = await signIn("credentials", { email, password, redirect: false });
      setPassword("");
      if (!result?.ok) setError("The email or password is incorrect.");
      else router.push("/admin");
    });
  }

  return <main className="installer-shell"><section className="installer-panel admin-login-panel">
    <header className="installer-header"><div className="installer-logo" lang="ar" dir="rtl">لسان</div><div><p className="eyebrow">Lisan administration</p><h1>Sign in</h1></div></header>
    <form className="installer-step" onSubmit={submit}>
      {error && <div className="installer-error" role="alert">{error}</div>}
      <label className="installer-field"><span>Email</span><input required type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
      <label className="installer-field"><span>Password</span><input required type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} /></label>
      <button disabled={pending}>{pending ? "Signing in…" : "Sign in"}</button>
    </form>
  </section></main>;
}
