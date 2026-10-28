"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { MIN_PAYOUT_NAIRA } from "@/lib/referrals";

export type PayoutState = { error: string | null; ok?: boolean };

// Member requests a withdrawal of their referral earnings. The DB function
// request_payout checks the balance, the minimum, and that a payout account is
// on file, then creates a pending row. The Paystack transfer is fired by a
// separate server route once the row exists (milestone 3).
export async function requestPayoutAction(
  _prev: PayoutState,
  formData: FormData,
): Promise<PayoutState> {
  const amount = Number(formData.get("amount"));

  if (!Number.isFinite(amount) || amount < MIN_PAYOUT_NAIRA) {
    return { error: `Minimum withdrawal is ${MIN_PAYOUT_NAIRA} naira.` };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Please log in again." };
  }

  const { error } = await supabase.rpc("request_payout", {
    p_amount: Math.floor(amount),
  });

  if (error) {
    // Surface the DB's own message (insufficient balance, no account, etc.)
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  return { error: null, ok: true };
}
