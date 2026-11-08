/**
 * Unit tests — navigation rules engine determinism (Phase 5) + consent decision logic
 * requires DB, so here we test the pure evaluateRules + pathway hash + consent proof hash.
 */
import { describe, it, expect } from "vitest";
import { evaluateRules, hashBundle, type RuleBundle } from "@/domains/navigation/service";
import { consentProofHash } from "@/domains/consent/service";

const BUNDLE: RuleBundle = {
  note: "test",
  bundles: [
    { id: "a", when: { kind: "RESULT_CODE", codes: ["DEMO_LOWER"] }, order: ["TELEMH", "COMMUNITY"], rationaleCode: "R1", rationaleTextEn: "x" },
    { id: "b", when: { kind: "NO_RESULT" }, order: ["SELF_GUIDED"], rationaleCode: "R2", rationaleTextEn: "y" },
    { id: "u", when: { kind: "URGENT_RISK_RESPONSE" }, rationaleCode: "R-URGENT", rationaleTextEn: "z" },
  ],
};

describe("navigation rule evaluation (deterministic)", () => {
  it("matches the correct band", () => {
    const { match, safetyOverride } = evaluateRules(BUNDLE, { resultCode: "DEMO_LOWER" });
    expect(match?.id).toBe("a");
    expect(safetyOverride).toBe(false);
  });
  it("no result → honest fallback, not 'low risk'", () => {
    const { match } = evaluateRules(BUNDLE, {});
    expect(match?.id).toBe("b");
  });
  it("urgent risk overrides everything", () => {
    const { match, safetyOverride } = evaluateRules(BUNDLE, { resultCode: "DEMO_LOWER", urgentRisk: true });
    expect(match?.id).toBe("u");
    expect(safetyOverride).toBe(true);
  });
  it("unknown result code → fallback bundle (never fabricated match)", () => {
    const { match } = evaluateRules(BUNDLE, { resultCode: "NOT_A_CODE" });
    expect(match?.id).toBe("b");
  });
  it("bundle hash is content-addressed", () => {
    expect(hashBundle(BUNDLE)).toBe(hashBundle({ ...BUNDLE }));
    expect(hashBundle(BUNDLE)).not.toBe(hashBundle({ ...BUNDLE, note: "changed" }));
  });
  it("determinism: same input, same output", () => {
    expect(evaluateRules(BUNDLE, { resultCode: "DEMO_LOWER" })).toEqual(evaluateRules(BUNDLE, { resultCode: "DEMO_LOWER" }));
  });
});

describe("consent proof hash", () => {
  it("is canonical — order of dataCategories does not matter", () => {
    const base = { subjectId: "u1", purpose: "REFERRAL", purposeVersion: 1, recipientType: "PROVIDER", recipientId: "p1", dataCategories: ["A", "B"], grantedAt: new Date("2026-11-08T00:00:00Z") };
    expect(consentProofHash(base)).toBe(consentProofHash({ ...base, dataCategories: ["B", "A"] }));
  });
  it("different subject/recipient/version → different hash", () => {
    const base = { subjectId: "u1", purpose: "REFERRAL", purposeVersion: 1, recipientType: "PROVIDER", recipientId: "p1", dataCategories: ["A"], grantedAt: new Date("2026-11-08T00:00:00Z") };
    expect(consentProofHash(base)).not.toBe(consentProofHash({ ...base, subjectId: "u2" }));
    expect(consentProofHash(base)).not.toBe(consentProofHash({ ...base, recipientId: "p2" }));
    expect(consentProofHash(base)).not.toBe(consentProofHash({ ...base, purposeVersion: 2 }));
  });
});
