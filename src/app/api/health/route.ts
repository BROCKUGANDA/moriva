import { NextResponse } from "next/server";
import { randomToken } from "@/lib/security";
import { db } from "@/lib/db";
import { getEnv } from "@/lib/env";

/**
 * Liveness/readiness (PRD §21). Readiness checks DB + required configuration.
 * Never reports AI provider status (AI is disabled — ADR-0005).
 * Not cached; every probe hits the DB.
 */
export const dynamic = "force-dynamic";

function noStoreHeaders(requestId: string) {
  return {
    "x-request-id": requestId,
    "Cache-Control": "no-store, no-cache, must-revalidate",
    Pragma: "no-cache",
  };
}

async function check(verbose: boolean) {
  const requestId = randomToken(12);
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
  const body: Record<string, unknown> = {
    status: ready ? "ready" : "degraded",
    time: new Date().toISOString(),
    requestId,
  };
  if (verbose) {
    body.checks = { database: dbOk ? "ok" : "fail", configuration: configOk ? "ok" : "fail" };
  }
  return NextResponse.json(body, { status: ready ? 200 : 503, headers: noStoreHeaders(requestId) });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const verbose = url.searchParams.get("verbose") === "1" || (req.headers.get("x-forwarded-for") ?? "").includes("127.0.0.1");
  return check(verbose);
}

export async function HEAD() {
  const requestId = randomToken(12);
  let ok = false;
  try {
    await db.$queryRaw`SELECT 1`;
    ok = true;
  } catch {
    ok = false;
  }
  return new NextResponse(null, { status: ok ? 200 : 503, headers: noStoreHeaders(requestId) });
}
