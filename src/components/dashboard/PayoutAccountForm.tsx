"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  savePayoutAccountAction,
  type AccountState,
} from "@/lib/actions/payout-account";
import type { Bank } from "@/lib/paystack";

const initial: AccountState = { error: null };

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="d-btn d-btn-primary">
      {pending ? "Saving..." : "Save payout account"}
    </button>
  );
}

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
        <p className="d-note">
          Current account on file:{" "}
          <span style={{ color: "var(--d-ink)" }}>{current}</span>. Saving
          replaces it.
        </p>
      )}

      <label className="block">
        <span className="d-label">Bank</span>
        {banks.length > 0 ? (
          <select name="bank_code" required defaultValue="" className="d-input">
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
            className="d-input"
          />
        )}
      </label>

      <label className="block">
        <span className="d-label">Account number</span>
        <input
          name="account_number"
          required
          inputMode="numeric"
          pattern="\d{10}"
          maxLength={10}
          placeholder="10-digit NUBAN"
          className="d-input"
        />
      </label>

      {state.error && (
        <p className="d-err" role="alert">
          {state.error}
        </p>
      )}
      {state.ok && (
        <p className="d-ok">Saved to {state.name}. Your earnings will go here.</p>
      )}
      <SaveButton />
    </form>
  );
}
