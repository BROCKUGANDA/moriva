import { redirect } from "next/navigation";
import { getSessionUser } from "@/domains/identity/service";
import { IndividualTopNav, IndividualBottomNav } from "@/components/navigation/shells";
import { DemoBanner } from "@/components/moriva/status";
import { getEnv } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function IndividualLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "INDIVIDUAL") {
    redirect(user.role === "OPS_ADMIN_SIMULATED" ? "/ops" : "/professional/inbox");
  }
  const demoMode = getEnv().demoMode;
  return (
    <div className="flex min-h-screen flex-col">
      <DemoBanner label={demoMode ? "DEMO ENVIRONMENT — SYNTHETIC DATA ONLY" : "PREVIEW DEPLOYMENT — SYNTHETIC SAMPLE DATA"} />
      <IndividualTopNav user={user} />
      <main id="main-content" className="moriva-container flex-1 py-6 pb-24 md:pb-10">
        {children}
      </main>
      <IndividualBottomNav />
    </div>
  );
}
