import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { getLearnerProfile } from "@/server/learner/service";
import { getMessages } from "@/i18n";
import { LearnerShell } from "@/components/learner/learner-shell";
export const dynamic="force-dynamic";
export default async function LearnLayout({children}:{children:React.ReactNode}){const user=await requireRole(["student"]);const profile=await getLearnerProfile(user.id);if(!profile)redirect("/login");return <LearnerShell messages={getMessages(profile.interfaceLocale).learner} mode={profile.studentMode} name={profile.displayName||profile.fullName}>{children}</LearnerShell>}
