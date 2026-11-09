"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { InlineNotice, EmptyState, StatusBadge } from "@/components/moriva/status";
import { GlyphCareContext } from "@/components/moriva/glyphs";

type Item = { id: string; itemType: string; valueText: string; sourceType: string; recordedAt: string };

const TYPES = [
  { value: "CONDITION", label: "Physical health condition" },
  { value: "MEDICATION", label: "Current medication" },
  { value: "CONCERN", label: "Care concern" },
  { value: "FUNCTION", label: "Daily functioning (sleep, work, activities)" },
  { value: "CARE_FOLLOWUP", label: "Ongoing care / follow-up" },
];

export function HealthContextClient() {
  const [items, setItems] = useState<Item[] | null>(null);
  const [type, setType] = useState("CONDITION");
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const csrf = typeof document !== "undefined" ? document.cookie.split("; ").find((c) => c.startsWith("moriva_csrf="))?.split("=")[1] ?? "" : "";

  const load = () =>
    fetch("/api/v1/health-context")
      .then((r) => r.json())
      .then((b) => setItems(b.data ?? b.items ?? []))
      .catch(() => setItems([]));
  useEffect(() => { load(); }, []);

  async function add() {
    if (!value.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/health-context", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrf, "Idempotency-Key": `hc-${Date.now()}` },
        body: JSON.stringify({ itemType: type, valueText: value.trim().slice(0, 500) }),
      });
      if (res.ok) {
        setValue("");
        await load();
      } else {
        const b = await res.json().catch(() => null);
        setError(b?.message ?? "Could not add this item.");
      }
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    setBusy(true);
    try {
      await fetch(`/api/v1/health-context/${id}`, { method: "DELETE", headers: { "x-csrf-token": csrf } });
      await load();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-moriva-line bg-white p-5 shadow-card">
        <h2 className="font-display text-base font-bold text-moriva-ink">Add a context item</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_2fr_auto]">
          <div>
            <Label htmlFor="hc-type">Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger id="hc-type" className="mt-1 min-h-11"><SelectValue /></SelectTrigger>
              <SelectContent>
                {TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="hc-value">What should a provider know?</Label>
            <Input id="hc-value" value={value} onChange={(e) => setValue(e.target.value)} maxLength={500} placeholder="e.g., Type 2 diabetes, managed with metformin" className="mt-1" />
          </div>
          <div className="flex items-end">
            <Button onClick={add} disabled={busy || !value.trim()} className="min-h-11 w-full bg-moriva-teal font-semibold hover:bg-moriva-teal-soft sm:w-auto">
              {busy ? "Saving…" : "Add"}
            </Button>
          </div>
        </div>
        {error && <InlineNotice kind="critical" className="mt-3">{error}</InlineNotice>}
        <p className="mt-2 text-xs text-moriva-slate">Stored as self-reported context with today's date. Medication lists are never used to recommend or change medication.</p>
      </div>

      {items === null ? (
        <div className="h-24 animate-pulse rounded-2xl bg-muted" aria-busy="true" />
      ) : items.length === 0 ? (
        <EmptyState title="No context items" icon={<GlyphCareContext className="h-6 w-6" />}>
          Add only what's relevant. A short summary is more useful to a provider than a full history.
        </EmptyState>
      ) : (
        <ul className="space-y-2" data-testid="health-context-items">
          {items.map((i) => (
            <li key={i.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-moriva-line bg-white px-4 py-3">
              <div>
                <p className="text-sm font-medium text-moriva-ink">{i.valueText}</p>
                <p className="text-xs text-moriva-slate">
                  {TYPES.find((t) => t.value === i.itemType)?.label ?? i.itemType} · {i.sourceType.toLowerCase().replace(/_/g, " ")} · {new Date(i.recordedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge tone="neutral">{i.sourceType === "SELF_REPORTED" ? "self-reported" : i.sourceType.toLowerCase()}</StatusBadge>
                <Button variant="ghost" onClick={() => remove(i.id)} disabled={busy} className="min-h-9 text-xs text-state-critical hover:bg-[#FAEBEC]">Remove</Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
