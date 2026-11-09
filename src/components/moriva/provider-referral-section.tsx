"use client";

import { useState } from "react";
import { AssessmentPicker } from "@/components/moriva/assessment-picker";
import { ReferralFlow } from "@/components/moriva/referral-flow";

export type ProviderSessionOption = {
  id: string;
  name: string;
  version: string;
  code: string;
  completedAt: string;
  resultId: string | null;
};

/** Client wrapper: wires the assessment picker selection into the referral flow. */
export function ProviderReferralSection({
  providerServiceId,
  sessions,
}: {
  providerServiceId: string;
  sessions: ProviderSessionOption[];
}) {
  const [resultId, setResultId] = useState<string | null>(null);
  return (
    <>
      <AssessmentPicker
        sessions={sessions}
        value={resultId}
        onSelect={(v) => {
          setResultId(v);
        }}
      />
      <div className="mt-3">
        <ReferralFlow
          key={resultId ?? "none"}
          providerServiceId={providerServiceId}
          assessmentResultId={resultId}
          defaultReason=""
        />
      </div>
    </>
  );
}
