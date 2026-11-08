"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const ACTIONS = [
  { value: "MARK_VERIFIED", label: "Mark verified (demo)" },
  { value: "MARK_PENDING", label: "Mark pending" },
  { value: "MARK_EXPIRED", label: "Mark expired" },
  { value: "MARK_SUSPENDED", label: "Mark suspended" },
  { value: "MARK_REJECTED", label: "Mark rejected" },
];

export function OpsProviderActions({ providerId, current }: { providerId: string; current: string }) {
  const router = useRouter();
  const [action, setAction] = useState("MARK_VERIFIED");
  const [busy, setBusy] = useState(false);
  const csrf = typeof document !== "undefined" ? document.cookie.split("; ").find((c) => c.startsWith("moriva_csrf="))?.split("=")[1] ?? "" : "";

  async function apply() {
    setBusy(true);
    try {
      await fetch(`/api/v1/ops/providers/${providerId}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrf },
        body: JSON.stringify({ action }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={action} onValueChange={setAction}>
        <SelectTrigger className="min-h-11 w-44" aria-label="Verification action"><SelectValue /></SelectTrigger>
        <SelectContent>
          {ACTIONS.map((a) => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}
        </SelectContent>
      </Select>
      <Button onClick={apply} disabled={busy} variant="outline" className="min-h-11">
        {busy ? "Applying…" : "Apply"}
      </Button>
      <span className="sr-only">Current status: {current}</span>
    </div>
  );
}
