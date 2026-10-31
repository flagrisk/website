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
        className="d-input min-w-0 flex-1"
      />
      <button onClick={copy} className="d-btn d-btn-primary shrink-0">
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
