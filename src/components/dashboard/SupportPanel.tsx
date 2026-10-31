"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// Account-user support. Reuses the same RPCs the mobile app calls, against the
// same Supabase project and the same signed-in user, so tickets raised here sit
// in one queue with the app's and are worked from the admin console as usual.
type Ticket = {
  id: string;
  subject: string;
  status: string;
  updated_at: string;
  last_message: string | null;
  last_sender: string | null;
};
type Msg = {
  id: string;
  sender: string;
  body: string;
  attachment_urls: string[] | null;
  created_at: string;
};

const supabase = createClient();

function timeAgo(iso: string) {
  if (!iso) return "";
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return Math.floor(diff / 60) + " mins ago";
  if (diff < 86400) return Math.floor(diff / 3600) + " hrs ago";
  return new Date(iso).toLocaleDateString("en-NG");
}
function statusPill(s: string) {
  const map: Record<string, [string, string]> = {
    open: ["warn", "Open"],
    answered: ["ok", "Answered"],
    resolved: ["mut", "Resolved"],
    closed: ["mut", "Closed"],
  };
  const [cls, label] = map[s] ?? ["mut", s || "Open"];
  return <span className={`d-pill ${cls}`}>{label}</span>;
}

export function SupportPanel() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"list" | "compose" | "thread">("list");

  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [openId, setOpenId] = useState<string | null>(null);
  const [thSubject, setThSubject] = useState("");
  const [thStatus, setThStatus] = useState("open");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [reply, setReply] = useState("");
  const [replyBusy, setReplyBusy] = useState(false);

  const loadTickets = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.rpc("my_support_tickets");
    setTickets((data as Ticket[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  const openThread = useCallback(
    async (id: string, subj: string, status: string) => {
      setOpenId(id);
      setThSubject(subj);
      setThStatus(status);
      setMsgs([]);
      setMode("thread");
      const { data } = await supabase.rpc("ticket_messages", {
        p_ticket_id: id,
      });
      setMsgs((data as Msg[]) ?? []);
    },
    [],
  );

  async function submitNew() {
    if (busy) return;
    setErr(null);
    if (!subject.trim() || !message.trim()) {
      setErr("Enter a subject and a message.");
      return;
    }
    setBusy(true);
    const { data, error } = await supabase.rpc("create_support_ticket", {
      p_subject: subject.trim(),
      p_first_message: message.trim(),
    });
    setBusy(false);
    if (error) {
      setErr(error.message || "Could not send. Please try again.");
      return;
    }
    const subj = subject.trim();
    setSubject("");
    setMessage("");
    await loadTickets();
    if (data) openThread(data as string, subj, "open");
    else setMode("list");
  }

  async function refreshThread(id: string) {
    const { data } = await supabase.rpc("ticket_messages", { p_ticket_id: id });
    setMsgs((data as Msg[]) ?? []);
  }

  async function sendReply() {
    if (replyBusy || !openId) return;
    const body = reply.trim();
    if (!body) return;
    setReplyBusy(true);
    const { error } = await supabase.rpc("send_support_message", {
      p_ticket_id: openId,
      p_body: body,
      p_attachments: [],
    });
    setReplyBusy(false);
    if (error) return;
    setReply("");
    await refreshThread(openId);
    loadTickets();
  }

  async function toggleResolved() {
    if (!openId) return;
    const next = thStatus === "resolved" ? "open" : "resolved";
    const { error } = await supabase.rpc("set_ticket_status", {
      p_ticket_id: openId,
      p_status: next,
    });
    if (error) return;
    setThStatus(next);
    loadTickets();
  }

  // ---- Thread view ----
  if (mode === "thread" && openId) {
    return (
      <section>
        <button
          className="d-linkbtn"
          style={{ marginBottom: 14 }}
          onClick={() => {
            setMode("list");
            setOpenId(null);
          }}
        >
          ← All requests
        </button>
        <h1 className="d-page-h">{thSubject || "Support request"}</h1>
        <p className="d-page-sub">{statusPill(thStatus)}</p>
        <div className="d-card">
          <div className="d-thread">
            {msgs.length ? (
              msgs.map((m) => {
                const mine = m.sender !== "support";
                return (
                  <div key={m.id} className={`d-bub ${mine ? "me" : "them"}`}>
                    <div className="who">
                      {mine ? "You" : "FlagRisk Support"} · {timeAgo(m.created_at)}
                    </div>
                    {m.body}
                    {m.attachment_urls && m.attachment_urls.length > 0 && (
                      <div style={{ marginTop: 6, display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {m.attachment_urls.map((u, i) => (
                          <a
                            key={i}
                            className="d-pill mut"
                            href={u}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            attachment
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <p className="d-note">No messages yet.</p>
            )}
          </div>
          <div style={{ marginTop: 16 }}>
            <textarea
              className="d-input"
              placeholder="Write a reply. We respond within one working day."
              value={reply}
              onChange={(e) => setReply(e.target.value)}
            />
            <div className="mt-4 flex items-center gap-3">
              <button
                className="d-btn d-btn-primary"
                onClick={sendReply}
                disabled={replyBusy || !reply.trim()}
              >
                {replyBusy ? "Sending..." : "Send reply"}
              </button>
              <button className="d-btn" onClick={toggleResolved}>
                {thStatus === "resolved" ? "Reopen" : "Mark resolved"}
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // ---- Compose view ----
  if (mode === "compose") {
    return (
      <section>
        <button
          className="d-linkbtn"
          style={{ marginBottom: 14 }}
          onClick={() => setMode("list")}
        >
          ← All requests
        </button>
        <h1 className="d-page-h">New request</h1>
        <p className="d-page-sub">
          Tell us what you need. We reply within one working day.
        </p>
        <div className="d-card" style={{ maxWidth: 620 }}>
          <label className="block" style={{ marginBottom: 14 }}>
            <span className="d-label">Subject</span>
            <input
              className="d-input"
              value={subject}
              maxLength={140}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="What is this about?"
            />
          </label>
          <label className="block">
            <span className="d-label">Message</span>
            <textarea
              className="d-input"
              value={message}
              maxLength={4000}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe the question or problem."
            />
          </label>
          {err && (
            <p className="d-err" role="alert" style={{ marginTop: 10 }}>
              {err}
            </p>
          )}
          <div className="mt-4 flex items-center gap-3">
            <button
              className="d-btn d-btn-primary"
              onClick={submitNew}
              disabled={busy}
            >
              {busy ? "Sending..." : "Send request"}
            </button>
            <button className="d-btn" onClick={() => setMode("list")}>
              Cancel
            </button>
          </div>
        </div>
      </section>
    );
  }

  // ---- List view ----
  return (
    <section>
      <div className="flex items-center justify-between" style={{ gap: 16 }}>
        <div>
          <h1 className="d-page-h">Support</h1>
          <p className="d-page-sub" style={{ marginBottom: 0 }}>
            Ask a question or report a problem. We reply within one working day.
          </p>
        </div>
        <button
          className="d-btn d-btn-primary"
          style={{ flex: "none" }}
          onClick={() => {
            setErr(null);
            setMode("compose");
          }}
        >
          New request
        </button>
      </div>

      <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 10 }}>
        {loading ? (
          <p className="d-note">Loading...</p>
        ) : tickets.length === 0 ? (
          <div className="d-card">
            <p className="d-note" style={{ margin: 0 }}>
              You have no requests yet. Start one with “New request”.
            </p>
          </div>
        ) : (
          tickets.map((t) => (
            <button
              key={t.id}
              className="d-tickrow"
              onClick={() => openThread(t.id, t.subject, t.status)}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, color: "var(--d-ink)" }}>
                  {t.subject || "Support request"}
                </div>
                {t.last_message && (
                  <div
                    style={{
                      color: "var(--d-ink-soft)",
                      fontSize: 13,
                      marginTop: 3,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {t.last_sender === "support" ? "FlagRisk: " : "You: "}
                    {t.last_message}
                  </div>
                )}
              </div>
              <div style={{ flex: "none", textAlign: "right" }}>
                {statusPill(t.status)}
                <div style={{ color: "var(--d-ink-faint)", fontSize: 12, marginTop: 6 }}>
                  {timeAgo(t.updated_at)}
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </section>
  );
}
