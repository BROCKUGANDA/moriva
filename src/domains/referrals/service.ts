/**
 * referrals domain — consent-authorised, idempotent referral workflow (PRD §14, Phase 6).
 * Explicit transition map + optimistic version + transactional outbox.
 */
import { db } from "@/lib/db";
import { MorivaError } from "@/lib/errors";
import { requireConsent, checkConsent } from "@/domains/consent/service";
import { assertReferrableService } from "@/domains/directory/service";
import { audit } from "@/domains/audit/service";
import { sha256Hex } from "@/lib/security";

export const REFERRAL_STATES = [
  "DRAFT", "AWAITING_USER_CONSENT", "READY_TO_SEND", "PENDING_PROVIDER_ACKNOWLEDGEMENT",
  "ACKNOWLEDGED", "NEEDS_INFORMATION", "DECLINED", "PROVIDER_UNAVAILABLE",
  "APPOINTMENT_OFFERED", "APPOINTMENT_SCHEDULED", "CONTACT_CONFIRMED",
  "FOLLOW_UP_DUE", "FOLLOW_UP_COMPLETED", "CLOSED",
  "CANCELLED_BY_USER", "EXPIRED", "DELIVERY_FAILED", "WITHDRAWN_CONSENT",
] as const;
export type ReferralState = (typeof REFERRAL_STATES)[number];

export const TRANSITIONS: Record<ReferralState, ReferralState[]> = {
  DRAFT: ["AWAITING_USER_CONSENT", "READY_TO_SEND", "CANCELLED_BY_USER"],
  AWAITING_USER_CONSENT: ["READY_TO_SEND", "CANCELLED_BY_USER", "WITHDRAWN_CONSENT"],
  READY_TO_SEND: ["PENDING_PROVIDER_ACKNOWLEDGEMENT", "CANCELLED_BY_USER", "WITHDRAWN_CONSENT", "DELIVERY_FAILED"],
  PENDING_PROVIDER_ACKNOWLEDGEMENT: ["ACKNOWLEDGED", "NEEDS_INFORMATION", "DECLINED", "PROVIDER_UNAVAILABLE", "CANCELLED_BY_USER", "WITHDRAWN_CONSENT", "EXPIRED"],
  NEEDS_INFORMATION: ["ACKNOWLEDGED", "DECLINED", "PROVIDER_UNAVAILABLE", "CANCELLED_BY_USER", "WITHDRAWN_CONSENT", "CLOSED"],
  ACKNOWLEDGED: ["APPOINTMENT_OFFERED", "APPOINTMENT_SCHEDULED", "NEEDS_INFORMATION", "DECLINED", "PROVIDER_UNAVAILABLE", "CLOSED"],
  APPOINTMENT_OFFERED: ["APPOINTMENT_SCHEDULED", "DECLINED", "CLOSED"],
  APPOINTMENT_SCHEDULED: ["CONTACT_CONFIRMED", "CLOSED"],
  CONTACT_CONFIRMED: ["FOLLOW_UP_DUE", "FOLLOW_UP_COMPLETED", "CLOSED"],
  FOLLOW_UP_DUE: ["FOLLOW_UP_COMPLETED", "CLOSED", "EXPIRED"],
  FOLLOW_UP_COMPLETED: ["CLOSED"],
  DECLINED: ["CLOSED"],
  PROVIDER_UNAVAILABLE: ["CLOSED"],
  CLOSED: [],
  CANCELLED_BY_USER: [],
  EXPIRED: [],
  DELIVERY_FAILED: ["READY_TO_SEND", "CLOSED"],
  WITHDRAWN_CONSENT: [],
} as unknown as Record<ReferralState, ReferralState[]>;

export function canTransition(from: ReferralState, to: ReferralState): boolean {
  return (TRANSITIONS[from] ?? []).includes(to);
}

export type Actor = { userId: string; role: string };

export type CreateReferralInput = {
  actor: Actor;
  providerServiceId: string;
  assessmentResultId?: string | null;
  sharedFields: string[];
  purposeSummary: string;
  idempotencyKey: string;
  // consent is captured for this exact recipient before creation; the event id comes from the preview step
  consentEventId: string;
};

/** Canonical request hash — an idempotency key is only valid for the same payload. */
export function referralRequestHash(input: {
  actorId: string; providerServiceId: string; assessmentResultId?: string | null;
  sharedFields: string[]; purposeSummary: string; consentEventId: string;
}): string {
  return sha256Hex(JSON.stringify([
    input.actorId, input.providerServiceId, input.assessmentResultId ?? null,
    [...input.sharedFields].sort(), input.purposeSummary.trim(), input.consentEventId,
  ]));
}

const DEFAULT_SHARED_FIELDS = ["FIRST_NAME", "REFERRAL_REASON", "ASSESSMENT_SUMMARY"];

