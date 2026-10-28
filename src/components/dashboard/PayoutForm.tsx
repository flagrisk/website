"use client";

import { useActionState } from "react";
import {
  requestPayoutAction,
  type PayoutState,
} from "@/lib/actions/payouts";
import { MIN_PAYOUT_NAIRA } from "@/lib/referrals";

const initial: PayoutState = { error: null };

export function PayoutForm({
  available,
  hasAccount,
}: {
  available: number;
  hasAccount: boolean;
}) {
  const [state, formAction] = useActionState(requestPayoutAction, initial);
  const canWithdraw = hasAccount && available >= MIN_PAYOUT_NAIRA;

  return (
    <form action={formAction} className="space-y-3">
      <div className="flex items-stretch gap-2">
        <div className="relative flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate">
            ₦
          </span>
          <input
            name="amount"
            type="number"
            min={MIN_PAYOUT_NAIRA}
            max={available}
            step={100}
            defaultValue={available >= MIN_PAYOUT_NAIRA ? available : ""}
            placeholder={`${MIN_PAYOUT_NAIRA} min`}
            disabled={!canWithdraw}
            className="w-full rounded-[10px] border border-line bg-white py-2.5 pl-7 pr-3 text-sm text-ink outline-none focus:border-night disabled:bg-mist disabled:text-slate"
          />
        </div>
        <button
          type="submit"
          disabled={!canWithdraw}
          className="shrink-0 rounded-[10px] bg-night px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-dusk disabled:opacity-50"
        >
          Withdraw
        </button>
      </div>

      {!hasAccount && (
        <p className="text-sm text-slate">
          Add a payout account below to withdraw your earnings.
        </p>
      )}
      {hasAccount && available < MIN_PAYOUT_NAIRA && (
        <p className="text-sm text-slate">
          You need at least ₦{MIN_PAYOUT_NAIRA.toLocaleString()} to withdraw.
        </p>
      )}
      {state.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}
      {state.ok && (
        <p className="text-sm text-teal">
          Withdrawal requested. We&apos;ll send it to your account shortly.
        </p>
      )}
    </form>
  );
}
