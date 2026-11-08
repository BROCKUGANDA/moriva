import { SectionHeading } from "@/components/moriva/status";
import { ProviderSearch } from "@/components/moriva/provider-search";

export const metadata = { title: "Find providers" };
export const dynamic = "force-dynamic";

export default function AppProvidersPage() {
  return (
    <div>
      <SectionHeading
        title="Providers & services"
        description="Every listing shows its verification status and when it was last checked. Expired, suspended or pending listings cannot receive referrals — we hide them rather than guess."
        level={1}
      />
      <ProviderSearch />
    </div>
  );
}
