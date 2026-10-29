"use server";

import { createClient } from "@/lib/supabase/server";

export type CheckoutInit =
  | { ok: true; accessCode: string; reference: string; amount: number; currency: string }
  | { ok: false; error: string; needsAuth?: boolean };

// Start a subscription checkout by reusing the app's paystack-init Edge Function.
// It authenticates via the caller's session (functions.invoke sends the JWT),
// prices the tier server-side, and returns a Paystack access code we hand to the
// inline popup. Activation of profiles.current_tier is done by the account's
// charge webhook, exactly as in the app.
export async function startCheckout(
  tier: string,
  cycle: "monthly" | "annual",
): Promise<CheckoutInit> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Please log in first.", needsAuth: true };
  }

  const { data, error } = await supabase.functions.invoke("paystack-init", {
    body: { tier, billing_interval: cycle, country: "NG" },
  });

  if (error || !data?.access_code) {
    const message =
      (data && typeof data.error === "string" && data.error) ||
      "Checkout could not be started. Please try again.";
    return { ok: false, error: message };
  }

  return {
    ok: true,
    accessCode: data.access_code,
    reference: data.reference,
    amount: data.amount,
    currency: data.currency,
  };
}

export type CheckoutVerify = {
  status: "success" | "failed" | "abandoned" | "pending" | "unknown";
  activated: boolean;
};

// Confirm a transaction. Returns Paystack's status and whether the plan has been
// activated yet (profiles.current_tier matches). The dashboard reads the tier;
// the paid_plan referral is awarded by the DB trigger when the tier flips.
export async function verifyCheckout(
  reference: string,
  tier: string,
): Promise<CheckoutVerify> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "unknown", activated: false };

  const [{ data: v }, { data: profile }] = await Promise.all([
    supabase.functions.invoke("paystack-verify", {
      body: { reference, country: "NG" },
    }),
    supabase.from("profiles").select("current_tier").eq("id", user.id).maybeSingle(),
  ]);

  const status = (v?.status ?? "unknown") as CheckoutVerify["status"];
  const activated = profile?.current_tier === tier;
  return { status, activated };
}
