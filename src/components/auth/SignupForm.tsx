"use client";

import { useActionState } from "react";
import { signUpAction, type AuthState } from "@/lib/actions/auth";
import { Field } from "./AuthShell";
import { SubmitButton } from "./SubmitButton";

const initial: AuthState = { error: null };

export function SignupForm({ refCode }: { refCode: string }) {
  const [state, formAction] = useActionState(signUpAction, initial);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="ref" value={refCode} />
      <Field
        label="Full name"
        name="full_name"
        autoComplete="name"
        placeholder="Your name"
      />
      <Field
        label="Email"
        name="email"
        type="email"
        required
        autoComplete="email"
        placeholder="you@example.com"
      />
      <Field
        label="Password"
        name="password"
        type="password"
        required
        autoComplete="new-password"
        placeholder="At least 8 characters"
      />
      {refCode && (
        <p className="text-sm text-teal">
          You were invited with code{" "}
          <span className="font-semibold">{refCode}</span>.
        </p>
      )}
      {state.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}
      <SubmitButton>Create account</SubmitButton>
    </form>
  );
}
