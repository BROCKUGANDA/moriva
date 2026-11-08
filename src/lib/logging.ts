/**
 * Structured, redacting logger (PRD §21 / §19).
 * Denylist fields and value patterns are stripped before any output.
 * Questionnaire answers, journal/crisis free text, tokens and health identifiers
 * must never reach logs.
 */
const DENY_KEYS = [
  "password", "passwordhash", "token", "tokenhash", "csrftoken", "secret", "authorization", "cookie",
  "answervalue", "responsevalue", "bodytext", "notebody", "prompt", "completion", "messagetext",
  "valuetext", "answers", "responses", "journal", "crisis", "ssn", "healthid",
];

const REDACT_PATTERNS: Array<[RegExp, string]> = [
  [/\b(?:sk|pk)_[A-Za-z0-9_-]{10,}\b/g, "[REDACTED_KEY]"],
  [/Bearer\s+[A-Za-z0-9._-]{10,}/gi, "[REDACTED_TOKEN]"],
];

function redactValue(v: unknown): unknown {
  if (typeof v === "string") {
    let s = v;
    for (const [re, rep] of REDACT_PATTERNS) s = s.replace(re, rep);
    return s.length > 512 ? s.slice(0, 512) + "…[TRUNCATED]" : s;
  }
  return v;
}

function redact(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (DENY_KEYS.includes(k.toLowerCase())) {
      out[k] = "[REDACTED]";
      continue;
    }
    if (v && typeof v === "object" && !Array.isArray(v) && !(v instanceof Date)) {
      out[k] = redact(v as Record<string, unknown>);
    } else {
      out[k] = redactValue(v);
    }
  }
  return out;
}

type Level = "debug" | "info" | "warn" | "error";

function emit(level: Level, code: string, fields: Record<string, unknown> = {}) {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    code,
    ...redact(fields),
  });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const log = {
  debug: (code: string, fields?: Record<string, unknown>) => emit("debug", code, fields),
  info: (code: string, fields?: Record<string, unknown>) => emit("info", code, fields),
  warn: (code: string, fields?: Record<string, unknown>) => emit("warn", code, fields),
  error: (code: string, fields?: Record<string, unknown>) => emit("error", code, fields),
};

/** Test helper: verify redaction behaviour. */
export function redactForTest(obj: Record<string, unknown>) {
  return redact(obj);
}
