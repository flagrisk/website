"use server";

import { createClient, createServiceClient } from "@/lib/supabase/server";

export type CheckoutInit =
  | { ok: true; accessCode: string; reference: string; amount: number; currency: string }
  | { ok: false; error: string; needsAuth?: boolean; needsEmail?: boolean };

// Start a subscription checkout by reusing the app's paystack-init Edge Function.
// It authenticates via the caller's session (functions.invoke sends the JWT),
// prices the tier server-side, and returns a Paystack access code we hand to the
// inline popup. Activation of profiles.current_tier is done by the account's
// charge webhook, exactly as in the app.
export async function startCheckout(
  tier: string,
  cycle: "monthly" | "annual",
  email?: string,
): Promise<CheckoutInit> {
  const supabase = await createClient();
  // getUser() hits gotrue for the FRESH account (the session cookie can be stale
  // right after we add an email), so the email check below is accurate.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Please log in first.", needsAuth: true };
  }

  // Paystack needs a customer email. Phone-only accounts have none, so collect
  // one for the receipt and save it to the account (confirmed, no email sent),
  // which is what paystack-init reads.
  if (!user.email) {
    const e = (email ?? "").trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) {
      return {
        ok: false,
        needsEmail: true,
        error: "Enter an email for your receipt.",
      };
    }
    const admin = createServiceClient();
    const { error: upErr } = await admin.auth.admin.updateUserById(user.id, {
      email: e,
      email_confirm: true,
    });
    if (upErr) {
      return { ok: false, error: "Could not save your email. Try again." };
    }
  }

  // Forward the user's JWT explicitly: paystack-init authenticates the caller,
  // and the server-side client doesn't always attach the session token on its own.
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    return { ok: false, error: "Please log in first.", needsAuth: true };
  }
  const { data, error } = await supabase.functions.invoke("paystack-init", {
    body: { tier, billing_interval: cycle, country: "NG" },
    headers: { Authorization: `Bearer ${session.access_token}` },
  });

  if (error || !data?.access_code) {
    let message = "Checkout could not be started. Please try again.";
    // The Edge Function's real error is in error.context (a Response).
    try {
      const ctx = (error as { context?: { json?: () => Promise<unknown> } })
        ?.context;
      if (ctx?.json) {
        const body = (await ctx.json()) as { error?: string };
        if (body?.error) message = body.error;
      }
    } catch {
      /* fall back to the generic message */
    }
    if (data && typeof data.error === "string") message = data.error;
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
