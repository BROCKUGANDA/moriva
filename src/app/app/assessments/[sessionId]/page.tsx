import { AssessmentRunner } from "@/components/moriva/assessment-runner";

export const metadata = { title: "Assessment" };
export const dynamic = "force-dynamic";

export default async function AssessmentSessionPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  return <AssessmentRunner sessionId={sessionId} />;
}
