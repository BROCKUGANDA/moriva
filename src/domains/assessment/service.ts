/**
 * assessment domain — session service (persistence + lifecycle, PRD §4.3).
 * Lifecycle: CREATED → IN_PROGRESS → COMPLETED → SCORED.
 * Exceptions: ABANDONED, EXPIRED, CANCELLED, INVALIDATED_BY_INSTRUMENT_RETIREMENT.
 */
import { db } from "@/lib/db";
import { MorivaError } from "@/lib/errors";
import {
  calculateScore, evaluateSafetyTrigger, validateResponseSet,
  type ItemDef, type InterpretationBand, type ResponseValue,
} from "./scoring";
import { audit } from "@/domains/audit/service";
import { SYNTHETIC_TRIGGER_THRESHOLD } from "./scoring";

export async function getActiveInstrument(locale = "en") {
  const instrument = await db.instrument.findFirst({
    where: { status: { in: ["ACTIVE", "SIMULATION_ONLY"] } },
    include: { versions: { where: { status: { in: ["APPROVED_SIMULATION", "APPROVED"] } }, orderBy: { effectiveAt: "desc" }, take: 1 } },
  });
  if (!instrument || instrument.versions.length === 0) return null;
  const version = instrument.versions[0];
  const items = await db.instrumentItem.findMany({
    where: { instrumentVersionId: version.id },
    orderBy: { ordinal: "asc" },
  });
  const bands = JSON.parse(version.interpretationEn || "[]") as InterpretationBand[];
  return {
    instrument,
    version,
    items: items as unknown as ItemDef[],
    bands,
    simulationOnly: instrument.status === "SIMULATION_ONLY",
  };
}

export async function createSession(userId: string, locale = "en", idempotencyKey?: string) {
  const active = await getActiveInstrument(locale);
  if (!active) throw new MorivaError("INSTRUMENT_NOT_APPROVED");
  if (active.version.status === "RETIRED") throw new MorivaError("INSTRUMENT_VERSION_EXPIRED");
  if (idempotencyKey) {
    const prior = await db.assessmentSession.findUnique({ where: { idempotencyKey } });
    if (prior) {
      if (prior.userId !== userId) throw new MorivaError("REQUEST_IDEMPOTENCY_CONFLICT");
      return prior;
    }
  }
  try {
    const session = await db.assessmentSession.create({
      data: {
        userId,
        instrumentVersionId: active.version.id,
        status: "CREATED",
        locale,
        scoringVersion: active.version.scoringVersion,
        source: "WEB",
        ...(idempotencyKey ? { idempotencyKey } : {}),
      },
    });
    await audit({ actorId: userId, actorRole: "INDIVIDUAL", subjectId: userId, action: "ASSESSMENT_STARTED", resourceType: "assessment_session", resourceId: session.id, outcome: "ALLOW" });
    return session;
  } catch (e) {
    if (idempotencyKey) {
      const raced = await db.assessmentSession.findUnique({ where: { idempotencyKey } });
      if (raced) {
        if (raced.userId !== userId) throw new MorivaError("REQUEST_IDEMPOTENCY_CONFLICT");
        return raced;
      }
    }
    throw e;
  }
}

/** Ownership-scoped fetch: a session is visible only to its subject (server-enforced). */
export async function getOwnedSession(userId: string, sessionId: string) {
  const session = await db.assessmentSession.findUnique({
    where: { id: sessionId },
    include: {
      instrumentVersion: { include: { instrument: true } },
      responses: true,
      result: true,
    },
  });
  if (!session || session.userId !== userId) throw new MorivaError("RESOURCE_NOT_FOUND");
  return session;
}

export async function saveResponse(
  userId: string,
  sessionId: string,
  itemId: string,
  value: number | null
): Promise<{ saved: true; urgent: boolean }> {
  const session = await getOwnedSession(userId, sessionId);
  if (["COMPLETED", "SCORED", "CANCELLED", "ABANDONED", "EXPIRED", "INVALIDATED_BY_INSTRUMENT_RETIREMENT"].includes(session.status)) {
    throw new MorivaError("REFERRAL_STATE_CONFLICT", { messageOverride: "This assessment is already submitted and cannot be changed." });
  }
  const version = session.instrumentVersion;
  // item must belong to this exact instrument version
  const item = await db.instrumentItem.findFirst({ where: { instrumentVersionId: version.id, itemKey: itemId } });
  if (!item) throw new MorivaError("VALIDATION_FAILED", { details: { field: "itemKey" } });
  let schema: { min: number; max: number };
  try {
    schema = JSON.parse(item.responseSchema) as { min: number; max: number };
  } catch {
    throw new MorivaError("SCORING_CONFIG_INVALID");
  }
  if (value !== null && (!Number.isInteger(value) || value < schema.min || value > schema.max)) {
    throw new MorivaError("VALIDATION_FAILED", { details: { field: "value" } });
  }
  // idempotent upsert on (session, item)
  await db.assessmentResponse.upsert({
    where: { sessionId_itemId: { sessionId: session.id, itemId } },
    create: { sessionId: session.id, itemId, responseValue: value },
    update: { responseValue: value, answeredAt: new Date() },
  });
  if (session.status === "CREATED") {
    await db.assessmentSession.updateMany({ where: { id: session.id, status: "CREATED" }, data: { status: "IN_PROGRESS" } });
  }
  // re-check: complete() may have scored the session while we were writing
  const fresh = await db.assessmentSession.findUnique({ where: { id: session.id }, select: { status: true } });
  if (fresh && ["SCORED", "COMPLETED"].includes(fresh.status)) {
    throw new MorivaError("REFERRAL_STATE_CONFLICT", { messageOverride: "This assessment was just submitted. Your answer was not saved." });
  }
  // urgent-risk check runs immediately on save (PRD §7.3: do not wait until final submit)
  const responses = await db.assessmentResponse.findMany({ where: { sessionId: session.id } });
  const responseValues: ResponseValue[] = responses.map((r) => ({ itemKey: r.itemId, value: r.responseValue }));
  const urgent = evaluateSafetyTrigger(version.riskItemKey, SYNTHETIC_TRIGGER_THRESHOLD, responseValues);
  return { saved: true, urgent: urgent.urgent };
}

