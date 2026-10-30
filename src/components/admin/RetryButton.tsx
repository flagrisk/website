"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Retry one failed payout.
export function RetryButton({ payoutId }: { payoutId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function retry() {
    setBusy(true);
    try {
      const res = await fetch("/api/payouts/retry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payout_id: payoutId }),
      });
      await res.json().catch(() => ({}));
      router.refresh();
    } catch {
      // leave it; admin can try again
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={retry}
      disabled={busy}
      className="rounded-[8px] border border-line px-2.5 py-1 text-xs font-medium text-ink transition hover:bg-mist disabled:opacity-60"
    >
      {busy ? "Retrying…" : "Retry"}
    </button>
  );
}
