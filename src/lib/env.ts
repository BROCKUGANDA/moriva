/**
 * Startup environment validation. Fails closed: missing critical config refuses boot.
 * Never prints secret values — only names and validity.
 */
export type EnvSnapshot = {
  nodeEnv: "development" | "production" | "test";
  demoMode: boolean;
  databaseUrlSet: boolean;
  sessionTtlHours: number;
  aiReflectionEnabled: false;
  smallCellThreshold: number;
};

export class EnvValidationError extends Error {}

export function readEnv(source: Record<string, string | undefined> = process.env): EnvSnapshot {
  const nodeEnvRaw = (source.NODE_ENV ?? "development").toLowerCase();
  if (!["development", "production", "test"].includes(nodeEnvRaw)) {
    throw new EnvValidationError("NODE_ENV must be development|production|test");
  }
  const nodeEnv = nodeEnvRaw as EnvSnapshot["nodeEnv"];

  const demoRaw = (source.DEMO_MODE ?? "true").toLowerCase();
  if (!["true", "false"].includes(demoRaw)) {
    throw new EnvValidationError("DEMO_MODE must be true or false");
  }
  const demoMode = demoRaw === "true";

  // AC-TE-10 / FR-ID-005: demo mode can never run in production.
  if (demoMode && nodeEnv === "production") {
    throw new EnvValidationError(
      "Refusing to start: DEMO_MODE=true is forbidden when NODE_ENV=production"
    );
  }

  const databaseUrlSet = Boolean(source.DATABASE_URL && source.DATABASE_URL.length > 0);
  if (!databaseUrlSet) {
    throw new EnvValidationError("DATABASE_URL is required");
  }

  const ttlRaw = source.SESSION_TTL_HOURS ?? "8";
  const sessionTtlHours = Number(ttlRaw);
  if (!Number.isFinite(sessionTtlHours) || sessionTtlHours < 1 || sessionTtlHours > 24) {
    throw new EnvValidationError("SESSION_TTL_HOURS must be a number between 1 and 24");
  }

  const aiRaw = (source.AI_REFLECTION_ENABLED ?? "false").toLowerCase();
  // ADR-0005: AI is hard-disabled in this prototype regardless of env value.
  const aiReflectionEnabled = false as const;
  if (aiRaw === "true") {
    // Not a boot failure (ops may set it aspirationally) but it is clamped off with a recorded flag.
    console.warn(
      JSON.stringify({ level: "warn", code: "AI_FLAG_CLAMPED", message: "AI_REFLECTION_ENABLED=true is ignored; AI is disabled by ADR-0005 until approvals exist." })
    );
  }

  const smallCellThreshold = Number(source.SMALL_CELL_THRESHOLD ?? "5");
  if (!Number.isFinite(smallCellThreshold) || smallCellThreshold < 1 || smallCellThreshold > 20) {
    throw new EnvValidationError("SMALL_CELL_THRESHOLD must be between 1 and 20");
  }

  return { nodeEnv, demoMode, databaseUrlSet, sessionTtlHours, aiReflectionEnabled, smallCellThreshold };
}

let cached: EnvSnapshot | null = null;
export function getEnv(): EnvSnapshot {
  if (!cached) cached = readEnv();
  return cached;
}
