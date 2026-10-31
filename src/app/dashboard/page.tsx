import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { signOutAction } from "@/lib/actions/auth";
import { formatNaira } from "@/lib/tiers";
import { REFERRAL_REWARDS, MILESTONE_LABEL } from "@/lib/referrals";
import { CopyLink } from "@/components/dashboard/CopyLink";
import { PayoutForm } from "@/components/dashboard/PayoutForm";
import { PayoutAccountForm } from "@/components/dashboard/PayoutAccountForm";
import { ShareMessages } from "@/components/dashboard/ShareMessages";
import { listBanks, type Bank } from "@/lib/paystack";

export const metadata: Metadata = { title: "Dashboard" };

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

  const maxReward =
    REFERRAL_REWARDS.signup +
    REFERRAL_REWARDS.circle +
    REFERRAL_REWARDS.paid_plan;

  return (
    <main className="dash">
      {/* top bar */}
      <header className="d-topbar">
        <div className="mx-auto flex max-w-[960px] items-center justify-between px-5 py-3.5">
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
              {user.email}
            </span>
            <form action={signOutAction}>
              <button className="d-btn">Log out</button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[960px] px-5 py-10">
        <h1 className="d-h1">
          Welcome{displayName ? `, ${displayName}` : ""}
        </h1>
        <p className="d-sub">Your plan, your circle, your earnings.</p>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {/* Subscription */}
          <section className="d-card">
            <h2 className="d-eyebrow">Your plan</h2>
            <p className="d-big">{subTier}</p>
            <p className="d-note" style={{ marginTop: 4 }}>
              {isPaid ? "Active" : "Free plan, upgrade any time"}
            </p>
            <Link
              href="/plans"
              className="d-btn d-btn-primary"
              style={{ marginTop: 18 }}
            >
              {isPaid ? "Change plan" : "Upgrade"}
            </Link>
          </section>

          {/* Earnings */}
          <section className="d-card">
            <h2 className="d-eyebrow">Referral earnings</h2>
            <p className="d-big">{formatNaira(balance.available_naira)}</p>
            <p className="d-note" style={{ marginTop: 4 }}>
              available · {formatNaira(balance.earned_naira)} earned in total
            </p>
            <div className="mt-4">
              <PayoutForm
                available={balance.available_naira}
                hasAccount={!!recipient}
              />
            </div>
          </section>
        </div>

        {/* Referral link + progress */}
        <section className="d-card mt-6">
          <h2 className="d-eyebrow">Invite and earn</h2>
          <p
            className="d-note"
            style={{ marginTop: 8, color: "var(--d-ink)" }}
          >
            Share your link. You earn up to {formatNaira(maxReward)} for every
            person who joins, builds a circle, and starts a paid plan.
          </p>
          <div className="mt-4 max-w-[520px]">
            <CopyLink url={referralUrl} />
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <Stat label="People joined" value={referralCount} />
            {(Object.keys(REFERRAL_REWARDS) as Array<keyof typeof REFERRAL_REWARDS>).map(
              (m) => (
                <Stat
                  key={m}
                  label={MILESTONE_LABEL[m]}
                  value={rewardCounts[m] ?? 0}
                  hint={`${formatNaira(REFERRAL_REWARDS[m])} each`}
                />
              ),
            )}
          </div>

          <ShareMessages
            shareName={shareName}
            botNumber={process.env.NEXT_PUBLIC_WHATSAPP_BOT_NUMBER ?? ""}
          />
        </section>

        {/* Payout account */}
        <section className="d-card mt-6">
          <h2 className="d-eyebrow">Payout account</h2>
          <p className="d-note" style={{ margin: "8px 0 16px" }}>
            Where we send your referral earnings when you withdraw.
          </p>
          <div className="max-w-[440px]">
            <PayoutAccountForm
              banks={banks}
              current={recipient?.account_name ?? null}
            />
          </div>
        </section>

        {/* Payout history */}
        <section className="d-card mt-6">
          <h2 className="d-eyebrow">Withdrawals</h2>
          {payouts && payouts.length > 0 ? (
            <table className="d-table" style={{ marginTop: 14 }}>
              <tbody>
                {payouts.map((p) => (
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
        </section>
      </div>
    </main>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: number;
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
