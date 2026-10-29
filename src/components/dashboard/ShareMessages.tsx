"use client";

import { useState } from "react";

// WhatsApp invite messages the member copies and sends to friends or groups.
// The goal is virality INTO the FlagRisk WhatsApp line (the bot), not the
// website: the link opens the FlagRisk line with the bot's established invite
// sentence pre-typed, "Start FlagRisk. {name} introduced me". No codes, no
// odd-looking links, nothing that reads as a hack attempt.
function buildMessages(botLink: string) {
  return [
    {
      id: "friend",
      label: "To a friend",
      text: `I use FlagRisk to stay safe with the people I trust, right here on WhatsApp. You keep a small circle of family or friends, and if anyone ever feels unsafe or needs help, the others know at once. No app to download. To try it, open the FlagRisk line here and send the message that comes up: ${botLink}`,
    },
    {
      id: "short",
      label: "Short and simple",
      text: `FlagRisk lets you and a few people you trust look out for each other on WhatsApp, raise an alarm, share a trip home, or flag a safety concern nearby. I thought you'd find it useful. Open the FlagRisk line and send the message that comes up: ${botLink}`,
    },
    {
      id: "group",
      label: "To a group",
      text: `Hi everyone. Sharing FlagRisk, a Nigerian safety service we can use right here on WhatsApp to look out for each other. You keep a small circle of people you trust, and if anyone feels unsafe or needs help, the rest know. Open the FlagRisk line and send the message that comes up: ${botLink}`,
    },
  ];
}

export function ShareMessages({
  shareName,
  botNumber,
}: {
  shareName: string;
  botNumber: string;
}) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!botNumber) {
    return (
      <div className="mt-8">
        <h3 className="text-sm font-semibold text-ink">
          Invite on WhatsApp
        </h3>
        <p className="mt-1 text-sm text-slate">
          WhatsApp invites will appear here once the FlagRisk line is connected.
        </p>
      </div>
    );
  }

  // The friend sends this to the FlagRisk line. The bot credits the referrer by
  // matching the name against their bot share_name, so we use that exact name.
  // Without a share_name we send a plain "Start FlagRisk" so no one is credited
  // by mistake; the person still lands in the safety menu.
  const invite = shareName
    ? `Start FlagRisk. ${shareName} introduced me`
    : "Start FlagRisk";
  const botLink = `https://wa.me/${botNumber}?text=${encodeURIComponent(invite)}`;
  const messages = buildMessages(botLink);

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
        Copy one and send it to a friend or a group. The link opens the FlagRisk
        line with your invite ready to send.
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
