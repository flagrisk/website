"use client";

import { useActionState } from "react";
import {
  verifyOtpAction,
  resendOtpAction,
  type AuthState,
} from "@/lib/actions/auth";
import { Field } from "./AuthShell";
import { SubmitButton } from "./SubmitButton";

const initial: AuthState = { error: null };

export function VerifyForm({ phone }: { phone: string }) {
  const [state, formAction] = useActionState(verifyOtpAction, initial);
  const [resend, resendAction] = useActionState(resendOtpAction, initial);

  return (
    <div className="space-y-5">
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="phone" value={phone} />
        <Field
          label="6-digit code"
          name="token"
          type="text"
          required
          placeholder="123456"
        />
        {state.error && (
          <p className="text-sm text-red-600" role="alert">
            {state.error}
          </p>
        )}
        <SubmitButton>Confirm</SubmitButton>
      </form>

      <form action={resendAction} className="text-center">
        <input type="hidden" name="phone" value={phone} />
        <button
          type="submit"
          className="text-sm font-medium text-night underline"
        >
          Send a new code
        </button>
        {resend.error === null && resend !== initial && (
          <p className="mt-1 text-sm text-teal">A new code is on its way.</p>
        )}
        {resend.error && (
          <p className="mt-1 text-sm text-red-600">{resend.error}</p>
        )}
      </form>
    </div>
  );
}
