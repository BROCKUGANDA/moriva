import { SectionHeading, InlineNotice } from "@/components/moriva/status";
import { OnboardingConsentReview } from "@/components/moriva/onboarding-consent-review";

export const metadata = { title: "Welcome" };

export default function OnboardingPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <SectionHeading
        title="Welcome to MORIVA"
        description="Take a moment to see what you've agreed to and what stays private. Everything below is yours to change at any time."
        level={1}
      />
      <InlineNotice kind="info" title="MORIVA is not an emergency service and does not diagnose" className="mb-4">
        If you ever need urgent help, it's one tap away on every screen.
      </InlineNotice>
      <OnboardingConsentReview />
    </div>
  );
}
