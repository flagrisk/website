"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { signOutAction } from "@/lib/actions/auth";
import { formatNaira } from "@/lib/tiers";
import { REFERRAL_REWARDS, MILESTONE_LABEL } from "@/lib/referrals";
import type { Bank } from "@/lib/paystack";
import { CopyLink } from "@/components/dashboard/CopyLink";
import { PayoutForm } from "@/components/dashboard/PayoutForm";
import { PayoutAccountForm } from "@/components/dashboard/PayoutAccountForm";
import { ShareMessages } from "@/components/dashboard/ShareMessages";

export type DashData = {
  email: string;
  displayName: string;
  subTier: string;
  isPaid: boolean;
  availableNaira: number;
  earnedNaira: number;
  referralCount: number;
  rewardCounts: Record<string, number>;
  referralUrl: string;
  hasAccount: boolean;
  currentAccount: string | null;
  banks: Bank[];
  payouts: {
    id: string;
    amount_naira: number;
    status: string;
    created_at: string;
  }[];
  shareName: string;
  botNumber: string;
};

// Icons (console style: 17px stroke)
const I = {
  overview: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /></svg>
  ),
  referrals: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.6" y1="10.5" x2="15.4" y2="6.5" /><line x1="8.6" y1="13.5" x2="15.4" y2="17.5" /></svg>
  ),
  payouts: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2" /><circle cx="12" cy="12" r="3" /></svg>
  ),
  account: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-6 8-6s8 2 8 6" /></svg>
  ),
};

function PayoutStatus({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "warn",
    processing: "warn",
    paid: "ok",
    failed: "bad",
    reversed: "bad",
  };
  return <span className={`d-pill ${map[status] ?? "mut"}`}>{status}</span>;
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
}) {
  return (
    <div className="d-stat">
      <p className="n">{value}</p>
      <p className="l">{label}</p>
      {hint && <p className="h">{hint}</p>}
    </div>
  );
}

