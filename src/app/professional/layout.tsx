import { redirect } from "next/navigation";
import { getSessionUser } from "@/domains/identity/service";
import { ProfessionalNav } from "@/components/navigation/professional-nav";
import { DemoBanner, SimulationBanner } from "@/components/moriva/status";

export const dynamic = "force-dynamic";

export default async function ProfessionalLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!["PROFESSIONAL_SIMULATED", "PROVIDER_COORDINATOR_SIMULATED", "CLINICAL_GOVERNANCE_SIMULATED"].includes(user.role)) {
    redirect(user.role === "OPS_ADMIN_SIMULATED" ? "/ops" : "/app");
  }
  return (
    <div className="flex min-h-screen flex-col bg-[#F3F6F4]">
      <DemoBanner />
      <ProfessionalNav displayName={user.displayName} />
      <div className="moriva-container flex-1 py-6">
        <SimulationBanner className="mb-4" />
        {children}
      </div>
      <footer className="border-t border-moriva-line bg-white py-4 text-center text-xs text-moriva-slate">
        Simulated professional workspace — no licensed professional is acting on this data. All actions are recorded as
        SIMULATED evidence.
      </footer>
    </div>
  );
}
