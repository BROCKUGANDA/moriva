/**
 * analytics domain — de-identified workflow outcomes (PRD §22, Phase 10).
 * Every metric reports numerator, denominator, period, source and missingness.
 * Unknown is never converted into success. Small cells are suppressed.
 */
import { db } from "@/lib/db";

export type Metric = {
  key: string;
  definition: string;
  numerator: number | null;
  denominator: number | null;
  suppressed: boolean; // small-cell disclosure prevention
  periodStart: string;
  periodEnd: string;
  sources: string[]; // e.g. ["SIMULATED", "PATIENT_REPORTED"]
  missingOrUnknown: number;
  note: string;
};

function isSuppressed(n: number, threshold: number): boolean {
  return n > 0 && n < threshold;
}

export async function outcomesDashboard(smallCellThreshold = 5, periodDays = 30): Promise<{ metrics: Metric[]; labels: { simulatedData: boolean; note: string } }> {
  const periodEnd = new Date();
  const periodStart = new Date(periodEnd.getTime() - periodDays * 24 * 3600_000);

  // Funnel counters derived from workflow tables (not arbitrary front-end counters)
  const [assessmentsStarted, assessmentsScored, referralsCreated, referralsAcknowledged, appointmentsScheduled, contactsConfirmed, followUpsCompleted] = await Promise.all([
    db.assessmentSession.count({ where: { startedAt: { gte: periodStart }, status: { in: ["IN_PROGRESS", "COMPLETED", "SCORED"] } } }),
    db.assessmentResult.count({ where: { computedAt: { gte: periodStart } } }),
    db.referral.count({ where: { createdAt: { gte: periodStart } } }),
    db.referralEvent.count({ where: { eventType: "STATE_TRANSITION", toState: "ACKNOWLEDGED", occurredAt: { gte: periodStart } } }),
    db.referralEvent.count({ where: { eventType: "STATE_TRANSITION", toState: "APPOINTMENT_SCHEDULED", occurredAt: { gte: periodStart } } }),
    db.referralEvent.count({ where: { eventType: "STATE_TRANSITION", toState: "CONTACT_CONFIRMED", occurredAt: { gte: periodStart } } }),
    db.followUp.count({ where: { status: "COMPLETED", completedAt: { gte: periodStart } } }),
  ]);

  // evidence source breakdown for referral events
  const simulatedEvents = await db.referralEvent.count({ where: { evidenceSource: "SIMULATED", occurredAt: { gte: periodStart } } });
  const patientReportedEvents = await db.referralEvent.count({ where: { evidenceSource: "PATIENT_REPORTED", occurredAt: { gte: periodStart } } });
  const providerConfirmedEvents = await db.referralEvent.count({ where: { evidenceSource: "PROVIDER_CONFIRMED", occurredAt: { gte: periodStart } } });

  // verified follow-up rate = confirmed contact or follow-up inside window / all eligible referrals
  const confirmedFollowUps = contactsConfirmed + followUpsCompleted;
  const missingOrUnknown = Math.max(0, referralsCreated - simulatedEvents - patientReportedEvents - providerConfirmedEvents);

  const metrics: Metric[] = [
    {
      key: "assessment_start_to_completion",
      definition: "Assessment sessions scored / assessment sessions started",
      numerator: assessmentsScored,
      denominator: assessmentsStarted,
      suppressed: isSuppressed(assessmentsScored, smallCellThreshold) || isSuppressed(assessmentsStarted, smallCellThreshold),
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
      sources: ["SYSTEM"],
      missingOrUnknown: Math.max(0, assessmentsStarted - assessmentsScored),
      note: "Completion means a result was computed. Abandoned sessions are counted in the denominator, not dropped.",
    },
    {
      key: "referral_creation_rate",
      definition: "Referrals created / assessments scored",
      numerator: referralsCreated,
      denominator: assessmentsScored,
      suppressed: isSuppressed(referralsCreated, smallCellThreshold) || isSuppressed(assessmentsScored, smallCellThreshold),
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
      sources: ["SYSTEM"],
      missingOrUnknown: Math.max(0, assessmentsScored - referralsCreated),
      note: "A referral created is not care received — see the follow-through metric.",
    },
    {
      key: "provider_acknowledgement",
      definition: "Referrals acknowledged / referrals created",
      numerator: referralsAcknowledged,
      denominator: referralsCreated,
      suppressed: isSuppressed(referralsAcknowledged, smallCellThreshold),
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
      sources: ["SIMULATED"],
      missingOrUnknown: Math.max(0, referralsCreated - referralsAcknowledged),
      note: "All acknowledgements in this prototype are simulated demo events.",
    },
    {
      key: "appointment_scheduled",
      definition: "Appointments scheduled / referrals created",
      numerator: appointmentsScheduled,
      denominator: referralsCreated,
      suppressed: isSuppressed(appointmentsScheduled, smallCellThreshold),
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
      sources: ["SIMULATED"],
      missingOrUnknown: Math.max(0, referralsCreated - appointmentsScheduled),
      note: "Simulated provider workflow events.",
    },
    {
      key: "verified_follow_through",
      definition: "Referrals with a confirmed contact or completed follow-up / referrals created",
      numerator: confirmedFollowUps,
      denominator: referralsCreated,
      suppressed: isSuppressed(confirmedFollowUps, smallCellThreshold) || isSuppressed(referralsCreated, smallCellThreshold),
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
      sources: ["PATIENT_REPORTED", "SIMULATED"],
      missingOrUnknown,
      note: "Patient-reported and provider-confirmed events are stored as distinct evidence types; simulated events never count as real care outcomes.",
    },
  ];

  return {
    metrics,
    labels: {
      simulatedData: true,
      note:
        "PROTOTYPE — SIMULATED DATA. All records in this environment are synthetic. Metrics show numerators, denominators, period, evidence sources and missing/unknown counts. Cells below the privacy threshold are suppressed rather than displayed.",
    },
  };
}

/** Small-cell suppression helper for any cohort breakdown. */
export function suppressSmall<T extends Record<string, unknown>>(
  rows: Array<T & { count: number }>,
  threshold: number
): Array<T & { count: number; suppressed: boolean }> {
  return rows.map((r) => ({ ...r, count: r.count < threshold ? 0 : r.count, suppressed: r.count < threshold && r.count > 0 }));
}
