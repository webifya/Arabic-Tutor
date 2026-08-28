"use client";

import { FormEvent, useEffect, useState, useTransition } from "react";
import Link from "next/link";

import {
  completeInstallation,
  getSafeSummary,
  saveAdministrator,
  saveApplication,
  saveVoice,
  selectAiModel,
  skipAi,
  startInstaller,
  testAndSaveAi,
  testAndSaveDatabase,
} from "./actions";
import type { InstallerReadiness } from "@/lib/installer/status";

const steps = ["Welcome", "Database", "Application", "Administrator", "AI", "Voice", "Install", "Complete"];

export function InstallerWizard({ defaultSiteUrl }: { defaultSiteUrl: string }) {
  const [step, setStep] = useState(0);
  const [message, setMessage] = useState("");
  const [readiness, setReadiness] = useState<InstallerReadiness | null>(null);
  const [summary, setSummary] = useState<Record<string, string | boolean>>({});
  const [pending, startTransition] = useTransition();
  const [database, setDatabase] = useState({ host: "localhost", port: "3306", database: "", username: "", password: "" });
  const [application, setApplication] = useState({
    siteName: "Lisan",
    tagline: "আরবি শিখুন সহজভাবে",
    siteUrl: defaultSiteUrl,
    defaultLocale: "bn",
    defaultTimezone: "Asia/Dhaka",
    adminEmail: "",
  });
  const [administrator, setAdministrator] = useState({ fullName: "", email: "", password: "", confirmPassword: "" });
  const [ai, setAi] = useState({ provider: "openai", displayName: "OpenAI", apiKey: "", baseUrl: "", modelId: "" });
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [aiSupportsTts, setAiSupportsTts] = useState(false);
  const [voice, setVoice] = useState("");

  useEffect(() => {
    startTransition(async () => {
      const result = await startInstaller();
      if (result.ok) setReadiness(result.data);
      else setMessage(result.message);
    });
  }, []);

  function run(action: () => Promise<{ ok: boolean; message?: string }>, onSuccess: () => void) {
    setMessage("");
    startTransition(async () => {
      const result = await action();
      if (result.ok) onSuccess();
      else setMessage(result.message ?? "The request could not be completed.");
    });
  }

  function submitDatabase(event: FormEvent) {
    event.preventDefault();
    run(
      async () => {
        const result = await testAndSaveDatabase(database);
        if (result.ok) setDatabase((current) => ({ ...current, password: "" }));
        return result;
      },
      () => setStep(2),
    );
  }

  function submitApplication(event: FormEvent) {
    event.preventDefault();
    run(() => saveApplication(application), () => {
      setAdministrator((current) => ({ ...current, email: application.adminEmail }));
      setStep(3);
    });
  }

  function submitAdministrator(event: FormEvent) {
    event.preventDefault();
    run(
      async () => {
        const result = await saveAdministrator(administrator);
        if (result.ok) setAdministrator((current) => ({ ...current, password: "", confirmPassword: "" }));
        return result;
      },
      () => setStep(4),
    );
  }

  function submitAi(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    startTransition(async () => {
      const result = await testAndSaveAi(ai);
      setAi((current) => ({ ...current, apiKey: "" }));
      if (!result.ok) return setMessage(result.message);
      setAiSupportsTts(["openai", "gemini"].includes(ai.provider));
      setAvailableModels(result.data.models);
      if (result.data.models.length > 0) {
        setAi((current) => ({ ...current, modelId: current.modelId || result.data.models[0] || "" }));
      } else {
        setStep(5);
      }
    });
  }

  function loadSummary() {
    run(
      async () => {
        const result = await getSafeSummary();
        if (result.ok) setSummary(result.data);
        return result;
      },
      () => setStep(6),
    );
  }

  return (
    <main className="installer-shell">
      <section className="installer-panel">
        <header className="installer-header">
          <div className="installer-logo" lang="ar" dir="rtl">لسان</div>
          <div><p className="eyebrow">Lisan first-run setup</p><h1>{steps[step]}</h1></div>
        </header>
        <ol className="installer-progress" aria-label="Installation progress">
          {steps.map((label, index) => <li key={label} className={index <= step ? "active" : ""}>{index + 1}<span>{label}</span></li>)}
        </ol>

        {message && <div className="installer-error" role="alert">{message}</div>}

        {step === 0 && <div className="installer-step">
          <p>This secure wizard prepares a fresh cPanel installation without requiring database environment variables first.</p>
          <div className="readiness-grid">
            <Status label="Compatible Node.js" value={readiness?.nodeCompatible} />
            <Status label="Private config writable" value={readiness?.runtimeWritable} />
            <Status label="Storage available" value={readiness?.storageWritable} />
            <Status label="Prisma migration runner" value={readiness?.prismaAvailable} />
            <Status label="MySQL/MariaDB driver" value={readiness?.databaseDriverAvailable} />
            <Status label="Secure bootstrap configuration" value={readiness?.bootstrapSecretsAvailable} />
          </div>
          <button disabled={pending || !readiness || !readiness.nodeCompatible || !readiness.runtimeWritable || !readiness.storageWritable || !readiness.prismaAvailable || !readiness.databaseDriverAvailable || !readiness.bootstrapSecretsAvailable} onClick={() => setStep(1)}>Continue</button>
        </div>}

        {step === 1 && <form className="installer-step" onSubmit={submitDatabase}>
          <p>Create the MySQL database and user in cPanel first. The password is never returned after this test.</p>
          <Field label="Database host"><input required value={database.host} onChange={(e) => setDatabase({ ...database, host: e.target.value })} /></Field>
          <Field label="Database port"><input required inputMode="numeric" value={database.port} onChange={(e) => setDatabase({ ...database, port: e.target.value })} /></Field>
          <Field label="Database name"><input required value={database.database} onChange={(e) => setDatabase({ ...database, database: e.target.value })} /></Field>
          <Field label="Database username"><input required autoComplete="username" value={database.username} onChange={(e) => setDatabase({ ...database, username: e.target.value })} /></Field>
          <Field label="Database password"><input type="password" autoComplete="new-password" value={database.password} onChange={(e) => setDatabase({ ...database, password: e.target.value })} /></Field>
          <button disabled={pending}>{pending ? "Testing…" : "Test database and continue"}</button>
        </form>}

        {step === 2 && <form className="installer-step" onSubmit={submitApplication}>
          <Field label="Site name"><input required value={application.siteName} onChange={(e) => setApplication({ ...application, siteName: e.target.value })} /></Field>
          <Field label="Tagline"><input required value={application.tagline} onChange={(e) => setApplication({ ...application, tagline: e.target.value })} /></Field>
          <Field label="Site URL"><input required type="url" value={application.siteUrl} onChange={(e) => setApplication({ ...application, siteUrl: e.target.value })} /></Field>
          <Field label="Default language"><select value={application.defaultLocale} onChange={(e) => setApplication({ ...application, defaultLocale: e.target.value })}><option value="bn">বাংলা</option><option value="en">English</option></select></Field>
          <Field label="Default timezone"><input required value={application.defaultTimezone} onChange={(e) => setApplication({ ...application, defaultTimezone: e.target.value })} /></Field>
          <Field label="Admin email"><input required type="email" value={application.adminEmail} onChange={(e) => setApplication({ ...application, adminEmail: e.target.value })} /></Field>
          <button disabled={pending}>Save and continue</button>
        </form>}

        {step === 3 && <form className="installer-step" onSubmit={submitAdministrator}>
          <p>Use at least 12 characters with uppercase, lowercase, number, and symbol.</p>
          <Field label="Full name"><input required value={administrator.fullName} onChange={(e) => setAdministrator({ ...administrator, fullName: e.target.value })} /></Field>
          <Field label="Email"><input required type="email" autoComplete="username" value={administrator.email} onChange={(e) => setAdministrator({ ...administrator, email: e.target.value })} /></Field>
          <Field label="Password"><input required type="password" minLength={12} autoComplete="new-password" value={administrator.password} onChange={(e) => setAdministrator({ ...administrator, password: e.target.value })} /></Field>
          <Field label="Confirm password"><input required type="password" minLength={12} autoComplete="new-password" value={administrator.confirmPassword} onChange={(e) => setAdministrator({ ...administrator, confirmPassword: e.target.value })} /></Field>
          <button disabled={pending}>Create administrator draft</button>
        </form>}

        {step === 4 && availableModels.length === 0 && <form className="installer-step" onSubmit={submitAi}>
          <p>Optional. The API key is tested server-side and encrypted immediately.</p>
          <Field label="Provider"><select value={ai.provider} onChange={(e) => setAi({ ...ai, provider: e.target.value, displayName: e.target.options[e.target.selectedIndex].text })}><option value="openai">OpenAI</option><option value="gemini">Google Gemini</option><option value="anthropic">Anthropic Claude</option><option value="openai_compatible">OpenAI-compatible</option></select></Field>
          {ai.provider === "openai_compatible" && <Field label="HTTPS base URL"><input required type="url" value={ai.baseUrl} onChange={(e) => setAi({ ...ai, baseUrl: e.target.value })} /></Field>}
          <Field label="API key"><input required type="password" autoComplete="off" value={ai.apiKey} onChange={(e) => setAi({ ...ai, apiKey: e.target.value })} /></Field>
          <Field label="Preferred model (optional)"><input value={ai.modelId} onChange={(e) => setAi({ ...ai, modelId: e.target.value })} /></Field>
          <div className="button-row"><button disabled={pending}>Test provider and continue</button><button type="button" className="secondary" onClick={() => run(skipAi, () => { setAiSupportsTts(false); setStep(5); })}>Skip AI</button></div>
        </form>}

        {step === 4 && availableModels.length > 0 && <div className="installer-step">
          <p>Connection successful. Select the initial model. This can be changed later in Admin.</p>
          <Field label="Available model"><select value={ai.modelId} onChange={(event) => setAi({ ...ai, modelId: event.target.value })}>{availableModels.map((model) => <option key={model} value={model}>{model}</option>)}</select></Field>
          <button disabled={pending || !ai.modelId} onClick={() => run(() => selectAiModel(ai.modelId), () => setStep(5))}>Use selected model</button>
        </div>}

        {step === 5 && <div className="installer-step">
          <p>{aiSupportsTts ? "Optional voice preset. Provider voice IDs can be configured later in Admin." : "No installer-supported TTS provider is configured. Voice setup can be completed later in Admin."}</p>
          {aiSupportsTts && <div className="choice-grid">{[
            ["adult_arabic_teacher", "Adult Arabic Teacher"], ["child_friendly", "Child Friendly"],
            ["slow_pronunciation", "Slow Pronunciation"], ["conversation_tutor", "Conversation Tutor"],
          ].map(([value, label]) => <label key={value} className={voice === value ? "choice selected" : "choice"}><input type="radio" name="voice" value={value} checked={voice === value} onChange={() => setVoice(value)} />{label}</label>)}</div>}
          <div className="button-row">{aiSupportsTts && <button disabled={pending || !voice} onClick={() => run(() => saveVoice(voice), loadSummary)}>Save voice</button>}<button className="secondary" onClick={() => run(() => saveVoice(null), loadSummary)}>{aiSupportsTts ? "Skip voice" : "Continue"}</button></div>
        </div>}

        {step === 6 && <div className="installer-step">
          <p>Review the safe summary. Passwords, API credentials, and generated secrets are never shown.</p>
          <dl className="summary-list">{Object.entries(summary).map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{String(value)}</dd></div>)}</dl>
          <button disabled={pending} onClick={() => run(completeInstallation, () => setStep(7))}>{pending ? "Installing…" : "Install Lisan"}</button>
        </div>}

        {step === 7 && <div className="installer-step complete-step"><div className="success-mark">✓</div><h2>Installation completed successfully.</h2><p>The installer is now locked. Sign in with the super-admin account you created.</p><div className="button-row"><Link className="button-link" href="/admin">Go to Admin Dashboard</Link><Link className="button-link secondary" href="/">Go to Student Site</Link></div></div>}
      </section>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="installer-field"><span>{label}</span>{children}</label>;
}

function Status({ label, value }: { label: string; value?: boolean }) {
  return <div className="readiness-item"><span>{value === undefined ? "…" : value ? "✓" : "×"}</span>{label}</div>;
}
