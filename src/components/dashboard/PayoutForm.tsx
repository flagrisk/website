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
          <span
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm"
            style={{ color: "var(--d-ink-soft)" }}
          >
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
            className="d-input"
            style={{ paddingLeft: 28 }}
          />
        </div>
        <button
          type="submit"
          disabled={!canWithdraw}
          className="d-btn d-btn-primary shrink-0"
        >
          Withdraw
        </button>
      </div>

      {!hasAccount && (
        <p className="d-note">
          Add a payout account below to withdraw your earnings.
        </p>
      )}
      {hasAccount && available < MIN_PAYOUT_NAIRA && (
        <p className="d-note">
          You need at least ₦{MIN_PAYOUT_NAIRA.toLocaleString()} to withdraw.
        </p>
      )}
      {state.error && (
        <p className="d-err" role="alert">
          {state.error}
        </p>
      )}
      {state.ok && (
        <p className="d-ok">
          Withdrawal requested. We&apos;ll send it to your account shortly.
        </p>
      )}
    </form>
  );
}