export function DashboardShell({ data }: { data: DashData }) {
  const [active, setActive] = useState("overview");

  const maxReward =
    REFERRAL_REWARDS.signup +
    REFERRAL_REWARDS.circle +
    REFERRAL_REWARDS.paid_plan;

  const sections: { key: string; label: string; icon: ReactNode }[] = [
    { key: "overview", label: "Overview", icon: I.overview },
    { key: "referrals", label: "Invite and earn", icon: I.referrals },
    { key: "payouts", label: "Payouts", icon: I.payouts },
    { key: "account", label: "Account", icon: I.account },
  ];

  return (
    <main className="dash">
      <header className="d-topbar">
        <div className="flex items-center justify-between px-5 py-3.5">
          <Link
            href="/"
            className="flex items-center gap-2"
            aria-label="FlagRisk home"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/img/logo.png" alt="" className="h-7 w-7 rounded-[7px]" />
            <span className="d-word">FlagRisk</span>
          </Link>
          <div className="flex items-center gap-4">
            <span
              className="hidden text-[13px] sm:inline"
              style={{ color: "var(--d-ink-soft)" }}
            >
              {data.email}
            </span>
            <form action={signOutAction}>
              <button className="d-btn">Log out</button>
            </form>
          </div>
        </div>
      </header>

      <div className="d-shell">
        <nav className="d-side" aria-label="Dashboard">
          <div className="d-navgroup">Menu</div>
          {sections.map((s) => (
            <button
              key={s.key}
              className={`d-navitem${active === s.key ? " active" : ""}`}
              onClick={() => setActive(s.key)}
              aria-current={active === s.key ? "page" : undefined}
            >
              {s.icon}
              <span>{s.label}</span>
            </button>
          ))}
        </nav>

        <div className="d-content">
          {active === "overview" && (
            <section>
              <h1 className="d-page-h">
                Welcome{data.displayName ? `, ${data.displayName}` : ""}
              </h1>
              <p className="d-page-sub">
                Your plan, your circle, your earnings.
              </p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Stat label="Current plan" value={data.subTier} />
                <Stat
                  label="Available to withdraw"
                  value={formatNaira(data.availableNaira)}
                />
                <Stat
                  label="Earned in total"
                  value={formatNaira(data.earnedNaira)}
                />
                <Stat label="People joined" value={data.referralCount} />
              </div>
              <div className="mt-6 grid gap-6 md:grid-cols-2">
                <div className="d-card">
                  <h2 className="d-eyebrow">Your plan</h2>
                  <p className="d-big">{data.subTier}</p>
                  <p className="d-note" style={{ marginTop: 4 }}>
                    {data.isPaid ? "Active" : "Free plan, upgrade any time"}
                  </p>
                  <Link
                    href="/plans"
                    className="d-btn d-btn-primary"
                    style={{ marginTop: 18 }}
                  >
                    {data.isPaid ? "Change plan" : "Upgrade"}
                  </Link>
                </div>
                <div className="d-card">
                  <h2 className="d-eyebrow">Referral earnings</h2>
                  <p className="d-big">{formatNaira(data.availableNaira)}</p>
                  <p className="d-note" style={{ marginTop: 4 }}>
                    available ·{" "}
                    <button
                      onClick={() => setActive("payouts")}
                      className="d-linkbtn"
                    >
                      withdraw
                    </button>
                  </p>
                </div>
              </div>
            </section>
          )}

          {active === "referrals" && (
            <section>
              <h1 className="d-page-h">Invite and earn</h1>
              <p className="d-page-sub">
                Share your link. You earn up to {formatNaira(maxReward)} for
                every person who joins, builds a circle, and starts a paid plan.
              </p>
              <div className="d-card">
                <h2 className="d-eyebrow">Your invite link</h2>
                <div className="mt-3 max-w-[520px]">
                  <CopyLink url={data.referralUrl} />
                </div>
                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  <Stat label="People joined" value={data.referralCount} />
                  {(
                    Object.keys(REFERRAL_REWARDS) as Array<
                      keyof typeof REFERRAL_REWARDS
                    >
                  ).map((m) => (
                    <Stat
                      key={m}
                      label={MILESTONE_LABEL[m]}
                      value={data.rewardCounts[m] ?? 0}
                      hint={`${formatNaira(REFERRAL_REWARDS[m])} each`}
                    />
                  ))}
                </div>
                <ShareMessages
                  shareName={data.shareName}
                  botNumber={data.botNumber}
                />
              </div>
            </section>
          )}

          {active === "payouts" && (
            <section>
              <h1 className="d-page-h">Payouts</h1>
              <p className="d-page-sub">
                Withdraw your referral earnings and manage where they are sent.
              </p>
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="d-card">
                  <h2 className="d-eyebrow">Withdraw</h2>
                  <p className="d-big">{formatNaira(data.availableNaira)}</p>
                  <p className="d-note" style={{ marginTop: 4 }}>
                    available to withdraw
                  </p>
                  <div className="mt-4">
                    <PayoutForm
                      available={data.availableNaira}
                      hasAccount={data.hasAccount}
                    />
                  </div>
                </div>
                <div className="d-card">
                  <h2 className="d-eyebrow">Payout account</h2>
                  <p className="d-note" style={{ margin: "8px 0 14px" }}>
                    Where we send your earnings when you withdraw.
                  </p>
                  <PayoutAccountForm
                    banks={data.banks}
                    current={data.currentAccount}
                  />
                </div>
              </div>
              <div className="d-card mt-6">
                <h2 className="d-eyebrow">Withdrawals</h2>
                {data.payouts.length > 0 ? (
                  <table className="d-table" style={{ marginTop: 14 }}>
                    <tbody>
                      {data.payouts.map((p) => (
                        <tr key={p.id}>
                          <td style={{ fontWeight: 600 }}>
                            {formatNaira(p.amount_naira)}
                          </td>
                          <td style={{ color: "var(--d-ink-soft)" }}>
                            {new Date(p.created_at).toLocaleDateString("en-NG")}
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <PayoutStatus status={p.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="d-note" style={{ marginTop: 12 }}>
                    No withdrawals yet.
                  </p>
                )}
              </div>
            </section>
          )}

          {active === "account" && (
            <section>
              <h1 className="d-page-h">Account</h1>
              <p className="d-page-sub">Your sign-in and plan.</p>
              <div className="d-card" style={{ maxWidth: 520 }}>
                <table className="d-table">
                  <tbody>
                    <tr>
                      <td style={{ color: "var(--d-ink-soft)" }}>Name</td>
                      <td style={{ textAlign: "right", fontWeight: 600 }}>
                        {data.displayName || "Not set"}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ color: "var(--d-ink-soft)" }}>Email</td>
                      <td style={{ textAlign: "right", fontWeight: 600 }}>
                        {data.email}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ color: "var(--d-ink-soft)" }}>Plan</td>
                      <td style={{ textAlign: "right", fontWeight: 600 }}>
                        {data.subTier}
                      </td>
                    </tr>
                  </tbody>
                </table>
                <div className="mt-4 flex items-center gap-3">
                  <Link href="/plans" className="d-btn d-btn-primary">
                    {data.isPaid ? "Change plan" : "Upgrade"}
                  </Link>
                  <form action={signOutAction}>
                    <button className="d-btn">Log out</button>
                  </form>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}
