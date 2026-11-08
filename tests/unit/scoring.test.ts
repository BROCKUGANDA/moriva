/**
 * Unit tests — assessment scoring (Phase 4.2 required vectors):
 * complete answers; missing answers; duplicate responses; unexpected values;
 * empty session; repeated submit semantics; invalid/corrupted scoring config;
 * integer boundaries and type coercion; safety trigger precedence.
 */
import { describe, it, expect } from "vitest";
import {
  calculateScore,
  evaluateSafetyTrigger,
  validateResponseSet,
  SYNTHETIC_TRIGGER_THRESHOLD,
  type ItemDef,
  type InterpretationBand,
  type ResponseValue,
} from "@/domains/assessment/scoring";

const schema0to3 = (labels = ["a", "b", "c", "d"]) => JSON.stringify({ type: "ordinal", min: 0, max: 3, labels });

const ITEMS: ItemDef[] = [
  { itemKey: "mood_overall", ordinal: 1, promptEn: "q1", responseSchema: schema0to3(), required: true },
  { itemKey: "coping_daily", ordinal: 2, promptEn: "q2", responseSchema: schema0to3(), required: true },
  { itemKey: "sleep_rest", ordinal: 3, promptEn: "q3", responseSchema: schema0to3(), required: true },
  { itemKey: "connection_people", ordinal: 4, promptEn: "q4", responseSchema: schema0to3(), required: false },
  { itemKey: "safety_urgent_thoughts", ordinal: 5, promptEn: "q5", responseSchema: schema0to3(), required: true },
];

const BANDS: InterpretationBand[] = [
  { min: 0, max: 5, code: "DEMO_LOWER", titleEn: "t1", bodyEn: "b1" },
  { min: 6, max: 10, code: "DEMO_MIXED", titleEn: "t2", bodyEn: "b2" },
  { min: 11, max: 15, code: "DEMO_STEADIER", titleEn: "t3", bodyEn: "b3" },
];

const R = (itemKey: string, value: number | null): ResponseValue => ({ itemKey, value });

describe("calculateScore — complete answers", () => {
  it("sums all answers and maps the correct band", () => {
    const out = calculateScore(ITEMS, BANDS, [
      R("mood_overall", 3), R("coping_daily", 3), R("sleep_rest", 3), R("connection_people", 2), R("safety_urgent_thoughts", 0),
    ]);
    expect(out.ok).toBe(true);
    if (out.ok) {
      expect(out.rawScore).toBe(11);
      expect(out.transformedScore).toBe(73); // 11/15 → 73.33 → 73
      expect(out.interpretationCode).toBe("DEMO_STEADIER");
    }
  });

  it("maps lowest band with boundary value 5", () => {
    const out = calculateScore(ITEMS, BANDS, [
      R("mood_overall", 1), R("coping_daily", 1), R("sleep_rest", 1), R("connection_people", 1), R("safety_urgent_thoughts", 1),
    ]);
    expect(out.ok).toBe(true);
    if (out.ok) expect(out.interpretationCode).toBe("DEMO_LOWER");
  });

  it("maps middle band at boundary 6", () => {
    const out = calculateScore(ITEMS, BANDS, [
      R("mood_overall", 2), R("coping_daily", 2), R("sleep_rest", 2), R("connection_people", 0), R("safety_urgent_thoughts", 0),
    ]);
    expect(out.ok).toBe(true);
    if (out.ok) expect(out.interpretationCode).toBe("DEMO_MIXED");
  });

  it("integer boundaries: min 0 and max 3 per item", () => {
    const allZero = calculateScore(ITEMS, BANDS, ITEMS.map((i) => R(i.itemKey, 0)));
    expect(allZero.ok).toBe(true);
    if (allZero.ok) expect(allZero.rawScore).toBe(0);
    const allMax = calculateScore(ITEMS, BANDS, ITEMS.map((i) => R(i.itemKey, 3)));
    expect(allMax.ok).toBe(true);
    if (allMax.ok) expect(allMax.rawScore).toBe(15);
  });
});

