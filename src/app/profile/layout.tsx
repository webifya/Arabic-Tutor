import { ProtectedLearnerShell } from "@/components/learner/protected-learner-shell";
export const dynamic="force-dynamic";
export default function ProfileLayout({children}:{children:React.ReactNode}){return <ProtectedLearnerShell>{children}</ProtectedLearnerShell>}