export async function createReferral(input: CreateReferralInput): Promise<{ referral: { id: string; state: ReferralState; version: number }; duplicate: boolean }> {
  // 0. service-layer validation (routes validate too, but services must not trust callers)
  const validFields = ["FIRST_NAME", "REFERRAL_REASON", "ASSESSMENT_SUMMARY", "CONTACT_DETAILS"];
  if (!Array.isArray(input.sharedFields) || input.sharedFields.length === 0 || input.sharedFields.some((f) => !validFields.includes(f))) {
    throw new MorivaError("VALIDATION_FAILED", { details: { field: "sharedFields" } });
  }
  if (!input.purposeSummary || input.purposeSummary.trim().length < 5 || input.purposeSummary.length > 300) {
    throw new MorivaError("VALIDATION_FAILED", { details: { field: "purposeSummary" } });
  }
  // 1. idempotency: same key → same-or-conflict (PRD §14.2, AC-PR-08)
  const existing = await db.referral.findUnique({ where: { idempotencyKey: input.idempotencyKey } });
  const requestHash = referralRequestHash({
    actorId: input.actor.userId,
    providerServiceId: input.providerServiceId,
    assessmentResultId: input.assessmentResultId ?? null,
    sharedFields: input.sharedFields,
    purposeSummary: input.purposeSummary,
    consentEventId: input.consentEventId,
  });
  if (existing) {
    if (existing.requestHash !== requestHash) {
      throw new MorivaError("REQUEST_IDEMPOTENCY_CONFLICT");
    }
    return { referral: { id: existing.id, state: existing.state as ReferralState, version: existing.version }, duplicate: true };
  }

  // 2. recipient eligibility (fail closed on expired/suspended)
  const service = await assertReferrableService(input.providerServiceId);

  // 3. consent — must be valid for REFERRAL purpose with this named recipient, re-checked NOW (not at preview time)
  const consentEvent = await db.consentEvent.findUnique({ where: { id: input.consentEventId } });
  if (!consentEvent || consentEvent.subjectUserId !== input.actor.userId) {
    throw new MorivaError("CONSENT_REQUIRED");
  }
  await requireConsent({
    subjectId: input.actor.userId,
    purpose: "REFERRAL",
    recipientType: "PROVIDER",
    recipientId: service.providerId,
    dataCategories: ["CONTACT_DETAILS", "REFERRAL_REASON", ...(input.sharedFields.includes("ASSESSMENT_SUMMARY") ? ["ASSESSMENT_SUMMARY"] : [])],
  });

  // 4. create atomically: referral + first event + audit + outbox
  // P2002 guard: concurrent double-submit with the same key — re-read and return duplicate/conflict.
  let referral;
  try {
    referral = await db.$transaction(async (tx) => {
      const created = await tx.referral.create({
        data: {
          userId: input.actor.userId,
          providerServiceId: input.providerServiceId,
          assessmentResultId: input.assessmentResultId ?? null,
          state: "PENDING_PROVIDER_ACKNOWLEDGEMENT",
          consentEventId: input.consentEventId,
          idempotencyKey: input.idempotencyKey,
          requestHash,
          sharedFields: input.sharedFields.join("|"),
          version: 1,
        },
      });
    await tx.referralEvent.create({
      data: {
        referralId: created.id,
        eventType: "STATE_TRANSITION",
        fromState: "READY_TO_SEND",
        toState: "PENDING_PROVIDER_ACKNOWLEDGEMENT",
        actorType: "INDIVIDUAL",
        actorId: input.actor.userId,
        metadataJson: JSON.stringify({ simulated: service.provider.demoData }),
      },
    });
    await tx.outboxEvent.create({
      data: {
        aggregateType: "referral",
        aggregateId: created.id,
        eventType: "REFERRAL_CREATED",
        dedupKey: `referral:${created.id}:CREATED:v1`,
        payloadRedacted: JSON.stringify({ providerServiceId: input.providerServiceId, demo: service.provider.demoData }),
      },
    });
      return created;
    });
  } catch (e) {
    // Concurrent winner already inserted: re-read by key → duplicate (same hash) or conflict.
    const raced = await db.referral.findUnique({ where: { idempotencyKey: input.idempotencyKey } });
    if (raced) {
      if (raced.requestHash !== requestHash) throw new MorivaError("REQUEST_IDEMPOTENCY_CONFLICT");
      return { referral: { id: raced.id, state: raced.state as ReferralState, version: raced.version }, duplicate: true };
    }
    throw e;
  }

  await audit({
    actorId: input.actor.userId, actorRole: input.actor.role, subjectId: input.actor.userId,
    action: "REFERRAL_CREATED", resourceType: "referral", resourceId: referral.id, purpose: "REFERRAL",
    outcome: "ALLOW", metadata: { providerId: service.providerId, demo: service.provider.demoData },
  });

  // Simulated routing: demo providers get an automatic assignment to the demo clinician so the
  // professional workspace can demonstrate the flow. Clearly labelled simulated — never a real routing decision.
  if (service.provider.demoData) {
    const demoClinician = await db.user.findFirst({ where: { role: "PROFESSIONAL_SIMULATED", demoData: true } });
    if (demoClinician) {
      await db.referralAssignment.create({
        data: { referralId: referral.id, organisationId: service.provider.organisationId, professionalId: demoClinician.id },
      });
    }
  }

  // 5. simulated delivery (no external transport exists — labelled, never real)
  await simulateDelivery(referral.id, service.provider.demoData);

  return { referral: { id: referral.id, state: referral.state as ReferralState, version: referral.version }, duplicate: false };
}

