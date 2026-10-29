import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOutAction } from "@/lib/actions/auth";
import { formatNaira } from "@/lib/tiers";
import { REFERRAL_REWARDS, MILESTONE_LABEL } from "@/lib/referrals";
import { CopyLink } from "@/components/dashboard/CopyLink";
import { PayoutForm } from "@/components/dashboard/PayoutForm";
import { PayoutAccountForm } from "@/components/dashboard/PayoutAccountForm";
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

  return (
    <main className="min-h-screen bg-mist">
      {/* top bar */}
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-[960px] items-center justify-between px-5 py-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-[7px] bg-night text-lime font-bold text-sm">
              F!
            </span>
            <span className="font-semibold text-night">FlagRisk</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-slate sm:inline">
              {user.email}
            </span>
            <form action={signOutAction}>
              <button className="rounded-[9px] border border-line px-3 py-1.5 text-sm font-medium text-ink transition hover:bg-mist">
                Log out
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[960px] px-5 py-10">
        <h1 className="text-2xl font-semibold text-night">
          Welcome{displayName ? `, ${displayName}` : ""}
        </h1>
        <p className="mt-1 text-slate">Your plan, your circle, your earnings.</p>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {/* Subscription */}
          <section className="rounded-[14px] border border-line bg-white p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate">
              Your plan
            </h2>
            <p className="mt-3 text-2xl font-semibold text-night">{subTier}</p>
            <p className="mt-1 text-sm text-slate">
              {isPaid ? "Active" : "Free plan, upgrade any time"}
            </p>
            <Link
              href="/plans"
              className="mt-4 inline-block rounded-[10px] bg-night px-4 py-2 text-sm font-semibold text-white transition hover:bg-dusk"
            >
              {isPaid ? "Change plan" : "Upgrade"}
            </Link>
          </section>

          {/* Earnings */}
          <section className="rounded-[14px] border border-line bg-white p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate">
              Referral earnings
            </h2>
            <p className="mt-3 text-2xl font-semibold text-night">
              {formatNaira(balance.available_naira)}
            </p>
            <p className="mt-1 text-sm text-slate">
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
        <section className="mt-6 rounded-[14px] border border-line bg-white p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate">
            Invite and earn
          </h2>
          <p className="mt-2 text-sm text-ink">
            Share your link. You earn up to{" "}
            {formatNaira(
              REFERRAL_REWARDS.signup +
                REFERRAL_REWARDS.circle +
                REFERRAL_REWARDS.paid_plan,
            )}{" "}
            for every person who joins, builds a circle, and starts a paid plan.
          </p>
          <div className="mt-4 max-w-[520px]">
            <CopyLink url={referralUrl} />
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <Stat label={`People joined`} value={referralCount} />
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
        </section>

        {/* Payout account */}
        <section className="mt-6 rounded-[14px] border border-line bg-white p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate">
            Payout account
          </h2>
          <p className="mt-2 mb-4 text-sm text-ink">
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
        <section className="mt-6 rounded-[14px] border border-line bg-white p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate">
            Withdrawals
          </h2>
          {payouts && payouts.length > 0 ? (
            <ul className="mt-4 divide-y divide-line">
              {payouts.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between py-3 text-sm"
                >
                  <span className="text-ink">
                    {formatNaira(p.amount_naira)}
                  </span>
                  <span className="text-slate">
                    {new Date(p.created_at).toLocaleDateString("en-NG")}
                  </span>
                  <PayoutStatus status={p.status} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-slate">No withdrawals yet.</p>
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
    <div className="rounded-[10px] bg-mist px-4 py-3">
      <p className="text-xl font-semibold text-night">{value}</p>
      <p className="text-xs text-slate">{label}</p>
      {hint && <p className="text-xs text-slate/70">{hint}</p>}
    </div>
  );
}

function PayoutStatus({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-amber/15 text-amber",
    processing: "bg-amber/15 text-amber",
    paid: "bg-teal/15 text-teal",
    failed: "bg-red-50 text-red-600",
    reversed: "bg-red-50 text-red-600",
  };
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${map[status] ?? "bg-mist text-slate"}`}
    >
      {status}
    </span>
  );
}
