/**
 * navigation domain — deterministic pathway rules engine (PRD §9, Phase 5).
 * Versioned rule bundles, typed result contract, rationale codes. No AI input, ever.
 * Unknown/missing inputs are NOT treated as low risk (fallback bundle is honest).
 */
import { createHash } from "crypto";
import { db } from "@/lib/db";
import { MorivaError } from "@/lib/errors";

export type CareLevel = "SELF_GUIDED" | "COMMUNITY" | "PRIMARY_CARE" | "TELEMH" | "SPECIALIST" | "EMERGENCY";

export type NavigationResult = {
  ruleVersion: string;
  rulesStatus: "DEMO_APPROVED" | "APPROVED";
  options: Array<{
    optionId: string;
    serviceCategory: CareLevel;
    rationaleCode: string;
    rationaleText: string;
    urgencyLabel: "general" | "soon" | "urgent";
    providerServiceIds: string[];
  }>;
  requiresHumanReview: boolean;
  safetyOverride: boolean;
  note: string;
};

export type RuleBundle = {
  note: string;
  bundles: Array<{
    id: string;
    when: { kind: "RESULT_CODE"; codes: string[] } | { kind: "NO_RESULT" } | { kind: "URGENT_RISK_RESPONSE" };
    offer?: string[];
    order?: string[];
    rationaleCode: string;
    rationaleTextEn: string;
  }>;
};

export function hashBundle(bundle: RuleBundle): string {
  return createHash("sha256").update(JSON.stringify(bundle)).digest("hex");
}

/** Pure rule evaluation — deterministic and unit-testable. */
export function evaluateRules(
  bundle: RuleBundle,
  input: { resultCode?: string | null; urgentRisk?: boolean }
): { match: (typeof bundle.bundles)[number] | null; safetyOverride: boolean } {
  if (input.urgentRisk) {
    const urgent = bundle.bundles.find((b) => b.when.kind === "URGENT_RISK_RESPONSE") ?? null;
    return { match: urgent, safetyOverride: true };
  }
  if (!input.resultCode) {
    const fallback = bundle.bundles.find((b) => b.when.kind === "NO_RESULT") ?? null;
    return { match: fallback, safetyOverride: false };
  }
  const match = bundle.bundles.find((b) => b.when.kind === "RESULT_CODE" && b.when.codes.includes(input.resultCode!)) ?? null;
  if (!match) {
    // Unknown result code (e.g., unrecognised instrument version) → honest fallback, never a fabricated match
    const fallback = bundle.bundles.find((b) => b.when.kind === "NO_RESULT") ?? null;
    return { match: fallback, safetyOverride: false };
  }
  return { match, safetyOverride: false };
}

const CATEGORY_LABELS: Record<string, string> = {
  SELF_GUIDED: "Self-guided resources",
  COMMUNITY: "Community support",
  PRIMARY_CARE: "Primary healthcare",
  TELEMH: "Tele-mental health",
  SPECIALIST: "Specialist mental-health services",
  EMERGENCY: "Emergency services",
};

/**
 * Service: resolve the active rule bundle (status + expiry validated) and produce
 * the typed NavigationResult. Expired/missing rules → PATHWAY_UNAVAILABLE behaviour
 * handled by the caller (generic options + Help Now).
 */
export async function navigate(input: {
  resultCode?: string | null;
  urgentRisk?: boolean;
  regionCode?: string;
}): Promise<NavigationResult> {
  const regionCode = input.regionCode ?? "AE-AZ";
  const rule = await db.pathwayRule.findFirst({
    where: { jurisdiction: regionCode, status: { in: ["DEMO_APPROVED", "APPROVED"] } },
    orderBy: { effectiveAt: "desc" },
  });
  if (!rule) throw new MorivaError("PATHWAY_UNAVAILABLE");
  if (rule.expiryAt && rule.expiryAt.getTime() < Date.now()) {
    throw new MorivaError("PATHWAY_UNAVAILABLE");
  }
  const bundle = JSON.parse(rule.rulesJson) as RuleBundle;
  const { match, safetyOverride } = evaluateRules(bundle, input);

  // attach eligible provider services per category (verified + active only)
  const servicesByCategory = new Map<string, string[]>();
  if (match?.order) {
    const services = await db.providerService.findMany({
      where: {
        status: "ACTIVE",
        careLevel: { in: match.order },
        provider: { verificationStatus: "DEMO_VERIFIED_SIMULATED" },
      },
      select: { id: true, careLevel: true },
    });
    for (const s of services) {
      const arr = servicesByCategory.get(s.careLevel) ?? [];
      arr.push(s.id);
      servicesByCategory.set(s.careLevel, arr);
    }
  }

  const options = (match?.order ?? ["SELF_GUIDED", "COMMUNITY", "PRIMARY_CARE", "TELEMH"]).map((cat, i) => ({
    optionId: `${match?.id ?? "fallback"}-${cat}-${i}`,
    serviceCategory: cat as CareLevel,
    rationaleCode: match?.rationaleCode ?? "R-GENERAL-FALLBACK",
    rationaleText: match?.rationaleTextEn ?? "General support options while personalised rules are unavailable. Urgent help is always available.",
    urgencyLabel: (safetyOverride ? "urgent" : i === 0 ? "general" : "general") as "general" | "soon" | "urgent",
    providerServiceIds: servicesByCategory.get(cat) ?? [],
  }));

  return {
    ruleVersion: rule.version,
    rulesStatus: rule.status as "DEMO_APPROVED" | "APPROVED",
    options,
    requiresHumanReview: safetyOverride,
    safetyOverride,
    note: bundle.note,
  };
}