/**
 * No external provider transport exists in this prototype (ADR-0004): the outbox event
 * resolves to an internal, clearly-labelled SIMULATED delivery event. It must never
 * masquerade as a real provider handoff.
 */
async function simulateDelivery(referralId: string, demo: boolean) {
  // Atomic claim: only one dispatcher wins the PENDING → PUBLISHED transition.
  const claimed = await db.outboxEvent.updateMany({
    where: { aggregateId: referralId, eventType: "REFERRAL_CREATED", status: "PENDING" },
    data: { status: "PUBLISHED", publishedAt: new Date(), claimedAt: new Date(), attempts: 1 },
  });
  if (claimed.count === 0) return;
  await db.referralEvent.create({
    data: {
      referralId,
      eventType: "DELIVERY_SIMULATED",
      actorType: "SYSTEM",
      evidenceSource: "SIMULATED",
      metadataJson: JSON.stringify({ transport: "none", demo, note: "No external provider transport exists in this prototype." }),
    },
  });
}

export type TransitionInput = {
  referralId: string;
  to: ReferralState;
  actor: Actor;
  expectedVersion: number;
  evidenceSource?: "PROVIDER_CONFIRMED" | "PATIENT_REPORTED" | "SIMULATED" | "INTEGRATION_CONFIRMED";
  noteClass?: "CLINICAL_NOTE" | "OPERATIONS_NOTE" | "PATIENT_MESSAGE";
  noteBody?: string;
  safeReasonCode?: string;
};

/**
 * Transition with state-machine validation, optimistic locking, role/assignment checks
 * and consent re-verification where data is read or shared.
 */
