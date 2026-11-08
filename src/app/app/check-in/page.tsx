import { SectionHeading, InlineNotice } from "@/components/moriva/status";
import { CheckInClient } from "@/components/moriva/check-in-client";

export const metadata = { title: "Check-in" };

export default function CheckInPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <SectionHeading
        title="Quick check-in"
        description="An optional, private mood tag for today. It is not a questionnaire, not a score, and never shared."
        level={1}
      />
      <InlineNotice kind="info" title="What this is and isn't" className="mb-4">
        A quick tag helps you notice patterns over time. It is not a validated measure — for a structured reflection,
        use an <a href="/app/assessments" className="underline">assessment</a>.
      </InlineNotice>
      <CheckInClient />
    </div>
  );
}
