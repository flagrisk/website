// Server-only Paystack client for the payout side (transfers out to members who
// earned referral money). Subscriptions IN are handled by the app's existing
// paystack-init / paystack-verify Edge Functions, not here.
//
// Never import this into a Client Component: it uses the secret key.

import "server-only";

const BASE = "https://api.paystack.co";

function secret(): string {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) throw new Error("PAYSTACK_SECRET_KEY is not set");
  return key;
}

async function paystack<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${secret()}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  const body = (await res.json().catch(() => ({}))) as {
    status?: boolean;
    message?: string;
    data?: T;
  };

  if (!res.ok || body.status === false) {
    throw new Error(body.message || `Paystack request failed (${res.status})`);
  }
  return body.data as T;
}

// Naira -> kobo (Paystack works in the minor unit).
export function toKobo(naira: number): number {
  return Math.round(naira * 100);
}

export type Bank = { name: string; code: string; currency: string };

export function listBanks(): Promise<Bank[]> {
  return paystack<Bank[]>("/bank?currency=NGN&country=nigeria");
}

export type ResolvedAccount = {
  account_number: string;
  account_name: string;
};

export function resolveAccount(
  accountNumber: string,
  bankCode: string,
): Promise<ResolvedAccount> {
  return paystack<ResolvedAccount>(
    `/bank/resolve?account_number=${encodeURIComponent(accountNumber)}&bank_code=${encodeURIComponent(bankCode)}`,
  );
}

export type TransferRecipient = { recipient_code: string };

export function createTransferRecipient(args: {
  name: string;
  accountNumber: string;
  bankCode: string;
}): Promise<TransferRecipient> {
  return paystack<TransferRecipient>("/transferrecipient", {
    method: "POST",
    body: JSON.stringify({
      type: "nuban",
      name: args.name,
      account_number: args.accountNumber,
      bank_code: args.bankCode,
      currency: "NGN",
    }),
  });
}

export type Transfer = {
  transfer_code: string;
  reference: string;
  status: string; // "success" | "pending" | "otp" | ...
};

export function initiateTransfer(args: {
  amountNaira: number;
  recipientCode: string;
  reason: string;
  reference?: string;
}): Promise<Transfer> {
  return paystack<Transfer>("/transfer", {
    method: "POST",
    body: JSON.stringify({
      source: "balance",
      amount: toKobo(args.amountNaira),
      recipient: args.recipientCode,
      reason: args.reason,
      ...(args.reference ? { reference: args.reference } : {}),
    }),
  });
}

// Poll a transfer's current status by its reference. Used to reconcile payouts
// that came back "pending" from initiateTransfer.
export function fetchTransfer(reference: string): Promise<Transfer> {
  return paystack<Transfer>(
    `/transfer/verify/${encodeURIComponent(reference)}`,
  );
}

// Map Paystack's transfer status to our payouts.status values.
export function mapTransferStatus(
  paystackStatus: string,
): "processing" | "paid" | "failed" | "reversed" {
  switch (paystackStatus) {
    case "success":
      return "paid";
    case "failed":
      return "failed";
    case "reversed":
      return "reversed";
    default:
      return "processing"; // pending, otp, received, etc.
  }
}