export async function transitionReferral(input: TransitionInput) {
  const referral = await db.referral.findUnique({
    where: { id: input.referralId },
    include: { providerService: { include: { provider: true } } },
  });
  if (!referral) throw new MorivaError("RESOURCE_NOT_FOUND");
  const from = referral.state as ReferralState;

  if (!canTransition(from, input.to)) {
    throw new MorivaError("REFERRAL_STATE_CONFLICT", { details: { from, to: input.to } });
  }
  if (referral.version !== input.expectedVersion) {
    throw new MorivaError("REFERRAL_STATE_CONFLICT", { details: { expected: input.expectedVersion, actual: referral.version } });
  }

  // role rules (server-enforced; PRD §4.7)
  const isSubject = referral.userId === input.actor.userId;
  const isProfessional = ["PROFESSIONAL_SIMULATED", "PROVIDER_COORDINATOR_SIMULATED", "CLINICAL_GOVERNANCE_SIMULATED"].includes(input.actor.role);
  if (isProfessional) {
    const assignment = await db.referralAssignment.findFirst({
      where: { referralId: referral.id, professionalId: input.actor.userId, revokedAt: null },
    });
    const coordinatorOwns = input.actor.role === "PROVIDER_COORDINATOR_SIMULATED" && referral.providerService.provider.coordinatorId === input.actor.userId;
    if (!assignment && !coordinatorOwns) {
      await audit({ actorId: input.actor.userId, actorRole: input.actor.role, action: "REFERRAL_TRANSITION", resourceType: "referral", resourceId: referral.id, outcome: "DENY", metadata: { reason: "NOT_ASSIGNED" } });
      throw new MorivaError("AUTH_FORBIDDEN");
    }
    // professionals act for the provider side; they cannot act as the patient
    const professionalAllowed: Partial<Record<ReferralState, boolean>> = {
      ACKNOWLEDGED: true, NEEDS_INFORMATION: true, DECLINED: true, PROVIDER_UNAVAILABLE: true,
      APPOINTMENT_OFFERED: true, APPOINTMENT_SCHEDULED: true, CLOSED: true,
    };
    if (!professionalAllowed[input.to]) {
      throw new MorivaError("AUTH_FORBIDDEN", { messageOverride: "Professionals can acknowledge, request information, schedule, decline or close — not perform user actions." });
    }
    if (input.to === "ACKNOWLEDGED" || input.to === "APPOINTMENT_SCHEDULED" || input.to === "NEEDS_INFORMATION" || input.to === "DECLINED" || input.to === "PROVIDER_UNAVAILABLE" || input.to === "APPOINTMENT_OFFERED" || input.to === "CLOSED") {
      // provider-side actions carry SIMULATED evidence in demo mode
      input.evidenceSource = "SIMULATED";
    }
  } else if (isSubject) {
    const userAllowed: Partial<Record<ReferralState, boolean>> = {
      CANCELLED_BY_USER: true,
      CONTACT_CONFIRMED: true, // patient-reported contact
      FOLLOW_UP_DUE: true,
      FOLLOW_UP_COMPLETED: true,
      WITHDRAWN_CONSENT: true,
    };
    if (!userAllowed[input.to]) {
      throw new MorivaError("AUTH_FORBIDDEN", { messageOverride: "Only the provider side can perform this action." });
    }
    if (input.to === "CONTACT_CONFIRMED") {
      input.evidenceSource = "PATIENT_REPORTED";
    }
  } else {
    throw new MorivaError("AUTH_FORBIDDEN");
  }

  // consent re-check for actions that read/share data
  if (["ACKNOWLEDGED", "APPOINTMENT_SCHEDULED", "NEEDS_INFORMATION"].includes(input.to)) {
    const decision = await checkConsent({
      subjectId: referral.userId,
      purpose: "REFERRAL",
      recipientType: "PROVIDER",
      recipientId: referral.providerService.providerId,
    });
    if (!decision.granted) {
      // consent revoked after referral creation: block new sharing
      await db.$transaction(async (tx) => {
        await tx.referral.update({ where: { id: referral.id }, data: { state: "WITHDRAWN_CONSENT", version: { increment: 1 } } });
        await tx.referralEvent.create({
          data: { referralId: referral.id, eventType: "CONSENT_WITHDRAWN", fromState: from, toState: "WITHDRAWN_CONSENT", actorType: "SYSTEM", metadataJson: JSON.stringify({ reason: decision.reason }) },
        });
      });
      throw new MorivaError("CONSENT_REVOKED");
    }
  }

  const updated = await db.$transaction(async (tx) => {
    const row = await tx.referral.update({
      where: { id: referral.id, version: input.expectedVersion },
      data: { state: input.to, version: { increment: 1 } },
    });
    await tx.referralEvent.create({
      data: {
        referralId: referral.id,
        eventType: "STATE_TRANSITION",
        fromState: from,
        toState: input.to,
        actorType: isSubject ? "INDIVIDUAL" : "PROFESSIONAL_SIMULATED",
        actorId: input.actor.userId,
        evidenceSource: input.evidenceSource ?? null,
        safeReasonCode: input.safeReasonCode ?? null,
        noteClass: input.noteClass ?? null,
        noteBody: input.noteBody?.slice(0, 2000) ?? null,
        metadataJson: JSON.stringify({ simulated: referral.providerService.provider.demoData }),
      },
    });
    await tx.outboxEvent.create({
      data: {
        aggregateType: "referral",
        aggregateId: referral.id,
        eventType: "REFERRAL_STATE_CHANGED",
        dedupKey: `referral:${referral.id}:${input.to}:v${input.expectedVersion}`,
        payloadRedacted: JSON.stringify({ from, to: input.to }),
      },
    });
    return row;
  });

  await audit({
    actorId: input.actor.userId, actorRole: input.actor.role, subjectId: referral.userId,
    action: "REFERRAL_TRANSITION", resourceType: "referral", resourceId: referral.id,
    purpose: "REFERRAL", outcome: "ALLOW", metadata: { from, to: input.to },
  });

  // follow-up scheduling convenience: appointment → FOLLOW_UP_DUE is a separate explicit step
  return { referral: updated, from, to: input.to };
}

export async function listUserReferrals(userId: string, opts: { limit?: number; cursor?: string | null } = {}) {
  const limit = Math.min(100, Math.max(1, opts.limit ?? 20));
  const rows = await db.referral.findMany({
    where: { userId, ...(opts.cursor ? { updatedAt: { lt: new Date(opts.cursor) } } : {}) },
    orderBy: { updatedAt: "desc" },
    take: limit + 1,
    include: { providerService: { include: { provider: true } }, events: { orderBy: { occurredAt: "asc" } } },
  });
  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  return { items, nextCursor: hasMore ? items[items.length - 1].updatedAt.toISOString() : null, hasMore };
}

export async function getOwnedReferral(userId: string, referralId: string) {
  const r = await db.referral.findUnique({
    where: { id: referralId },
    include: {
      providerService: { include: { provider: true } },
      events: { orderBy: { occurredAt: "asc" } },
      assignments: true,
    },
  });
  if (!r || r.userId !== userId) throw new MorivaError("RESOURCE_NOT_FOUND");
  return r;
}
