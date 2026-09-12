import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getStats } from "@/lib/services/items.service";
import { AppShell } from "@/components/layout/AppShell";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  let stats;
  try {
    stats = await getStats(session.id);
  } catch (err) {
    console.error("Failed to fetch initial stats:", err);
  }

  return (
    <AppShell user={session} initialStats={stats}>
      {children}
    </AppShell>
  );
}
