/**
 * ai domain — fail-closed reflection assistant adapter (ADR-0005, PRD §20).
 * The feature is DISABLED in this prototype: every request path returns AI_DISABLED
 * without any external call. Guarded pipeline structure retained for future activation.
 */
import { MorivaError } from "@/lib/errors";
import { getEnv } from "@/lib/env";
import { db } from "@/lib/db";
import { audit } from "@/domains/audit/service";

export type ReflectionRequest = {
  userId: string;
  message: string; // never logged
  consentAcknowledged: boolean;
};

export type ReflectionResponse = {
  reply: string;
  citations: string[];
  meta: { disabled: true; reason: string };
};

/** Deterministic safety pre-check (runs BEFORE any model call in future versions). */
export function preCheckSafety(message: string): { urgent: boolean; matchedOn?: string } {
  const urgentPatterns = [
    /\bkill (?:myself)\b/i, /\bsuicid/i, /\bend (?:my|this) life\b/i, /\bhurt(?:ing)? myself\b/i,
    /\bself[- ]harm\b/i, /\bharm (?:someone|another|them|him|her)\b/i, /\bno reason to live\b/i,
  ];
  for (const p of urgentPatterns) {
    if (p.test(message)) return { urgent: true, matchedOn: "urgent-pattern" };
  }
  return { urgent: false };
}

/**
 * The only entry point. Fail-closed: no consent check can pass because the flag is off.
 * Even if the flag were flipped, consent + safety gates would still run first.
 */
export async function reflect(input: ReflectionRequest): Promise<ReflectionResponse> {
  const env = getEnv();
  const flag = await db.featureFlag.findUnique({ where: { key: "AI_REFLECTION_ENABLED" } }).catch(() => null);

  await audit({
    actorId: input.userId,
    action: "AI_REQUEST_ATTEMPTED",
    resourceType: "ai_reflection",
    outcome: "DENY",
    metadata: { reason: "feature_disabled", flagEnv: env.aiReflectionEnabled, flagDb: flag?.enabled ?? false },
  });

  // Even before the flag check: urgent content routes to safety, never to a model.
  const safety = preCheckSafety(input.message);

  throw new MorivaError("AI_DISABLED", {
    details: { safetyHint: safety.urgent ? "urgent-language-detected" : "none" },
    messageOverride: "The reflection assistant is unavailable in this prototype. Your assessment and support options are still available.",
  });
}
