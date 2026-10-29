"use client";

import { useActionState } from "react";
import {
  savePayoutAccountAction,
  type AccountState,
} from "@/lib/actions/payout-account";
import type { Bank } from "@/lib/paystack";
import { SubmitButton } from "@/components/auth/SubmitButton";

const initial: AccountState = { error: null };

export function PayoutAccountForm({
  banks,
  current,
}: {
  banks: Bank[];
  current: string | null;
}) {
  const [state, formAction] = useActionState(savePayoutAccountAction, initial);

  return (
    <form action={formAction} className="space-y-3">
      {current && (
        <p className="text-sm text-slate">
          Current account on file: <span className="text-ink">{current}</span>.
          Saving replaces it.
        </p>
      )}

      <label className="block">
        <span className="text-sm font-medium text-ink">Bank</span>
        {banks.length > 0 ? (
          <select
            name="bank_code"
            required
            defaultValue=""
            className="mt-1.5 w-full rounded-[10px] border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-night"
          >
            <option value="" disabled>
              Choose your bank
            </option>
            {banks.map((b) => (
              <option key={b.code} value={b.code}>
                {b.name}
              </option>
            ))}
          </select>
        ) : (
          <input
            name="bank_code"
            required
            placeholder="Bank code"
            className="mt-1.5 w-full rounded-[10px] border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-night"
          />
        )}
      </label>

      <label className="block">
        <span className="text-sm font-medium text-ink">Account number</span>
        <input
          name="account_number"
          required
          inputMode="numeric"
          pattern="\d{10}"
          maxLength={10}
          placeholder="10-digit NUBAN"
          className="mt-1.5 w-full rounded-[10px] border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-night"
        />
      </label>

      {state.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}
      {state.ok && (
        <p className="text-sm text-teal">
          Saved to {state.name}. Your earnings will go here.
        </p>
      )}
      <SubmitButton>Save payout account</SubmitButton>
    </form>
  );
}
