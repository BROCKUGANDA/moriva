"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { InlineNotice, SimulationBanner } from "@/components/moriva/status";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { ArrowLeft, ArrowRight, AlertTriangle, CheckCircle2 } from "lucide-react";

type Item = {
  itemKey: string;
  ordinal: number;
  promptEn: string;
  helperEn: string | null;
  required: boolean;
  schema: { type: "ordinal"; min: number; max: number; labels: string[] };
};

type SessionData = {
  session: { id: string; status: string; locale: string };
  instrument: {
    code: string; displayName: string; simulationOnly: boolean; version: string;
    timeframe: string; validityNotes: string; riskItemKey: string | null; triggerThreshold: number;
  };
  items: Item[];
  responses: Array<{ itemKey: string; value: number | null }>;
};

export function AssessmentRunner({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [data, setData] = useState<SessionData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number | null>>({});
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [urgent, setUrgent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [csrf, setCsrf] = useState("");

  useEffect(() => {
    setCsrf(document.cookie.split("; ").find((c) => c.startsWith("moriva_csrf="))?.split("=")[1] ?? "");
    fetch(`/api/v1/assessment-sessions/${sessionId}`)
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json().catch(() => null))?.message ?? "Failed to load");
        return r.json();
      })
      .then((body) => {
        setData(body);
        const map: Record<string, number | null> = {};
        for (const r of body.responses) map[r.itemKey] = r.value;
        setAnswers(map);
      })
      .catch((e) => setLoadError(e.message));
  }, [sessionId]);

  const item = data?.items[index];
  const answeredCount = useMemo(() => data ? data.items.filter((i) => answers[i.itemKey] !== undefined && answers[i.itemKey] !== null).length : 0, [data, answers]);
  const progress = data && data.items.length > 0 ? (answeredCount / data.items.length) * 100 : 0;

  async function choose(value: number | null) {
    if (!item || !data || submitting) return;
    setSaveState("saving");
    setAnswers((a) => ({ ...a, [item.itemKey]: value }));
    try {
      const res = await fetch(`/api/v1/assessment-sessions/${sessionId}/responses/${item.itemKey}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrf },
        body: JSON.stringify({ value }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        setSaveState("error");
        return;
      }
      setSaveState("saved");
      if (body?.urgentSupportTriggered) {
        // Urgent-risk: interrupt the routine flow immediately (PRD §7.3, FR-SF-003)
        setUrgent(true);
        setTimeout(() => router.push(body.redirect), 1200);
        return;
      }
      // advance after a short beat (server-acknowledged first)
      if (index < data.items.length - 1) {
        setTimeout(() => {
          setIndex((i) => i + 1);
          setSaveState("idle");
        }, 180);
      } else {
        setSaveState("idle");
      }
    } catch {
      setSaveState("error");
    }
  }

  async function submit() {
    if (!data) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch(`/api/v1/assessment-sessions/${sessionId}/complete`, {
        method: "POST",
        headers: { "x-csrf-token": csrf },
      });
      const body = await res.json().catch(() => null);
      if (res.ok) {
        router.push(`/app/assessments/${sessionId}/result`);
        return;
      }
      if (body?.code === "ASSESSMENT_INCOMPLETE") {
        const missing = String(body?.details?.missing ?? "").split(",").filter(Boolean);
        const firstMissing = data.items.findIndex((i) => missing.includes(i.itemKey));
        if (firstMissing >= 0) setIndex(firstMissing);
        setSubmitError(body.message);
      } else {
        setSubmitError(body?.message ?? "We couldn't submit the assessment. Your answers are saved.");
      }
    } catch {
      setSubmitError("We couldn't reach the service. Your answers are saved — check your connection before leaving.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loadError) {
    return <InlineNotice kind="critical" title="We couldn't load this assessment.">Your saved answers have not been changed. Try again from the assessments page.</InlineNotice>;
  }
  if (!data) {
    return <div className="space-y-3" aria-busy="true"><div className="h-8 w-2/3 animate-pulse rounded bg-muted" /><div className="h-24 animate-pulse rounded-xl bg-muted" /></div>;
  }

  if (urgent) {
    return (
      <div role="alert" className="rounded-2xl border-2 border-state-critical bg-[#FAEBEC] p-6 text-center" data-testid="urgent-interrupt">
        <AlertTriangle aria-hidden className="mx-auto h-8 w-8 text-state-critical" />
        <h2 className="mt-2 font-display text-xl font-bold text-state-critical">Urgent support is being shown</h2>
        <p className="mt-2 text-sm text-moriva-ink/80">Regular questions have paused. Taking you to urgent help guidance…</p>
      </div>
    );
  }

  const isRiskItem = data.instrument.riskItemKey === item?.itemKey;
  const allAnswered = data.items.every((i) => !i.required || (answers[i.itemKey] !== undefined && answers[i.itemKey] !== null));

  return (
    <div className="mx-auto moriva-assessment-width">
      <SimulationBanner compact />
      <div className="mt-4 rounded-2xl border border-moriva-line bg-white p-6 shadow-card md:p-8" data-testid="assessment-runner">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-moriva-slate">
            {data.instrument.displayName} · v{data.instrument.version}
          </p>
          {data.instrument.simulationOnly && (
            <span className="rounded-full bg-[#FDEEE9] px-2.5 py-0.5 text-xs font-bold text-[#B45A3F]">SYNTHETIC DEMONSTRATION</span>
          )}
        </div>
        <Progress value={progress} className="mt-3 h-1.5" aria-label={`Progress: ${answeredCount} of ${data.items.length} answered`} />
        <p className="mt-2 text-xs text-moriva-slate" aria-live="polite">
          {answeredCount} of {data.items.length} answered · {saveState === "saving" ? "Saving your progress…" : saveState === "saved" ? "Saved" : saveState === "error" ? "Not saved — check your connection before leaving." : ""}
        </p>

        {item && (
          <div key={item.itemKey} className="mt-6">
            <p className="text-xs font-medium text-moriva-slate">Question {item.ordinal} of {data.items.length}{item.required ? "" : " · optional"}</p>
            <h2 className="mt-1 font-display text-xl font-bold leading-snug text-moriva-ink">{item.promptEn}</h2>
            {isRiskItem && item.helperEn && (
              <InlineNotice kind="warning" className="mt-3">
                {item.helperEn}
              </InlineNotice>
            )}
            {!isRiskItem && item.helperEn && <p className="mt-2 text-xs text-moriva-slate">{item.helperEn}</p>}
            <div className="mt-5 grid gap-2" role="radiogroup" aria-label={item.promptEn} data-testid={`item-${item.itemKey}`}>
              {item.schema.labels.map((label, v) => (
                <button
                  key={v}
                  role="radio"
                  aria-checked={answers[item.itemKey] === v}
                  disabled={saveState === "saving"}
                  onClick={() => choose(v)}
                  className={cn(
                    "flex min-h-12 items-center justify-between rounded-xl border px-4 py-3 text-left text-base font-medium",
                    answers[item.itemKey] === v
                      ? "border-moriva-teal bg-secondary text-moriva-ink"
                      : "border-moriva-line bg-white text-moriva-ink hover:border-moriva-teal/50 hover:bg-muted/50"
                  )}
                >
                  <span>{label}</span>
                  {answers[item.itemKey] === v && <CheckCircle2 aria-hidden className="h-5 w-5 text-moriva-teal" />}
                </button>
              ))}
              {!item.required && (
                <button
                  role="radio"
                  aria-checked={answers[item.itemKey] === null}
                  onClick={() => choose(null)}
                  className={cn(
                    "mt-1 min-h-11 rounded-xl border border-dashed px-4 py-2 text-sm",
                    answers[item.itemKey] === null ? "border-moriva-teal text-moriva-teal" : "border-moriva-line text-moriva-slate"
                  )}
                >
                  Prefer not to answer this one
                </button>
              )}
            </div>
          </div>
        )}

        <div className="mt-8 flex items-center justify-between">
          <Button variant="ghost" onClick={() => setIndex((i) => Math.max(0, i - 1))} disabled={index === 0 || saveState === "saving"} className="min-h-11">
            <ArrowLeft aria-hidden className="mr-1 h-4 w-4" /> Back
          </Button>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={() => setIndex((i) => Math.min(data.items.length - 1, i + 1))}
              disabled={index === data.items.length - 1 || saveState === "saving"}
              className="min-h-11"
            >
              Skip ahead <ArrowRight aria-hidden className="ml-1 h-4 w-4" />
            </Button>
            <Button
              onClick={submit}
              disabled={!allAnswered || submitting || urgent}
              className="min-h-11 bg-moriva-teal font-bold hover:bg-moriva-teal-soft"
              data-testid="assessment-submit"
            >
              {submitting ? "Checking…" : "See my result"}
            </Button>
          </div>
        </div>
        {submitError && <InlineNotice kind="warning" className="mt-4" role="alert">{submitError}</InlineNotice>}
        <p className="mt-4 text-xs text-moriva-slate">
          {allAnswered ? "Ready to finish." : "Answer the required questions to finish. You can also pause — progress is saved after each answer."}{" "}
          <Link href="/app/assessments" className="underline underline-offset-2">Pause and leave</Link>
        </p>
      </div>
    </div>
  );
}
