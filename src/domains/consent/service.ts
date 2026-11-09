/**
 * consent domain — central server-side consent enforcement (PRD §11, Phase 3.5).
 * requireConsent is the single gate used by referral, context-sharing and export flows.
 * No implicit consent. Revoke blocks future disclosure. Optimistic checks at read AND dispatch time.
 */
import { createHash } from "crypto";
import { db } from "@/lib/db";
import { MorivaError } from "@/lib/errors";

export type PurposeCode =
  | "ACCOUNT_SECURITY"
  | "ASSESSMENT_STORAGE"
  | "JOURNAL_STORAGE"
  | "AI_PROCESSING"
  | "REFERRAL"
  | "HEALTH_CONTEXT_SHARE"
  | "FOLLOWUP_NOTIFICATIONS"
  | "RESEARCH"
  | "MARKETING";

export type RecipientType = "PLATFORM" | "PROVIDER" | "RESEARCH" | "NONE";

export type ConsentCheck = {
  subjectId: string;
  purpose: PurposeCode;
  recipientType?: RecipientType;
  recipientId?: string | null;
  dataCategories?: string[];
  now?: Date;
};

export type ConsentDecision = {
  granted: boolean;
  reason: "NO_CONSENT" | "REVOKED" | "EXPIRED" | "GRANTED";
  consentEventId?: string;
};

/** Canonical hash of the consent capture — stored as proof metadata. */
export function consentProofHash(input: {
  subjectId: string; purpose: string; purposeVersion: number;
  recipientType: string; recipientId?: string | null; dataCategories: string[];
  grantedAt: Date;
}): string {
  const canonical = JSON.stringify([
    input.subjectId, input.purpose, input.purposeVersion,
    input.recipientType, input.recipientId ?? null,
    [...input.dataCategories].sort(), input.grantedAt.toISOString(),
  ]);
  return createHash("sha256").update(canonical).digest("hex");
}

/**
 * THE consent gate. Every disclosure path must call this.
 * Checks the newest GRANTED event for (subject, purpose, recipient).
 * - REVOKED event (even a newer revoked one) blocks.
 * - expiry is honoured.
 * - recipient change requires a new consent event (handled by callers passing recipient).
 */
export async function checkConsent(input: ConsentCheck): Promise<ConsentDecision> {
  const now = input.now ?? new Date();
  const events = await db.consentEvent.findMany({
    where: {
      subjectUserId: input.subjectId,
      purposeCode: input.purpose,
      ...(input.recipientType ? { recipientType: input.recipientType } : {}),
      ...(input.recipientId ? { recipientId: input.recipientId } : {}),
    },
    orderBy: { grantedAt: "desc" },
    take: 5,
  });
  if (events.length === 0) return { granted: false, reason: "NO_CONSENT" };
  const latest = events[0];
  if (latest.status === "REVOKED") return { granted: false, reason: "REVOKED", consentEventId: latest.id };
  if (latest.expiresAt && latest.expiresAt.getTime() < now.getTime()) {
    return { granted: false, reason: "EXPIRED", consentEventId: latest.id };
  }
  if (latest.status !== "GRANTED") return { granted: false, reason: "NO_CONSENT", consentEventId: latest.id };
  // data-category scope: consent must cover every requested category
  const covered = new Set((latest.dataCategories ?? "").split("|").filter(Boolean));
  const requested = input.dataCategories ?? [];
  if (requested.some((c) => !covered.has(c))) {
    return { granted: false, reason: "NO_CONSENT", consentEventId: latest.id };
  }
  return { granted: true, reason: "GRANTED", consentEventId: latest.id };
}

/** Throwing variant used inside services (fail closed). */
export async function requireConsent(input: ConsentCheck): Promise<string> {
  const decision = await checkConsent(input);
  if (!decision.granted) {
    const code = decision.reason === "REVOKED" ? "CONSENT_REVOKED"
      : decision.reason === "EXPIRED" ? "CONSENT_EXPIRED"
      : "CONSENT_REQUIRED";
    throw new MorivaError(code, {
      details: { field: "purpose" },
    });
  }
  return decision.consentEventId!;
}

