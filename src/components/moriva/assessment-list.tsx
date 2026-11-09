"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { InlineNotice, StatusBadge } from "@/components/moriva/status";
import { getDictionary } from "@/i18n/dictionaries";

type SessionRow = {
  id: string; instrument: string; instrumentVersion: string; simulationOnly: boolean;
  status: string; startedAt: string; completedAt: string | null; interpretationCode: string | null;
};

const LICENCE_COPY: Record<string, string> = {
  SYNTHETIC_NO_RIGHTS_REQUIRED: "Synthetic content — no third-party rights required",
};
const STATUS_COPY: Record<string, { label: string; tone: "success" | "neutral" | "teal" }> = {
  SCORED: { label: "Completed", tone: "success" },
  IN_PROGRESS: { label: "In progress", tone: "teal" },
  ABANDONED: { label: "Paused", tone: "neutral" },
};

/**
 * Assessment picker + list of the signed-in person's sessions.
 */
export function AssessmentList() {
  const [sessions, setSessions] = useState<SessionRow[] | null>(null);
  const [instruments, setInstruments] = useState<Array<{
    id: string; displayName: string; ownerSource: string; construct: string;
    simulationOnly: boolean; status: string;
    version: { version: string; timeframe: string; itemCount: number; estimatedMinutes: number; licenceStatus: string; validityNotes: string };
  }> | null>(null);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const t = getDictionary("en");

  useEffect(() => {
    Promise.all([
      fetch("/api/v1/assessment-sessions").then((r) => r.json()),
      fetch("/api/v1/instruments").then((r) => r.json()),
    ])
      .then(([s, i]) => {
        setSessions(s.data ?? s.sessions ?? []);
        setInstruments(i.instruments ?? []);
      })
      .catch(() => {
        setSessions([]);
        setInstruments([]);
      });
  }, []);

  async function start() {
    setStarting(true);
    setStartError(null);
    const csrf = document.cookie.split("; ").find((c) => c.startsWith("moriva_csrf="))?.split("=")[1] ?? "";
    try {
      const res = await fetch("/api/v1/assessment-sessions", { method: "POST", headers: { "x-csrf-token": csrf, "Idempotency-Key": `session-${Date.now()}` } });
      const body = await res.json().catch(() => null);
      if (res.ok) window.location.href = `/app/assessments/${body.sessionId}`;
      else setStartError(body?.message ?? "Could not start the assessment.");
    } finally {
      setStarting(false);
    }
  }

  return (
    <div className="space-y-8">
      <section aria-labelledby="available">
        <h2 id="available" className="font-display text-xl font-bold text-moriva-ink">Available</h2>
        {instruments === null ? (
          <div className="mt-3 h-24 animate-pulse rounded-xl bg-muted" aria-busy="true" />
        ) : instruments.length === 0 ? (
          <div className="mt-3 rounded-2xl border border-dashed border-moriva-line bg-white/60 p-6 text-center text-sm text-moriva-slate">
            No questionnaires are available right now. You can still explore general support options or write in your journal.
          </div>
        ) : (
          instruments.map((inst) => (
            <article key={inst.id} className="mt-3 rounded-2xl border border-moriva-line bg-white p-6 shadow-card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-display text-lg font-bold text-moriva-ink">{inst.displayName}</h3>
                  <p className="mt-1 text-sm text-moriva-slate">
                    Purpose: self-reflection about your wellbeing · Covers: {inst.version.timeframe.replace(/_/g, " ").toLowerCase()} ·
                    About {inst.version.estimatedMinutes} minutes · {inst.version.itemCount} questions · You can pause any time.
                  </p>
                </div>
                {inst.simulationOnly && <StatusBadge tone="coral">SYNTHETIC DEMONSTRATION</StatusBadge>}
              </div>
              <p className="mt-2 text-xs text-moriva-slate">{inst.version.validityNotes}</p>
              <p className="mt-1 text-xs text-moriva-slate" title={`Internal record — source: ${inst.ownerSource} · id: ${inst.id}`}>
                Source: MORIVA prototype (authored demonstration content) · Version {inst.version.version} · Licence: {LICENCE_COPY[inst.version.licenceStatus] ?? inst.version.licenceStatus.toLowerCase().replace(/_/g, " ")}
              </p>
              <Button onClick={start} disabled={starting} className="mt-4 min-h-12 bg-moriva-teal px-6 font-bold hover:bg-moriva-teal-soft" data-testid="start-assessment">
                {starting ? "Preparing…" : "Start"}
              </Button>
              {startError && <InlineNotice kind="critical" className="mt-3">{startError}</InlineNotice>}
            </article>
          ))
        )}
      </section>

      <section aria-labelledby="previous">
        <h2 id="previous" className="font-display text-xl font-bold text-moriva-ink">Your sessions</h2>
        {sessions === null ? (
          <div className="mt-3 h-20 animate-pulse rounded-xl bg-muted" aria-busy="true" />
        ) : sessions.length === 0 ? (
          <p className="mt-3 text-sm text-moriva-slate">Nothing here yet — that's completely fine.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {sessions.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-moriva-line bg-white px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-moriva-ink">{s.instrument} <span className="font-normal text-moriva-slate">v{s.instrumentVersion}</span></p>
                  <p className="text-xs text-moriva-slate">
                    Started {new Date(s.startedAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}
                    {s.completedAt ? ` · completed ${new Date(s.completedAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}` : " · in progress"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge tone={STATUS_COPY[s.status]?.tone ?? "teal"}>{STATUS_COPY[s.status]?.label ?? s.status.toLowerCase().replace(/_/g, " ")}</StatusBadge>
                  {s.status === "SCORED" ? (
                    <Link href={`/app/assessments/${s.id}/result`} className="min-h-11 rounded-lg bg-moriva-teal px-3 py-2 text-sm font-semibold text-white hover:bg-moriva-teal-soft">
                      View result
                    </Link>
                  ) : (
                    <Link href={`/app/assessments/${s.id}`} className="min-h-11 rounded-lg border border-moriva-teal px-3 py-2 text-sm font-semibold text-moriva-teal hover:bg-secondary">
                      Resume
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
