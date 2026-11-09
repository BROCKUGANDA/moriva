import { redirect } from "next/navigation";
import { getSessionUser } from "@/domains/identity/service";
import { SectionHeading, InlineNotice } from "@/components/moriva/status";
import { HealthContextClient } from "@/components/moriva/health-context-client";

export const metadata = { title: "Health context" };
export const dynamic = "force-dynamic";

export default async function HealthContextPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return (
    <div className="mx-auto max-w-2xl">
      <SectionHeading
        title="Health context"
        description="A short, optional summary of physical-health context that helps a provider see the whole picture — only if you choose to share it."
        level={1}
      />
      <InlineNotice kind="info" title="You control every field" className="mb-4">
        Adding context here shares nothing by itself. Sharing happens only through a referral, showing you the exact
        preview first. Every item is marked as self-reported.
      </InlineNotice>
      <HealthContextClient />
    </div>
  );
}
