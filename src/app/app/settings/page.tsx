import { redirect } from "next/navigation";
import { getSessionUser } from "@/domains/identity/service";
import { SectionHeading } from "@/components/moriva/status";
import { SettingsClient } from "@/components/moriva/settings-client";

export const metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return (
    <div className="mx-auto max-w-2xl">
      <SectionHeading title="Settings" description="Language, accessibility and account options." level={1} />
      <SettingsClient email={user.email} displayName={user.displayName} />
    </div>
  );
}
