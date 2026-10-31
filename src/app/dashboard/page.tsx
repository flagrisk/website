import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { listBanks, type Bank } from "@/lib/paystack";
import {
  DashboardShell,
  type DashData,
} from "@/components/dashboard/DashboardShell";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

// Per-user, always live: read cookies/session at request time, never prerender.
export const instant = false;

type Balance = {
  earned_naira: number;
  paid_naira: number;
  available_naira: number;
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // proxy.ts already gates this, but guard anyway.
  if (!user) redirect("/login?next=/dashboard");

  // Attribute the referral from the invite code stored at signup, in case the
  // email-confirmation path didn't run it. record_referral is idempotent and
  // no-ops once attributed or for a user who wasn't referred.
  const inviteCode = user.user_metadata?.ref_code as string | undefined;
  if (inviteCode) {
    await supabase.rpc("record_referral", { p_code: inviteCode });
  }

  // Make sure the member has a referral code, then load everything in parallel.
  const { data: code } = await supabase.rpc("ensure_referral_code");

  const [
    { data: balanceRows },
    { data: profile },
    { data: referrals },
    { data: rewards },
    { data: payouts },
    { data: recipient },
  ] = await Promise.all([
    supabase.rpc("my_referral_balance"),
    // The app's source of truth for a user's plan. paystack-verify sets this.
    supabase
      .from("profiles")
      .select("current_tier, display_name")
      .eq("id", user.id)
      .maybeSingle(),
    supabase.from("referrals").select("referred_id, created_at"),
    supabase.from("referral_rewards").select("milestone, amount_naira"),
    supabase
      .from("payouts")
      .select("id, amount_naira, status, created_at")
      .order("created_at", { ascending: false }),
    supabase.from("payout_recipients").select("account_name").maybeSingle(),
  ]);

  const balance: Balance =
    (Array.isArray(balanceRows) ? balanceRows[0] : balanceRows) ?? {
      earned_naira: 0,
      paid_naira: 0,
      available_naira: 0,
    };

  const referralCount = referrals?.length ?? 0;
  const rewardCounts: Record<string, number> = {};
  for (const r of rewards ?? []) {
    rewardCounts[r.milestone] = (rewardCounts[r.milestone] ?? 0) + 1;
  }

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const referralUrl = `${siteUrl}/signup?ref=${code ?? ""}`;

  // Bank list for the payout-account form. Degrades to a code input if Paystack
  // is unreachable or not yet configured.
  let banks: Bank[] = [];
  try {
    banks = await listBanks();
  } catch {
    banks = [];
  }

  const currentTier = (profile?.current_tier ?? "basic") as string;
  const isPaid = ["standard", "pro", "premium"].includes(currentTier);
  const subTier =
    currentTier.charAt(0).toUpperCase() +
    currentTier.slice(1) +
    (currentTier === "basic" ? " (free)" : "");
  const displayName = profile?.display_name ?? user.user_metadata?.full_name ?? "";

  // The member's WhatsApp invite name, the bot attributes "X introduced me" by
  // channel_identities.share_name, so the invite must use that exact name.
  // Read via the service client to avoid channel RLS; empty if they haven't set
  // one up through the bot yet.
  let shareName = "";
  try {
    const admin = createServiceClient();
    const { data: ch } = await admin
      .from("channel_identities")
      .select("share_name")
      .eq("profile_id", user.id)
      .not("share_name", "is", null)
      .order("share_name_used_at", { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle();
    shareName = ch?.share_name ?? "";
  } catch {
    shareName = "";
  }

  const data: DashData = {
    email: user.email ?? "",
    displayName,
    subTier,
    isPaid,
    availableNaira: balance.available_naira,
    earnedNaira: balance.earned_naira,
    referralCount,
    rewardCounts,
    referralUrl,
    hasAccount: !!recipient,
    currentAccount: recipient?.account_name ?? null,
    banks,
    payouts: (payouts ?? []).map((p) => ({
      id: String(p.id),
      amount_naira: p.amount_naira as number,
      status: p.status as string,
      created_at: p.created_at as string,
    })),
    shareName,
    botNumber: process.env.NEXT_PUBLIC_WHATSAPP_BOT_NUMBER ?? "",
  };

  return <DashboardShell data={data} />;
}