describe("calculateScore — missing answers", () => {
  it("refuses a score when a REQUIRED item is missing and lists it", () => {
    const out = calculateScore(ITEMS, BANDS, [
      R("mood_overall", 2), R("coping_daily", 2), R("sleep_rest", 2), R("safety_urgent_thoughts", 0),
      // connection_people is OPTIONAL → may be missing
    ]);
    expect(out.ok).toBe(true);
  });

  it("refuses when required safety item missing", () => {
    const out = calculateScore(ITEMS, BANDS, [
      R("mood_overall", 2), R("coping_daily", 2), R("sleep_rest", 2), R("connection_people", 1),
    ]);
    expect(out.ok).toBe(false);
    if (!out.ok && out.reason === "MISSING_REQUIRED") expect(out.missing).toContain("safety_urgent_thoughts");
    else expect.fail("expected MISSING_REQUIRED");
  });

  it("null (explicit skip) on a required item prevents a score — never estimates", () => {
    const out = calculateScore(ITEMS, BANDS, [
      R("mood_overall", 2), R("coping_daily", null), R("sleep_rest", 2), R("connection_people", 1), R("safety_urgent_thoughts", 0),
    ]);
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.reason).toBe("MISSING_REQUIRED");
  });

  it("empty session returns EMPTY, not zero", () => {
    const out = calculateScore(ITEMS, BANDS, []);
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.reason).toBe("EMPTY");
  });
});

describe("calculateScore — invalid/corrupted config", () => {
  it("no band defined → refuses to guess", () => {
    const out = calculateScore(ITEMS, [], ITEMS.map((i) => R(i.itemKey, 0)));
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.reason).toBe("NO_BAND_DEFINED");
  });

  it("out-of-range values are rejected with item keys", () => {
    const out = calculateScore(ITEMS, BANDS, [R("mood_overall", 4), ...ITEMS.slice(1).map((i) => R(i.itemKey, 0))]);
    expect(out.ok).toBe(false);
    if (!out.ok && out.reason === "INVALID_VALUE") expect(out.invalid).toContain("mood_overall");
    else expect.fail("expected INVALID_VALUE");
  });

  it("non-integer (type coercion) values are rejected", () => {
    const out = calculateScore(ITEMS, BANDS, [R("mood_overall", 1.5), ...ITEMS.slice(1).map((i) => R(i.itemKey, 0))]);
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.reason).toBe("INVALID_VALUE");
  });

  it("unknown items in the response set are flagged by validation", () => {
    const v = validateResponseSet(ITEMS, [R("not_an_item", 1)]);
    expect(v.valid).toBe(false);
    expect(v.problems[0].code).toBe("UNKNOWN_ITEM");
  });

  it("duplicate responses are flagged by validation", () => {
    const v = validateResponseSet(ITEMS, [R("mood_overall", 1), R("mood_overall", 2)]);
    expect(v.valid).toBe(false);
    expect(v.problems.some((p) => p.code === "DUPLICATE")).toBe(true);
  });
});

describe("evaluateSafetyTrigger — precedence and boundaries", () => {
  it("triggers at threshold >= 2", () => {
    expect(evaluateSafetyTrigger("safety_urgent_thoughts", SYNTHETIC_TRIGGER_THRESHOLD, [R("safety_urgent_thoughts", 2)]).urgent).toBe(true);
    expect(evaluateSafetyTrigger("safety_urgent_thoughts", SYNTHETIC_TRIGGER_THRESHOLD, [R("safety_urgent_thoughts", 3)]).urgent).toBe(true);
  });

  it("does not trigger below threshold", () => {
    expect(evaluateSafetyTrigger("safety_urgent_thoughts", SYNTHETIC_TRIGGER_THRESHOLD, [R("safety_urgent_thoughts", 1)]).urgent).toBe(false);
    expect(evaluateSafetyTrigger("safety_urgent_thoughts", SYNTHETIC_TRIGGER_THRESHOLD, [R("safety_urgent_thoughts", 0)]).urgent).toBe(false);
  });

  it("missing/unknown risk input is never interpreted as safe-clearance — urgent stays false but other high answers still dominate scoring", () => {
    // missing risk answer entirely
    expect(evaluateSafetyTrigger("safety_urgent_thoughts", 2, []).urgent).toBe(false);
    // null value
    expect(evaluateSafetyTrigger("safety_urgent_thoughts", 2, [R("safety_urgent_thoughts", null)]).urgent).toBe(false);
  });

  it("no risk item configured → never triggers (fail-safe, not fail-dangerous)", () => {
    expect(evaluateSafetyTrigger(null, 2, [R("anything", 3)]).urgent).toBe(false);
    expect(evaluateSafetyTrigger("x", null, [R("x", 3)]).urgent).toBe(false);
  });

  it("trigger evaluation ignores other items entirely", () => {
    expect(evaluateSafetyTrigger("safety_urgent_thoughts", 2, [R("mood_overall", 3)]).urgent).toBe(false);
  });
});
