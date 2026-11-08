import { SectionHeading } from "@/components/moriva/status";
import { AssessmentList } from "@/components/moriva/assessment-list";

export const metadata = { title: "Assessments" };

export default function AssessmentsPage() {
  return (
    <div>
      <SectionHeading
        title="Assessments"
        description="Voluntary, private questionnaires. Completing one is entirely up to you — everything in MORIVA works without it."
        level={1}
      />
      <AssessmentList />
    </div>
  );
}
