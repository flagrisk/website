"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Admin buttons: run every pending payout, and reconcile processing ones.
export function PayoutActions() {
  const router = useRouter();
  const [busy, setBusy] = useState<null | "run" | "reconcile">(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function call(path: string, which: "run" | "reconcile") {
    setBusy(which);
    setMsg(null);
    try {
      const res = await fetch(path, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error ?? "Something went wrong.");
      } else if (which === "run") {
        setMsg(`Processed ${data.processed ?? 0} payout(s).`);
        router.refresh();
      } else {
        setMsg(`Checked ${data.checked ?? 0} payout(s).`);
        router.refresh();
      }
    } catch {
      setMsg("Request failed.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        onClick={() => call("/api/payouts/run", "run")}
        disabled={busy !== null}
        className="rounded-[10px] bg-night px-4 py-2 text-sm font-semibold text-white transition hover:bg-dusk disabled:opacity-60"
      >
        {busy === "run" ? "Running…" : "Run pending payouts"}
      </button>
      <button
        onClick={() => call("/api/payouts/reconcile", "reconcile")}
        disabled={busy !== null}
        className="rounded-[10px] border border-line px-4 py-2 text-sm font-medium text-ink transition hover:bg-mist disabled:opacity-60"
      >
        {busy === "reconcile" ? "Checking…" : "Reconcile status"}
      </button>
      {msg && <span className="text-sm text-slate">{msg}</span>}
    </div>
  );
}
