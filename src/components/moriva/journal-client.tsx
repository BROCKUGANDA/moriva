"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { InlineNotice, EmptyState } from "@/components/moriva/status";

type Entry = { id: string; bodyText: string; createdAt: string; updatedAt: string };

export function JournalClient() {
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const csrf = typeof document !== "undefined" ? document.cookie.split("; ").find((c) => c.startsWith("moriva_csrf="))?.split("=")[1] ?? "" : "";

  const load = () =>
    fetch("/api/v1/journal")
      .then((r) => r.json())
      .then((b) => setEntries(b.entries ?? []))
      .catch(() => setEntries([]));

  useEffect(() => { load(); }, []);

  async function save() {
    if (draft.trim().length === 0) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrf },
        body: JSON.stringify({ bodyText: draft.trim().slice(0, 5000) }),
      });
      if (res.ok) {
        setDraft("");
        await load();
      } else {
        const b = await res.json().catch(() => null);
        setError(b?.message ?? "Could not save. Your text is still in the box — check your connection.");
      }
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    setBusy(true);
    try {
      await fetch(`/api/v1/journal/${id}`, { method: "DELETE", headers: { "x-csrf-token": csrf } });
      await load();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-moriva-line bg-white p-5 shadow-card">
        <label htmlFor="journal-entry" className="text-sm font-semibold text-moriva-ink">Write a private note</label>
        <Textarea
          id="journal-entry"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={4}
          maxLength={5000}
          placeholder="Only you can read this…"
          className="mt-2"
        />
        {error && <InlineNotice kind="critical" className="mt-2">{error}</InlineNotice>}
        <Button onClick={save} disabled={busy || draft.trim().length === 0} className="mt-3 min-h-11 bg-moriva-teal font-semibold hover:bg-moriva-teal-soft" data-testid="journal-save">
          {busy ? "Saving…" : "Save note"}
        </Button>
      </div>

      {entries === null ? (
        <div className="h-24 animate-pulse rounded-2xl bg-muted" aria-busy="true" />
      ) : entries.length === 0 ? (
        <EmptyState title="No entries yet">Write your first note above — or don't. The journal is entirely optional.</EmptyState>
      ) : (
        <ul className="space-y-3" data-testid="journal-entries">
          {entries.map((e) => (
            <li key={e.id} className="rounded-2xl border border-moriva-line bg-white p-4">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-moriva-ink">{e.bodyText}</p>
              <div className="mt-2 flex items-center justify-between">
                <p className="text-xs text-moriva-slate">{new Date(e.createdAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}</p>
                <Button variant="ghost" onClick={() => remove(e.id)} disabled={busy} className="min-h-9 text-xs text-state-critical hover:bg-[#FAEBEC]">
                  Delete
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
