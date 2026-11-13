import { AppShell } from "@/components/app-shell";
import { ProgressProvider } from "@/components/progress-provider";
import { requireSession } from "@/lib/auth/current-user";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  return (
    <ProgressProvider userId={session.sub}>
      <AppShell user={{ name: session.name, username: session.username }}>{children}</AppShell>
    </ProgressProvider>
  );
}
