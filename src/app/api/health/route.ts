import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getEnv } from "@/lib/env";

/**
 * Liveness/readiness (PRD §21). Readiness checks DB + required configuration.
 * Never reports AI provider status (AI is disabled — ADR-0005).
 */
export async function GET() {
  let dbOk = false;
  try {
    await db.$queryRaw`SELECT 1`;
    dbOk = true;
  } catch {
    dbOk = false;
  }
  let configOk = false;
  try {
    const env = getEnv();
    configOk = env.databaseUrlSet;
  } catch {
    configOk = false;
  }
  const ready = dbOk && configOk;
  return NextResponse.json(
    {
      status: ready ? "ready" : "degraded",
      checks: { database: dbOk ? "ok" : "fail", configuration: configOk ? "ok" : "fail" },
      time: new Date().toISOString(),
    },
    { status: ready ? 200 : 503 }
  );
}
