import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { getLearnerProfile } from "@/server/learner/service";
import { getMessages } from "@/i18n";
import { LearnerShell } from "./learner-shell";
export async function ProtectedLearnerShell({children}:{children:React.ReactNode}){const user=await requireRole(["student"]);const profile=await getLearnerProfile(user.id);if(!profile)redirect("/login");if(profile.onboardingState!=="completed")redirect("/learn/onboarding");return <LearnerShell messages={getMessages(profile.interfaceLocale).learner} mode={profile.studentMode} name={profile.displayName||profile.fullName}>{children}</LearnerShell>}