/** Grant a purpose (never pre-checked; explicit action only). */
const ALLOWED_DATA_CATEGORIES = ["CONTACT_DETAILS", "REFERRAL_REASON", "ASSESSMENT_SUMMARY", "HEALTH_CONTEXT", "JOURNAL", "NOTIFICATIONS"];
export async function grantConsent(input: {
  subjectId: string; actorId?: string;
  purpose: PurposeCode; recipientType?: RecipientType; recipientId?: string | null;
  dataCategories?: string[]; expiresAt?: Date | null;
}) {
  const purposeDef = await db.consentPurpose.findFirst({
    where: { code: input.purpose, retiredAt: null },
    orderBy: { version: "desc" },
  });
  if (!purposeDef) throw new MorivaError("VALIDATION_FAILED", { details: { field: "purpose" } });
  const dataCategories = input.dataCategories ?? [];
  if (dataCategories.some((c) => !ALLOWED_DATA_CATEGORIES.includes(c))) {
    throw new MorivaError("VALIDATION_FAILED", { details: { field: "dataCategories" } });
  }
  if (input.expiresAt && input.expiresAt.getTime() <= Date.now()) {
    throw new MorivaError("VALIDATION_FAILED", { details: { field: "expiresAt" }, messageOverride: "Expiry must be a future date." });
  }
  const grantedAt = new Date();
  const proof = consentProofHash({
    subjectId: input.subjectId,
    purpose: input.purpose,
    purposeVersion: purposeDef.version,
    recipientType: input.recipientType ?? "PLATFORM",
    recipientId: input.recipientId ?? null,
    dataCategories,
    grantedAt,
  });
  return db.consentEvent.create({
    data: {
      subjectUserId: input.subjectId,
      purposeCode: input.purpose,
      purposeVersion: purposeDef.version,
      recipientType: input.recipientType ?? "PLATFORM",
      recipientId: input.recipientId ?? null,
      dataCategories: dataCategories.join("|"),
      status: "GRANTED",
      grantedAt,
      expiresAt: input.expiresAt ?? null,
      proofHash: proof,
      actorId: input.actorId ?? input.subjectId,
    },
  });
}

/** Revoke: blocks every future disclosure under this purpose (+optional recipient). Cascades to health-context shares. */
export async function revokeConsent(input: {
  subjectId: string; actorId?: string;
  purpose: PurposeCode; recipientId?: string | null;
}) {
  const where: Record<string, unknown> = {
    subjectUserId: input.subjectId,
    purposeCode: input.purpose,
    status: "GRANTED",
    ...(input.recipientId ? { recipientId: input.recipientId } : {}),
  };
  const now = new Date();
  const result = await db.consentEvent.updateMany({ where, data: { status: "REVOKED", revokedAt: now } });
  if (result.count > 0) {
    await db.healthContextShare.updateMany({
      where: { userId: input.subjectId, revokedAt: null, expiresAt: { gt: now } },
      data: { revokedAt: now },
    }).catch(() => null);
  }
  return result.count;
}

/** Current consent ledger rows for the privacy centre. */
export async function listConsents(subjectId: string, limit = 100) {
  const rows = await db.consentEvent.findMany({
    where: { subjectUserId: subjectId },
    orderBy: { grantedAt: "desc" },
    take: Math.min(100, Math.max(1, limit)),
  });
  // group to latest per (purpose, recipient)
  const seen = new Map<string, (typeof rows)[number]>();
  for (const r of rows) {
    const key = `${r.purposeCode}:${r.recipientType}:${r.recipientId ?? ""}`;
    if (!seen.has(key)) seen.set(key, r);
  }
  const purposeDefs = await db.consentPurpose.findMany({ where: { retiredAt: null }, orderBy: { version: "desc" } });
  const defByCode = new Map<string, (typeof purposeDefs)[number]>();
  for (const d of purposeDefs) if (!defByCode.has(d.code)) defByCode.set(d.code, d);
  return Array.from(seen.values()).map((r) => {
    const def = defByCode.get(r.purposeCode);
    return {
      id: r.id,
      purpose: r.purposeCode,
      purposeTitle: def?.titleEn ?? r.purposeCode,
      purposeTitleAr: def?.titleAr ?? null,
      wordingVersion: r.purposeVersion,
      required: def?.required ?? false,
      recipientType: r.recipientType,
      recipientId: r.recipientId,
      dataCategories: (r.dataCategories ?? "").split("|").filter(Boolean),
      status: r.expiresAt && r.expiresAt.getTime() < new Date().getTime() && r.status === "GRANTED" ? "EXPIRED" : r.status,
      grantedAt: r.grantedAt,
      revokedAt: r.revokedAt,
      expiresAt: r.expiresAt,
    };
  });
}
