import { ProtectedLearnerShell } from "@/components/learner/protected-learner-shell";
export const dynamic="force-dynamic";
export default function SettingsLayout({children}:{children:React.ReactNode}){return <ProtectedLearnerShell>{children}</ProtectedLearnerShell>}
