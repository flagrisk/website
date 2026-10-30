import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { createServiceClient } from "@/lib/supabase/server";
import { formatNaira } from "@/lib/tiers";
import { PayoutActions } from "@/components/admin/PayoutActions";
import { RetryButton } from "@/components/admin/RetryButton";
import { MembersTable, type MemberRow } from "@/components/admin/MembersTable";

export const metadata: Metadata = { title: "Admin" };
export const instant = false;

const MILESTONE_SHORT: Record<string, string> = {
  signup: "Joined",
  circle: "Circle",
  paid_plan: "Paid",
};

export default async function AdminPage() {
  const admin = await requireAdmin();
  if (!admin) redirect("/dashboard");

  const db = createServiceClient();

  const [
    { data: codes },
    { data: referrals },
    { data: rewards },
    { data: payouts },
  ] = await Promise.all([
    db.from("referral_codes").select("user_id, created_at"),
    db.from("referrals").select("referrer_id, referred_id, created_at"),
    db
      .from("referral_rewards")
      .select("referrer_id, referred_id, milestone, amount_naira"),
    db
      .from("payouts")
      .select("id, user_id, amount_naira, status, failure_reason, created_at")
      .order("created_at", { ascending: false }),
  ]);

  // One profiles lookup for everyone who appears anywhere.
  const ids = new Set<string>();
  for (const c of codes ?? []) ids.add(c.user_id);
  for (const r of referrals ?? []) {
    ids.add(r.referrer_id);
    ids.add(r.referred_id);
  }
  for (const p of payouts ?? []) ids.add(p.user_id);

  const nameById: Record<string, string> = {};
  const phoneById: Record<string, string> = {};
  const tierById: Record<string, string> = {};
  if (ids.size > 0) {
    const { data: profiles } = await db
      .from("profiles")
      .select("id, display_name, phone, current_tier")
      .in("id", Array.from(ids));
    for (const p of profiles ?? []) {
      nameById[p.id] = p.display_name ?? "";
      phoneById[p.id] = p.phone ?? "";
      tierById[p.id] = p.current_tier ?? "basic";
    }
  }

  // Aggregates.
  const earnedByReferrer: Record<string, number> = {};
  for (const r of rewards ?? [])
    earnedByReferrer[r.referrer_id] =
      (earnedByReferrer[r.referrer_id] ?? 0) + r.amount_naira;

  const referredByReferrer: Record<string, number> = {};
  for (const r of referrals ?? [])
    referredByReferrer[r.referrer_id] =
      (referredByReferrer[r.referrer_id] ?? 0) + 1;

  const milestonesByReferred: Record<string, string[]> = {};
  for (const r of rewards ?? []) {
    (milestonesByReferred[r.referred_id] ??= []).push(r.milestone);
  }

  // Metrics.
  const totalReferred = referrals?.length ?? 0;
  const totalEarned = (rewards ?? []).reduce((s, r) => s + r.amount_naira, 0);
  const paidOut = (payouts ?? [])
    .filter((p) => p.status === "paid")
    .reduce((s, p) => s + p.amount_naira, 0);
  const pending = (payouts ?? []).filter(
    (p) => p.status === "pending" || p.status === "processing",
  );
  const pendingSum = pending.reduce((s, p) => s + p.amount_naira, 0);

  // Members (everyone with a referral code is a web member).
  const members: MemberRow[] = (codes ?? [])
    .map((c) => ({
      id: c.user_id,
      name: nameById[c.user_id] ?? "",
      phone: phoneById[c.user_id] ?? "",
      tier: tierById[c.user_id] ?? "basic",
      earned: earnedByReferrer[c.user_id] ?? 0,
      referred: referredByReferrer[c.user_id] ?? 0,
      joined: c.created_at,
    }))
    .sort((a, b) => b.earned - a.earned || a.name.localeCompare(b.name));

  // Referral attributions, newest first.
  const referralRows = (referrals ?? [])
    .map((r) => ({
      referrer: nameById[r.referrer_id] || r.referrer_id.slice(0, 8),
      referred: nameById[r.referred_id] || r.referred_id.slice(0, 8),
      date: r.created_at,
      milestones: milestonesByReferred[r.referred_id] ?? [],
    }))
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  const topReferrers = Object.entries(earnedByReferrer)
    .map(([id, amount]) => ({ id, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 10);

  return (
    <main className="min-h-screen bg-mist">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-[1040px] items-center justify-between px-5 py-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-[7px] bg-night text-lime font-bold text-sm">
              F!
            </span>
            <span className="font-semibold text-night">FlagRisk admin</span>
          </div>
          <Link href="/dashboard" className="text-sm text-slate hover:text-ink">
            Back to dashboard
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-[1040px] px-5 py-10">
        <h1 className="text-2xl font-semibold text-night">Referrals and payouts</h1>

        {/* Section nav */}
        <nav className="mt-4 flex flex-wrap gap-4 text-sm text-slate">
          <a href="#overview" className="hover:text-ink">Overview</a>
          <a href="#members" className="hover:text-ink">Members</a>
          <a href="#referrals" className="hover:text-ink">Referrals</a>
          <a href="#payouts" className="hover:text-ink">Payouts</a>
        </nav>

        {/* Metrics */}
        <div id="overview" className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="People referred" value={String(totalReferred)} />
          <Metric label="Rewards earned" value={formatNaira(totalEarned)} />
          <Metric label="Paid out" value={formatNaira(paidOut)} />
          <Metric
            label="Pending payouts"
            value={formatNaira(pendingSum)}
            hint={`${pending.length} request(s)`}
          />
        </div>

        {/* Members */}
        <section
          id="members"
          className="mt-8 scroll-mt-6 rounded-[14px] border border-line bg-white p-6"
        >
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate">
            Members ({members.length})
          </h2>
          <p className="mt-2 mb-4 text-sm text-ink">
            Everyone with a FlagRisk account on the site, with what they&apos;ve
            referred and earned.
          </p>
          {members.length > 0 ? (
            <MembersTable members={members} />
          ) : (
            <p className="text-sm text-slate">No members yet.</p>
          )}
        </section>

        {/* Referrals */}
        <section
          id="referrals"
          className="mt-6 scroll-mt-6 rounded-[14px] border border-line bg-white p-6"
        >
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate">
            Referrals
          </h2>
          {referralRows.length > 0 ? (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate">
                    <th className="pb-2 font-medium">Referrer</th>
                    <th className="pb-2 font-medium">Referred</th>
                    <th className="pb-2 font-medium">Milestones</th>
                    <th className="pb-2 font-medium">When</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {referralRows.map((r, i) => (
                    <tr key={i}>
                      <td className="py-2.5 text-ink">{r.referrer}</td>
                      <td className="py-2.5 text-ink">{r.referred}</td>
                      <td className="py-2.5">
                        <div className="flex flex-wrap gap-1">
                          {(["signup", "circle", "paid_plan"] as const).map(
                            (m) => (
                              <span
                                key={m}
                                className={`rounded-full px-2 py-0.5 text-xs ${
                                  r.milestones.includes(m)
                                    ? "bg-teal/15 text-teal"
                                    : "bg-mist text-slate/50"
                                }`}
                              >
                                {MILESTONE_SHORT[m]}
                              </span>
                            ),
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 text-slate">
                        {r.date
                          ? new Date(r.date).toLocaleDateString("en-NG")
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate">No referrals yet.</p>
          )}
        </section>

        {/* Payout actions */}
        <section
          id="payouts"
          className="mt-6 scroll-mt-6 rounded-[14px] border border-line bg-white p-6"
        >
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate">
            Process payouts
          </h2>
          <p className="mt-2 mb-4 text-sm text-ink">
            Run every pending request as an automated Paystack transfer, then
            reconcile any that are still settling.
          </p>
          <PayoutActions />
        </section>

        {/* Payouts table */}
        <section className="mt-6 rounded-[14px] border border-line bg-white p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate">
            Withdrawals
          </h2>
          {payouts && payouts.length > 0 ? (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate">
                    <th className="pb-2 font-medium">Member</th>
                    <th className="pb-2 font-medium">Amount</th>
                    <th className="pb-2 font-medium">Status</th>
                    <th className="pb-2 font-medium">Requested</th>
                    <th className="pb-2 font-medium"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {payouts.map((p) => (
                    <tr key={p.id}>
                      <td className="py-2.5 text-ink">
                        {nameById[p.user_id] || p.user_id.slice(0, 8)}
                      </td>
                      <td className="py-2.5 text-ink">
                        {formatNaira(p.amount_naira)}
                      </td>
                      <td className="py-2.5">
                        <span className="text-slate">{p.status}</span>
                        {p.status === "failed" && p.failure_reason && (
                          <span className="block text-xs text-red-600">
                            {p.failure_reason}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 text-slate">
                        {new Date(p.created_at).toLocaleDateString("en-NG")}
                      </td>
                      <td className="py-2.5 text-right">
                        {p.status === "failed" && (
                          <RetryButton payoutId={p.id} />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate">No withdrawals yet.</p>
          )}
        </section>

        {/* Top referrers */}
        <section className="mt-6 rounded-[14px] border border-line bg-white p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate">
            Top referrers
          </h2>
          {topReferrers.length > 0 ? (
            <ul className="mt-4 divide-y divide-line">
              {topReferrers.map((r, i) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between py-2.5 text-sm"
                >
                  <span className="text-ink">
                    {i + 1}. {nameById[r.id] || r.id.slice(0, 8)}
                  </span>
                  <span className="font-medium text-night">
                    {formatNaira(r.amount)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-slate">No referral earnings yet.</p>
          )}
        </section>
      </div>
    </main>
  );
}

function Metric({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-[14px] border border-line bg-white p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-slate">
        {label}
      </p>
      <p className="mt-2 text-xl font-semibold text-night">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-slate">{hint}</p>}
    </div>
  );
}
