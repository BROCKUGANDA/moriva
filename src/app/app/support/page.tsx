import { SectionHeading } from "@/components/moriva/status";
import { SupportOptionsAfterResult } from "@/components/moriva/support-options";
import { AssistantDisabledPanel } from "@/components/moriva/assistant-disabled-panel";

export const metadata = { title: "Support options" };
export const dynamic = "force-dynamic";

export default function SupportPage() {
  return (
    <div>
      <SectionHeading
        title="Support options"
        description="A menu, not a mandate. These are the general categories of support — you can choose any of them, ask a person for help, or decline everything. If you complete an assessment, options are also explained on your result page."
        level={1}
      />
      <SupportOptionsAfterResult />
      <div className="mt-6">
        <AssistantDisabledPanel />
      </div>
    </div>
  );
}
