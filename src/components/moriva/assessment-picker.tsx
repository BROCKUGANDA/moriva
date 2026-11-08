"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/moriva/status";

/** Optional: pick which (already completed) assessment result to include in the referral. */
export function AssessmentPicker({ sessions }: { sessions: Array<{ id: string; name: string; version: string; code: string; completedAt: string }> }) {
  const [selected, setSelected] = useState<string>("");
  if (sessions.length === 0) return null;
  return (
    <div className="mt-3 rounded-2xl border border-moriva-line bg-white p-4">
      <Label htmlFor="result-select" className="text-sm font-semibold">Include a result summary (optional)</Label>
      <select
        id="result-select"
        value={selected}
        onChange={(e) => {
          setSelected(e.target.value);
          window.dispatchEvent(new CustomEvent("moriva:result-selected", { detail: e.target.value || null }));
        }}
        className="mt-1 min-h-11 w-full rounded-lg border border-moriva-line bg-white px-3 text-sm"
      >
        <option value="">Don't include a result</option>
        {sessions.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name} v{s.version} — {s.code} ({new Date(s.completedAt).toLocaleDateString("en-GB")})
          </option>
        ))}
      </select>
      <p className="mt-1 text-xs text-moriva-slate">Only the result title and version would be shared — never your individual answers.</p>
    </div>
  );
}
