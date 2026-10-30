"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatNaira } from "@/lib/tiers";

export type MemberRow = {
  id: string;
  name: string;
  phone: string;
  tier: string;
  earned: number;
  referred: number;
  joined: string | null;
};
export type ReferralRow = {
  referrer: string;
  referred: string;
  milestones: string[];
  date: string | null;
};
export type PayoutRow = {
  id: string;
  member: string;
  amount: number;
  status: string;
  failureReason: string | null;
  created: string;
};
export type TopRef = { name: string; amount: number };
export type Metrics = {
  referred: number;
  earned: number;
  paidOut: number;
  pendingSum: number;
  pendingCount: number;
};

type SectionKey = "overview" | "members" | "referrals" | "payouts";

const NAV: { key: SectionKey; label: string; icon: React.ReactNode }[] = [
  { key: "overview", label: "Overview", icon: <GridIcon /> },
  { key: "members", label: "Members", icon: <PeopleIcon /> },
  { key: "referrals", label: "Referrals", icon: <ShareIcon /> },
  { key: "payouts", label: "Payouts", icon: <CashIcon /> },
];

const MILESTONES: { key: string; label: string }[] = [
  { key: "signup", label: "Joined" },
  { key: "circle", label: "Circle" },
  { key: "paid_plan", label: "Paid" },
];

function fmtDate(d: string | null) {
  return d ? new Date(d).toLocaleDateString("en-NG") : "—";
}

