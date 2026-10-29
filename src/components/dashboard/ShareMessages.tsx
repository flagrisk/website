"use client";

import { useState } from "react";

// Ready-made WhatsApp messages the member can copy and send. Written to sound
// like a real person, not a mass blast: the app is named, what it does is said
// plainly, there's no urgency, no "click now", and no mention of earning, all
// of which is what makes a link message feel like a scam.
function buildMessages(link: string) {
  return [
    {
      id: "friend",
      label: "To a friend",
      text: `I've been using FlagRisk, a Nigerian app for staying safe with the people you trust. You keep a small circle of family or friends, and if you ever feel unsafe, share a trip home, or need help, they know right away. Setting it up before you ever need it is the whole point. If you'd like to try it: ${link}`,
    },
    {
      id: "short",
      label: "Short and simple",
      text: `There's an app called FlagRisk that lets you and a few people you trust look out for each other, raise an alarm, share a trip, or flag a safety concern nearby. I thought you'd find it useful. Here's where to get it: ${link}`,
    },
    {
      id: "group",
      label: "To a group",
      text: `Hi everyone. Sharing FlagRisk, a Nigerian safety app we can use to look out for each other. You keep a small circle of people you trust, and if anyone feels unsafe or needs help, the rest know. Worth having before it's ever needed: ${link}`,
    },
  ];
}

export function ShareMessages({ referralUrl }: { referralUrl: string }) {
  const messages = buildMessages(referralUrl);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function copy(id: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Clipboard blocked; the text is selectable in the box as a fallback.
    }
  }

  return (
    <div className="mt-8">
      <h3 className="text-sm font-semibold text-ink">
        Messages you can send on WhatsApp
      </h3>
      <p className="mt-1 text-sm text-slate">
        Copy one and send it to a friend or a group. They already carry your link.
      </p>

      <div className="mt-4 space-y-3">
        {messages.map((m) => (
          <div
            key={m.id}
            className="rounded-[12px] border border-line bg-mist p-4"
          >
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="text-xs font-medium uppercase tracking-wide text-slate">
                {m.label}
              </span>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  onClick={() => copy(m.id, m.text)}
                  className="rounded-[8px] bg-night px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-dusk"
                >
                  {copiedId === m.id ? "Copied" : "Copy"}
                </button>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(m.text)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-[8px] border border-line bg-white px-3 py-1.5 text-xs font-semibold text-ink transition hover:bg-white/60"
                >
                  Send on WhatsApp
                </a>
              </div>
            </div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink">
              {m.text}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
