import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { getLearnerProfile } from "@/server/learner/service";
import { getMessages } from "@/i18n";
import { SettingsForm } from "@/components/learner/settings-form";
export default async function SettingsPage(){const user=await requireRole(["student"]);const profile=await getLearnerProfile(user.id);if(!profile)redirect("/login");const messages=getMessages(profile.interfaceLocale).learner;return <main className="form-page"><header><p className="eyebrow">{messages.settings.eyebrow}</p><h1>{messages.settings.title}</h1><p>{messages.settings.subtitle}</p></header><SettingsForm profile={profile} messages={messages.settings} modeLabels={messages.onboarding.modes}/></main>}
