"use client";

import { useState } from "react";
import { InlineNotice } from "@/components/moriva/status";
import { Button } from "@/components/ui/button";

/**
 * AI reflection assistant surface — disabled by design (ADR-0005).
 * Shows the exact reason and the non-AI fallbacks. No skeleton-spinner pretending to load.
 */
export function AssistantDisabledPanel() {
  const [attempted, setAttempted] = useState(false);
  const [disabledMsg, setDisabledMsg] = useState<string | null>(null);

  async function tryReflect() {
    setAttempted(true);
    const csrf = document.cookie.split("; ").find((c) => c.startsWith("moriva_csrf="))?.split("=")[1] ?? "";
    const res = await fetch("/api/v1/ai/reflection", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-csrf-token": csrf },
      body: JSON.stringify({ message: "test" }),
    });
    const b = await res.json().catch(() => null);
    setDisabledMsg(b?.message ?? "The reflection assistant is unavailable.");
  }

  return (
    <section className="rounded-2xl border border-dashed border-moriva-line bg-white/70 p-5" data-testid="ai-disabled-panel">
      <h2 className="font-display text-base font-bold text-moriva-ink">AI reflection assistant</h2>
      <p className="mt-1 text-sm text-moriva-slate">
        Off in this prototype. Enabling it requires product, clinical and privacy approvals plus user opt-in and a
        passing safety evaluation — none of those exist yet, so the assistant fails closed.
      </p>
      {disabledMsg && <InlineNotice kind="info" className="mt-3">{disabledMsg}</InlineNotice>}
      <div className="mt-3 flex flex-wrap gap-2">
        <Button variant="outline" onClick={tryReflect} className="min-h-11" data-testid="ai-try-button">
          {attempted ? "Try again" : "What it would do"}
        </Button>
        <span className="self-center text-xs text-moriva-slate">Fallbacks: support options above · Help Now · your journal</span>
      </div>
    </section>
  );
}
