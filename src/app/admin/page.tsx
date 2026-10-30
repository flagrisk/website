import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { createServiceClient } from "@/lib/supabase/server";
import {
  AdminConsole,
  type MemberRow,
  type ReferralRow,
  type PayoutRow,
} from "@/components/admin/AdminConsole";
import "./admin.css";

export const metadata: Metadata = { title: "Admin" };
export const instant = false;

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
  const nameOf = (id: string) => nameById[id] || id.slice(0, 8);

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
  for (const r of rewards ?? [])
    (milestonesByReferred[r.referred_id] ??= []).push(r.milestone);

  const paidOut = (payouts ?? [])
    .filter((p) => p.status === "paid")
    .reduce((s, p) => s + p.amount_naira, 0);
  const pending = (payouts ?? []).filter(
    (p) => p.status === "pending" || p.status === "processing",
  );

  const metrics = {
    referred: referrals?.length ?? 0,
    earned: (rewards ?? []).reduce((s, r) => s + r.amount_naira, 0),
    paidOut,
    pendingSum: pending.reduce((s, p) => s + p.amount_naira, 0),
    pendingCount: pending.length,
  };

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

  const referralRows: ReferralRow[] = (referrals ?? [])
    .map((r) => ({
      referrer: nameOf(r.referrer_id),
      referred: nameOf(r.referred_id),
      milestones: milestonesByReferred[r.referred_id] ?? [],
      date: r.created_at,
    }))
    .sort((a, b) => ((a.date ?? "") < (b.date ?? "") ? 1 : -1));

  const payoutRows: PayoutRow[] = (payouts ?? []).map((p) => ({
    id: p.id,
    member: nameOf(p.user_id),
    amount: p.amount_naira,
    status: p.status,
    failureReason: p.failure_reason,
    created: p.created_at,
  }));

  const topReferrers = Object.entries(earnedByReferrer)
    .map(([id, amount]) => ({ name: nameOf(id), amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 10);

  return (
    <AdminConsole
      adminEmail={admin.email ?? admin.phone ?? ""}
      metrics={metrics}
      members={members}
      referrals={referralRows}
      payouts={payoutRows}
      topReferrers={topReferrers}
    />
  );
}
