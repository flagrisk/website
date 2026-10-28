"use client";

import { useState } from "react";

export function CopyLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked; the input is selectable as a fallback.
    }
  }

  return (
    <div className="flex items-stretch gap-2">
      <input
        readOnly
        value={url}
        onFocus={(e) => e.currentTarget.select()}
        className="min-w-0 flex-1 rounded-[10px] border border-line bg-mist px-3 py-2 text-sm text-ink"
      />
      <button
        onClick={copy}
        className="shrink-0 rounded-[10px] bg-night px-4 py-2 text-sm font-semibold text-white transition hover:bg-dusk"
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
