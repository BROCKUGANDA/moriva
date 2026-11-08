/**
 * professional domain — simulated workspace service (PRD §7.8, Phase 6.4).
 * Access strictly limited to assigned referrals; every read is audited; clinical notes
 * are separated from operations notes; all actions are visibly simulated.
 */
import { db } from "@/lib/db";
import { MorivaError } from "@/lib/errors";
import { audit } from "@/domains/audit/service";
import { transitionReferral } from "@/domains/referrals/service";

export const PROFESSIONAL_ROLES = ["PROFESSIONAL_SIMULATED", "PROVIDER_COORDINATOR_SIMULATED", "CLINICAL_GOVERNANCE_SIMULATED"];

export type ReferralForProfessional = Awaited<ReturnType<typeof getAssignedReferral>>;

export async function listAssignedReferrals(professionalId: string) {
  const assignments = await db.referralAssignment.findMany({
    where: { professionalId, revokedAt: null },
    include: {
      referral: {
        include: {
          providerService: { include: { provider: true } },
          user: { select: { displayName: true, id: true } },
          events: { orderBy: { occurredAt: "desc" }, take: 1 },
        },
      },
    },
    orderBy: { assignedAt: "desc" },
  });
  // coordinator: also see own-org referrals without a specific professional
  const coordinatorOrgs = await db.provider.findMany({ where: { coordinatorId: professionalId }, select: { organisationId: true } });
  let orgRows: typeof assignments = [];
  if (coordinatorOrgs.length > 0) {
    orgRows = await db.referralAssignment.findMany({
      where: {
        revokedAt: null,
        organisationId: { in: coordinatorOrgs.map((o) => o.organisationId).filter((x): x is string => Boolean(x)) },
        professionalId: null,
      },
      include: {
        referral: {
          include: {
            providerService: { include: { provider: true } },
            user: { select: { displayName: true, id: true } },
            events: { orderBy: { occurredAt: "desc" }, take: 1 },
          },
        },
      },
    });
  }
  const all = [...assignments, ...orgRows];
  return all
    .filter((a) => a.referral)
    .map((a) => ({
      assignmentId: a.id,
      referralId: a.referral.id,
      state: a.referral.state,
      patientAlias: `Participant ${a.referral.user.displayName.slice(-2)}`, // minimum-necessary display
      serviceName: a.referral.providerService.serviceName,
      providerName: a.referral.providerService.provider.displayName,
      simulated: a.referral.providerService.provider.demoData,
      sharedFields: a.referral.sharedFields.split("|").filter(Boolean),
      createdAt: a.referral.createdAt,
      lastEvent: a.referral.events[0] ?? null,
    }));
}

/** Assigned-only fetch with audited access (FR-HW-001, FR-HW-003). */
export async function getAssignedReferral(professionalId: string, role: string, referralId: string) {
  const referral = await db.referral.findUnique({
    where: { id: referralId },
    include: {
      providerService: { include: { provider: true } },
      user: { select: { displayName: true, email: true, id: true } },
      events: { orderBy: { occurredAt: "asc" } },
      assignments: true,
      consentEvent: true,
    },
  });
  if (!referral) throw new MorivaError("RESOURCE_NOT_FOUND");
  const assignment = referral.assignments.find((a) => a.professionalId === professionalId && !a.revokedAt);
  const coordinatorOwns = role === "PROVIDER_COORDINATOR_SIMULATED" && referral.providerService.provider.coordinatorId === professionalId;
  if (!assignment && !coordinatorOwns) {
    await audit({ actorId: professionalId, actorRole: role, action: "PROFESSIONAL_REFERRAL_READ", resourceType: "referral", resourceId: referralId, outcome: "DENY", metadata: { reason: "NOT_ASSIGNED" } });
    throw new MorivaError("AUTH_FORBIDDEN", { messageOverride: "This referral is not assigned to you." });
  }
  // audited sensitive read
  await audit({ actorId: professionalId, actorRole: role, subjectId: referral.userId, action: "PROFESSIONAL_REFERRAL_READ", resourceType: "referral", resourceId: referralId, purpose: "REFERRAL", outcome: "ALLOW" });
  return referral;
}

/**
 * The shared summary a professional may see: ONLY the consented fields (minimum necessary).
 * Individual answers are never exposed.
 */
export function buildSharedSummary(referral: {
  user: { displayName: string; email: string };
  sharedFields: string;
  purposeSummary?: string | null;
  assessmentResult?: { interpretationCode: string } | null;
  events: Array<{ noteClass: string | null; noteBody: string | null; eventType: string }>;
}) {
  const fields = referral.sharedFields.split("|").filter(Boolean);
  const summary: Record<string, string> = {};
  if (fields.includes("FIRST_NAME")) summary.name = referral.user.displayName.split(" ")[0];
  if (fields.includes("CONTACT_DETAILS")) summary.contact = referral.user.email;
  const purposeEvent = referral.events.find((e) => e.eventType === "STATE_TRANSITION");
  if (fields.includes("REFERRAL_REASON")) summary.reason = "Stated purpose recorded at referral creation";
  if (fields.includes("ASSESSMENT_SUMMARY") && referral.assessmentResult) {
    summary.assessment = `Result code ${referral.assessmentResult.interpretationCode} (summary only — individual answers are not shared)`;
  }
  const clinicalNotes = referral.events.filter((e) => e.noteClass === "CLINICAL_NOTE" && e.noteBody);
  const opsNotes = referral.events.filter((e) => e.noteClass === "OPERATIONS_NOTE" && e.noteBody);
  return { summary, clinicalNotes: clinicalNotes.map((e) => ({ body: e.noteBody!, at: e.eventType })), opsNotes: opsNotes.map((e) => ({ body: e.noteBody!, at: e.eventType })) };
}

/** Professional transitions (acknowledge, needs-info, schedule, decline, close). */
export async function professionalAction(input: {
  professionalId: string;
  role: string;
  referralId: string;
  action: "ACKNOWLEDGE" | "NEEDS_INFORMATION" | "SCHEDULE" | "DECLINE" | "CLOSE" | "OFFER";
  noteClass?: "CLINICAL_NOTE" | "OPERATIONS_NOTE";
  noteBody?: string;
  safeReasonCode?: string;
}) {
  const referral = await getAssignedReferral(input.professionalId, input.role, input.referralId);
  const actionToState: Record<string, string> = {
    ACKNOWLEDGE: "ACKNOWLEDGED",
    NEEDS_INFORMATION: "NEEDS_INFORMATION",
    SCHEDULE: "APPOINTMENT_SCHEDULED",
    DECLINE: "DECLINED",
    CLOSE: "CLOSED",
    OFFER: "APPOINTMENT_OFFERED",
  };
  const to = actionToState[input.action] as never;
  const outcome = await transitionReferral({
    referralId: input.referralId,
    to,
    actor: { userId: input.professionalId, role: input.role },
    expectedVersion: referral.version,
    noteClass: input.noteClass,
    noteBody: input.noteBody,
    safeReasonCode: input.safeReasonCode,
  });
  return outcome;
}
