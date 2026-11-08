/**
 * assessment domain — pure scoring logic (PRD §8, Phase 4.2).
 * NO AI participates in scoring, thresholds or safety. All functions are deterministic
 * and unit-testable without a database.
 */

export type ResponseSchema = {
  type: "ordinal";
  min: number;
  max: number;
  labels: string[];
};

export type ItemDef = {
  itemKey: string;
  ordinal: number;
  promptEn: string;
  helperEn?: string | null;
  responseSchema: string; // JSON-encoded ResponseSchema
  required: boolean;
};

export type ResponseValue = { itemKey: string; value: number | null };

export type InterpretationBand = { min: number; max: number; code: string; titleEn: string; bodyEn: string };

export type ScoringOutcome =
  | { ok: true; rawScore: number; transformedScore: number; interpretationCode: string; band: InterpretationBand }
  | { ok: false; reason: "MISSING_REQUIRED" | "INVALID_VALUE" | "NO_BAND_DEFINED" | "EMPTY"; missing?: string[]; invalid?: string[] };

export type SafetyEvaluation = { urgent: boolean; itemKey?: string; value?: number };

export function parseSchema(item: ItemDef): ResponseSchema | null {
  try {
    const s = JSON.parse(item.responseSchema);
    if (s && s.type === "ordinal" && typeof s.min === "number" && typeof s.max === "number" && Array.isArray(s.labels)) {
      return s as ResponseSchema;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * validateResponseSet — structural validation of a response set for an instrument version.
 * Unknown items, out-of-range values and duplicate handling are detected here.
 */
export function validateResponseSet(
  items: ItemDef[],
  responses: ResponseValue[]
): { valid: boolean; problems: Array<{ code: "UNKNOWN_ITEM" | "OUT_OF_RANGE" | "DUPLICATE" | "INVALID_TYPE"; itemKey: string }> } {
  const problems: Array<{ code: "UNKNOWN_ITEM" | "OUT_OF_RANGE" | "DUPLICATE" | "INVALID_TYPE"; itemKey: string }> = [];
  const byKey = new Map(items.map((i) => [i.itemKey, i]));
  const seen = new Set<string>();
  for (const r of responses) {
    if (seen.has(r.itemKey)) {
      problems.push({ code: "DUPLICATE", itemKey: r.itemKey });
      continue;
    }
    seen.add(r.itemKey);
    const def = byKey.get(r.itemKey);
    if (!def) {
      problems.push({ code: "UNKNOWN_ITEM", itemKey: r.itemKey });
      continue;
    }
    if (r.value === null) continue; // explicit skip is structurally valid
    if (!Number.isInteger(r.value)) {
      problems.push({ code: "INVALID_TYPE", itemKey: r.itemKey });
      continue;
    }
    const schema = parseSchema(def);
    if (!schema || r.value < schema.min || r.value > schema.max) {
      problems.push({ code: "OUT_OF_RANGE", itemKey: r.itemKey });
    }
  }
  return { valid: problems.length === 0, problems };
}

/**
 * calculateScore — deterministic sum over answered ordinal items.
 * Missing required items prevent a score (no estimated/partial score is ever returned).
 * Missing OPTIONAL items are permitted and scored as unanswered (excluded, documented in
 * the result limitations).
 */
export function calculateScore(
  items: ItemDef[],
  bands: InterpretationBand[],
  responses: ResponseValue[]
): ScoringOutcome {
  const validation = validateResponseSet(items, responses);
  if (!validation.valid) {
    const invalid = validation.problems.filter((p) => p.code !== "UNKNOWN_ITEM").map((p) => p.itemKey);
    return { ok: false, reason: "INVALID_VALUE", invalid: Array.from(new Set(invalid)) };
  }
  const valueByKey = new Map(responses.map((r) => [r.itemKey, r.value]));
  const missing: string[] = [];
  let raw = 0;
  let answered = 0;
  for (const item of items) {
    const v = valueByKey.get(item.itemKey);
    if (v === undefined || v === null) {
      if (item.required) missing.push(item.itemKey);
      continue;
    }
    raw += v;
    answered += 1;
  }
  if (items.length === 0) return { ok: false, reason: "EMPTY" };
  if (answered === 0) return { ok: false, reason: "EMPTY" }; // empty session is EMPTY, not "all missing"
  if (missing.length > 0) return { ok: false, reason: "MISSING_REQUIRED", missing };
  // transformed score normalises to 0..100 scale (demonstration transformation)
  const schemaSumMax = items.reduce((acc, item) => {
    const s = parseSchema(item);
    return acc + (s ? s.max : 0);
  }, 0);
  const transformed = schemaSumMax > 0 ? Math.round((raw / schemaSumMax) * 100) : 0;
  const band = bands.find((b) => raw >= b.min && raw <= b.max);
  if (!band) return { ok: false, reason: "NO_BAND_DEFINED" };
  return { ok: true, rawScore: raw, transformedScore: transformed, interpretationCode: band.code, band };
}

/**
 * evaluateSafetyTrigger — deterministic urgent-risk check.
 * The risk item triggers at the configured threshold (demonstration rule for the synthetic
 * instrument; real instruments would use clinically approved triggers — none exist here).
 */
export function evaluateSafetyTrigger(
  riskItemKey: string | null | undefined,
  triggerThreshold: number | null | undefined,
  responses: ResponseValue[]
): SafetyEvaluation {
  if (!riskItemKey || triggerThreshold === null || triggerThreshold === undefined) return { urgent: false };
  const r = responses.find((x) => x.itemKey === riskItemKey);
  if (!r || r.value === null || r.value === undefined) return { urgent: false };
  if (r.value >= triggerThreshold) return { urgent: true, itemKey: riskItemKey, value: r.value };
  return { urgent: false };
}

/** Static trigger policy for the shipped synthetic instrument (documented in CLINICAL_SAFETY_BOUNDARIES). */
export const SYNTHETIC_TRIGGER_THRESHOLD = 2;
