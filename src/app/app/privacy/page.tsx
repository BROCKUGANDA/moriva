import { redirect } from "next/navigation";
import { getSessionUser } from "@/domains/identity/service";
import { SectionHeading } from "@/components/moriva/status";
import { PrivacyCentre } from "@/components/moriva/privacy-centre";

export const metadata = { title: "Privacy centre" };
export const dynamic = "force-dynamic";

export default async function PrivacyPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return (
    <div>
      <SectionHeading
        title="Privacy centre"
        description="Every permission, who can see what, and every request you make — in one place."
        level={1}
      />
      <PrivacyCentre />
    </div>
  );
}
