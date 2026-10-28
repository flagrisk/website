"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-[10px] bg-night px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-dusk disabled:opacity-60"
    >
      {pending ? "Please wait…" : children}
    </button>
  );
}
