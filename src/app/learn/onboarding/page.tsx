import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { getLearnerProfile } from "@/server/learner/service";
import { getMessages } from "@/i18n";
import { OnboardingWizard } from "@/components/learner/onboarding-wizard";
export default async function OnboardingPage(){const user=await requireRole(["student"]);const profile=await getLearnerProfile(user.id);if(!profile)redirect("/login");if(profile.onboardingState==="completed")redirect("/learn");return <OnboardingWizard messages={getMessages(profile.interfaceLocale).learner.onboarding}/>}
