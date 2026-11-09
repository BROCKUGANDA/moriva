import { redirect } from "next/navigation";
import { getSessionUser } from "@/domains/identity/service";
import { OpsNav } from "@/components/navigation/ops-nav";
import { DemoBanner } from "@/components/moriva/status";
import { getEnv } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function OpsLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!["OPS_ADMIN_SIMULATED", "CLINICAL_GOVERNANCE_SIMULATED"].includes(user.role)) {
    redirect(user.role === "INDIVIDUAL" ? "/app" : "/professional/inbox");
  }
  const demoMode = getEnv().demoMode;
  return (
    <div className="flex min-h-screen flex-col bg-[#F3F6F4]">
      <DemoBanner label={demoMode ? "DEMO ENVIRONMENT — SYNTHETIC DATA ONLY" : "PREVIEW DEPLOYMENT — SYNTHETIC SAMPLE DATA"} />
      <OpsNav displayName={user.displayName} />
      <main id="main-content" className="moriva-container flex-1 py-6">{children}</main>
      <footer className="border-t border-moriva-line bg-white py-4 text-center text-xs text-moriva-slate">
        Operations & governance — aggregate views only. Journal content and unshared assessment answers are not
        accessible from this workspace.
      </footer>
    </div>
  );
}
