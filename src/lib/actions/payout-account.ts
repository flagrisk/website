"use server";

import { revalidatePath } from "next/cache";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import {
  resolveAccount,
  createTransferRecipient,
} from "@/lib/paystack";

export type AccountState = { error: string | null; ok?: boolean; name?: string };

// Save (or replace) the member's payout bank account. Resolves the account name
// with Paystack, creates a transfer recipient, and stores it. Writes go through
// the service client because payout_recipients has no self-insert RLS policy.
export async function savePayoutAccountAction(
  _prev: AccountState,
  formData: FormData,
): Promise<AccountState> {
  const accountNumber = String(formData.get("account_number") ?? "").trim();
  const bankCode = String(formData.get("bank_code") ?? "").trim();

  if (!/^\d{10}$/.test(accountNumber)) {
    return { error: "Enter a valid 10-digit account number." };
  }
  if (!bankCode) {
    return { error: "Choose your bank." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Please log in again." };
  }

  try {
    const resolved = await resolveAccount(accountNumber, bankCode);
    const recipient = await createTransferRecipient({
      name: resolved.account_name,
      accountNumber,
      bankCode,
    });

    const admin = createServiceClient();
    const { error } = await admin.from("payout_recipients").upsert(
      {
        user_id: user.id,
        bank_code: bankCode,
        account_number: accountNumber,
        account_name: resolved.account_name,
        recipient_code: recipient.recipient_code,
      },
      { onConflict: "user_id" },
    );

    if (error) {
      return { error: "Could not save your account. Try again." };
    }

    revalidatePath("/dashboard");
    return { error: null, ok: true, name: resolved.account_name };
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Could not verify that account.";
    return { error: message };
  }
}
