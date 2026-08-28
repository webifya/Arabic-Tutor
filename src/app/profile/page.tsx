import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { getLearnerProfile,listEnabledLanguages } from "@/server/learner/service";
import { getMessages } from "@/i18n";
import { ProfileForm } from "@/components/learner/profile-form";
export default async function ProfilePage(){const user=await requireRole(["student"]);const profile=await getLearnerProfile(user.id);if(!profile)redirect("/login");const messages=getMessages(profile.interfaceLocale).learner;return <main className="form-page"><header><p className="eyebrow">{messages.profile.eyebrow}</p><h1>{messages.profile.title}</h1><p>{messages.profile.subtitle}</p></header><ProfileForm profile={profile} languages={await listEnabledLanguages()} messages={messages.profile} goalLabels={messages.onboarding.goals}/></main>}
