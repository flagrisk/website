import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { createServiceClient } from "@/lib/supabase/server";
import { formatNaira } from "@/lib/tiers";
import { PayoutActions } from "@/components/admin/PayoutActions";

export const metadata: Metadata = { title: "Admin" };
export const instant = false;

export default async function AdminPage() {
  const admin = await requireAdmin();
  if (!admin) redirect("/dashboard");

  const db = createServiceClient();

  const [
    { data: referrals },
    { data: rewards },
    { data: payouts },
  ] = await Promise.all([
    db.from("referrals").select("referrer_id, referred_id"),
    db.from("referral_rewards").select("referrer_id, milestone, amount_naira"),
    db
      .from("payouts")
      .select("id, user_id, amount_naira, status, created_at")
      .order("created_at", { ascending: false }),
  ]);

  // Names for the people appearing in the payouts list.
  const userIds = Array.from(new Set((payouts ?? []).map((p) => p.user_id)));
  const nameById: Record<string, string> = {};
  if (userIds.length > 0) {
    const { data: profiles } = await db
      .from("profiles")
      .select("id, display_name")
      .in("id", userIds);
    for (const p of profiles ?? []) {
      nameById[p.id] = p.display_name ?? "";
    }
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

  // Top referrers by earnings.
  const earnedByReferrer: Record<string, number> = {};
  for (const r of rewards ?? []) {
    earnedByReferrer[r.referrer_id] =
      (earnedByReferrer[r.referrer_id] ?? 0) + r.amount_naira;
  }
  const topReferrerIds = Object.keys(earnedByReferrer);
  const topNameById: Record<string, string> = {};
  if (topReferrerIds.length > 0) {
    const { data: profiles } = await db
      .from("profiles")
      .select("id, display_name")
      .in("id", topReferrerIds);
    for (const p of profiles ?? []) topNameById[p.id] = p.display_name ?? "";
  }
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

        {/* Metrics */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="People referred" value={String(totalReferred)} />
          <Metric label="Rewards earned" value={formatNaira(totalEarned)} />
          <Metric label="Paid out" value={formatNaira(paidOut)} />
          <Metric
            label="Pending payouts"
            value={formatNaira(pendingSum)}
            hint={`${pending.length} request(s)`}
          />
        </div>

        {/* Payout actions */}
        <section className="mt-8 rounded-[14px] border border-line bg-white p-6">
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
                      </td>
                      <td className="py-2.5 text-slate">
                        {new Date(p.created_at).toLocaleDateString("en-NG")}
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
                    {i + 1}. {topNameById[r.id] || r.id.slice(0, 8)}
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
