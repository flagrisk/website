"use client";

import { useActionState } from "react";
import { signInAction, type AuthState } from "@/lib/actions/auth";
import { Field } from "./AuthShell";
import { SubmitButton } from "./SubmitButton";

const initial: AuthState = { error: null };

export function LoginForm({ next }: { next: string }) {
  const [state, formAction] = useActionState(signInAction, initial);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="next" value={next} />
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
        autoComplete="current-password"
      />
      {state.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}
      <SubmitButton>Log in</SubmitButton>
    </form>
  );
}