export type CompleteOutcome =
  | { scored: true; resultId: string; interpretationCode: string; rawScore: number; transformedScore: number }
  | { scored: false; reason: "INCOMPLETE"; missing: string[] };

export async function completeSession(userId: string, sessionId: string): Promise<CompleteOutcome> {
  const session = await getOwnedSession(userId, sessionId);
  if (session.status === "EXPIRED") {
    throw new MorivaError("REFERRAL_STATE_CONFLICT", { messageOverride: "This assessment session has expired. Please start a new one." });
  }
  if (session.status === "ABANDONED" || session.status === "CANCELLED" || session.status === "INVALIDATED_BY_INSTRUMENT_RETIREMENT") {
    throw new MorivaError("REFERRAL_STATE_CONFLICT", { messageOverride: "This assessment session is closed and cannot be submitted." });
  }
  if (session.status === "SCORED" || session.status === "COMPLETED") {
    // repeated submit: return existing outcome honestly
    if (session.result) {
      return {
        scored: true,
        resultId: session.result.id,
        interpretationCode: session.result.interpretationCode,
        rawScore: session.result.rawScore ?? 0,
        transformedScore: session.result.transformedScore ?? 0,
      };
    }
  }
  if (session.instrumentVersion.status === "RETIRED") {
    throw new MorivaError("INSTRUMENT_VERSION_EXPIRED");
  }
  const items = (await db.instrumentItem.findMany({
    where: { instrumentVersionId: session.instrumentVersionId },
    orderBy: { ordinal: "asc" },
  })) as unknown as ItemDef[];
  let bands: InterpretationBand[];
  try {
    bands = JSON.parse(session.instrumentVersion.interpretationEn || "[]") as InterpretationBand[];
  } catch {
    throw new MorivaError("SCORING_CONFIG_INVALID");
  }
  const responseValues: ResponseValue[] = session.responses.map((r) => ({ itemKey: r.itemId, value: r.responseValue }));

  const validation = validateResponseSet(items, responseValues);
  if (!validation.valid) {
    throw new MorivaError("VALIDATION_FAILED", { messageOverride: "Some answers do not match this questionnaire version." });
  }
  const outcome = calculateScore(items, bands, responseValues);
  if (!outcome.ok) {
    if (outcome.reason === "MISSING_REQUIRED") {
      return { scored: false, reason: "INCOMPLETE", missing: outcome.missing ?? [] };
    }
    if (outcome.reason === "EMPTY") {
      return { scored: false, reason: "INCOMPLETE", missing: items.map((i) => i.itemKey) };
    }
    throw new MorivaError("SCORING_CONFIG_INVALID");
  }

  const result = await db.$transaction(async (tx) => {
    // CAS: only score from an open state; concurrent complete/abandon loses here → 409 via P2025.
    await tx.assessmentSession.updateMany({
      where: { id: session.id, status: { in: ["CREATED", "IN_PROGRESS"] } },
      data: { status: "SCORED", completedAt: new Date() },
    });
    return tx.assessmentResult.upsert({
      where: { sessionId: session.id },
      create: {
        sessionId: session.id,
        rawScore: outcome.rawScore,
        transformedScore: outcome.transformedScore,
        interpretationCode: outcome.interpretationCode,
        ruleVersion: session.instrumentVersion.scoringVersion,
        limitationsContentVersion: "limitations-v1",
      },
      update: {},
    });
  });
  await audit({ actorId: userId, actorRole: "INDIVIDUAL", subjectId: userId, action: "ASSESSMENT_COMPLETED", resourceType: "assessment_result", resourceId: result.id, outcome: "ALLOW", metadata: { interpretationCode: outcome.interpretationCode } });
  return { scored: true, resultId: result.id, interpretationCode: outcome.interpretationCode, rawScore: outcome.rawScore, transformedScore: outcome.transformedScore };
}

export async function listUserSessions(userId: string, opts: { limit?: number; cursor?: string | null } = {}) {
  const limit = Math.min(100, Math.max(1, opts.limit ?? 20));
  const rows = await db.assessmentSession.findMany({
    where: { userId, ...(opts.cursor ? { startedAt: { lt: new Date(opts.cursor) } } : {}) },
    orderBy: { startedAt: "desc" },
    take: limit + 1,
    include: { instrumentVersion: { include: { instrument: true } }, result: true },
  });
  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  return { items, nextCursor: hasMore ? items[items.length - 1].startedAt.toISOString() : null, hasMore };
}