export function AdminConsole({
  adminEmail,
  metrics,
  members,
  referrals,
  payouts,
  topReferrers,
}: {
  adminEmail: string;
  metrics: Metrics;
  members: MemberRow[];
  referrals: ReferralRow[];
  payouts: PayoutRow[];
  topReferrers: TopRef[];
}) {
  const router = useRouter();
  const [section, setSection] = useState<SectionKey>("overview");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    try {
      const t = localStorage.getItem("fr-admin-theme");
      if (t === "dark" || t === "light") setTheme(t);
    } catch {
      /* ignore */
    }
  }, []);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    try {
      localStorage.setItem("fr-admin-theme", next);
    } catch {
      /* ignore */
    }
  }

  async function post(path: string, body?: object) {
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    return res.json().catch(() => ({}));
  }

  async function runPayouts() {
    setBusy("run");
    setNote(null);
    const r = await post("/api/payouts/run");
    setNote(`Processed ${r.processed ?? 0} payout(s).`);
    setBusy(null);
    router.refresh();
  }
  async function reconcile() {
    setBusy("reconcile");
    setNote(null);
    const r = await post("/api/payouts/reconcile");
    setNote(`Checked ${r.checked ?? 0} payout(s).`);
    setBusy(null);
    router.refresh();
  }
  async function retry(id: string) {
    setBusy(id);
    await post("/api/payouts/retry", { payout_id: id });
    setBusy(null);
    router.refresh();
  }

  const filteredMembers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return members;
    return members.filter(
      (m) =>
        m.name.toLowerCase().includes(q) || m.phone.toLowerCase().includes(q),
    );
  }, [query, members]);

  return (
    <div className="fr-console" data-theme={theme}>
      <div className="topbar">
        <span className="wordmark">FlagRisk</span>
        <span className="tag">Console</span>
        <span className="spacer" />
        <span className="who">{adminEmail}</span>
        <button className="btn-ghost" onClick={toggleTheme}>
          {theme === "dark" ? "Light" : "Dark"}
        </button>
        <Link href="/dashboard" className="btn-ghost">
          Dashboard
        </Link>
      </div>

      <div className="app-shell">
        <nav className="sidenav">
          <div className="nav-label">Manage</div>
          {NAV.map((n) => (
            <button
              key={n.key}
              className={`navitem${section === n.key ? " active" : ""}`}
              onClick={() => setSection(n.key)}
            >
              {n.icon}
              <span>{n.label}</span>
              {n.key === "payouts" && (
                <span
                  className={`nav-count${metrics.pendingCount === 0 ? " zero" : ""}`}
                >
                  {metrics.pendingCount}
                </span>
              )}
            </button>
          ))}
        </nav>

        <main className="main">
          {section === "overview" && (
            <div className="panel">
              <div className="panel-head">
                <h1>Overview</h1>
                <span className="sub">Referrals and payouts at a glance.</span>
              </div>
              <div className="stat-grid">
                <Stat p={0} n={String(metrics.referred)} l="People referred" />
                <Stat p={1} n={formatNaira(metrics.earned)} l="Rewards earned" />
                <Stat p={2} n={formatNaira(metrics.paidOut)} l="Paid out" />
                <Stat
                  p={3}
                  n={formatNaira(metrics.pendingSum)}
                  l={`Pending (${metrics.pendingCount})`}
                />
              </div>
              <div className="card" style={{ maxWidth: 520 }}>
                <h3>Top referrers</h3>
                {topReferrers.length > 0 ? (
                  <table className="data-table" style={{ boxShadow: "none" }}>
                    <tbody>
                      {topReferrers.map((r, i) => (
                        <tr key={i}>
                          <td>
                            {i + 1}. {r.name}
                          </td>
                          <td className="num">{formatNaira(r.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="muted-text">No referral earnings yet.</p>
                )}
              </div>
            </div>
          )}

          {section === "members" && (
            <div className="panel">
              <div className="panel-head">
                <h1>Members</h1>
                <span className="sub">{members.length} on the site</span>
              </div>
              <input
                className="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name or phone"
              />
              {filteredMembers.length > 0 ? (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Member</th>
                      <th>Phone</th>
                      <th>Plan</th>
                      <th className="num">Referred</th>
                      <th className="num">Earned</th>
                      <th>Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMembers.map((m) => (
                      <tr key={m.id}>
                        <td>{m.name || m.id.slice(0, 8)}</td>
                        <td>{m.phone || "—"}</td>
                        <td style={{ textTransform: "capitalize" }}>{m.tier}</td>
                        <td className="num">{m.referred}</td>
                        <td className="num">{formatNaira(m.earned)}</td>
                        <td>{fmtDate(m.joined)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="empty">No members match that search.</div>
              )}
            </div>
          )}

          {section === "referrals" && (
            <div className="panel">
              <div className="panel-head">
                <h1>Referrals</h1>
                <span className="sub">Who introduced whom, and how far.</span>
              </div>
              {referrals.length > 0 ? (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Referrer</th>
                      <th>Referred</th>
                      <th>Milestones</th>
                      <th>When</th>
                    </tr>
                  </thead>
                  <tbody>
                    {referrals.map((r, i) => (
                      <tr key={i}>
                        <td>{r.referrer}</td>
                        <td>{r.referred}</td>
                        <td>
                          <span style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                            {MILESTONES.map((m) => (
                              <span
                                key={m.key}
                                className={`pill ${r.milestones.includes(m.key) ? "ok" : "muted"}`}
                              >
                                {m.label}
                              </span>
                            ))}
                          </span>
                        </td>
                        <td>{fmtDate(r.date)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="empty">No referrals yet.</div>
              )}
            </div>
          )}

          {section === "payouts" && (
            <div className="panel">
              <div className="panel-head">
                <h1>Payouts</h1>
                <span className="sub">
                  Run pending withdrawals as Paystack transfers.
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "center",
                  flexWrap: "wrap",
                  marginBottom: 20,
                }}
              >
                <button
                  className="btn primary"
                  onClick={runPayouts}
                  disabled={busy !== null}
                >
                  {busy === "run" ? "Running…" : "Run pending payouts"}
                </button>
                <button
                  className="btn"
                  onClick={reconcile}
                  disabled={busy !== null}
                >
                  {busy === "reconcile" ? "Checking…" : "Reconcile status"}
                </button>
                {note && <span className="muted-text">{note}</span>}
              </div>

              {payouts.length > 0 ? (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Member</th>
                      <th className="num">Amount</th>
                      <th>Status</th>
                      <th>Requested</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {payouts.map((p) => (
                      <tr key={p.id}>
                        <td>{p.member}</td>
                        <td className="num">{formatNaira(p.amount)}</td>
                        <td>
                          <span
                            className={`pill ${
                              p.status === "paid"
                                ? "ok"
                                : p.status === "failed"
                                  ? "bad"
                                  : "warn"
                            }`}
                          >
                            {p.status}
                          </span>
                          {p.status === "failed" && p.failureReason && (
                            <span
                              className="muted-text"
                              style={{ display: "block", marginTop: 4, color: "var(--ember)" }}
                            >
                              {p.failureReason}
                            </span>
                          )}
                        </td>
                        <td>{fmtDate(p.created)}</td>
                        <td className="num">
                          {p.status === "failed" && (
                            <button
                              className="btn small"
                              onClick={() => retry(p.id)}
                              disabled={busy !== null}
                            >
                              {busy === p.id ? "…" : "Retry"}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="empty">No withdrawals yet.</div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function Stat({ p, n, l }: { p: number; n: string; l: string }) {
  return (
    <div className={`stat-card p${p}`}>
      <div className="n">{n}</div>
      <div className="l">{l}</div>
    </div>
  );
}

/* Minimal inline icons */
function GridIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}
function PeopleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20c0-3 3-5 6-5s6 2 6 5" />
      <path d="M16 11a3 3 0 0 0 0-6" />
      <path d="M18 20c0-2-1-3.5-2.5-4.3" />
    </svg>
  );
}
function ShareIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="18" cy="5" r="2.5" />
      <circle cx="6" cy="12" r="2.5" />
      <circle cx="18" cy="19" r="2.5" />
      <path d="M8.2 10.8 15.8 6.2M8.2 13.2l7.6 4.6" />
    </svg>
  );
}
function CashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  );
}
