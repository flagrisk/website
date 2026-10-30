import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { createServiceClient } from "@/lib/supabase/server";
import { initiateTransfer, mapTransferStatus } from "@/lib/paystack";

// Retry one failed payout as a fresh Paystack transfer. Admin-only.
// POST body: { payout_id: string }
export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { payout_id } = (await request.json().catch(() => ({}))) as {
    payout_id?: string;
  };
  if (!payout_id) {
    return NextResponse.json({ error: "payout_id required" }, { status: 400 });
  }

  const db = createServiceClient();

  // Claim it: only a currently-failed payout can be retried, and the update is
  // the lock so two retries can't both fire.
  const { data: claimed } = await db
    .from("payouts")
    .update({
      status: "processing",
      failure_reason: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", payout_id)
    .eq("status", "failed")
    .select("id, user_id, amount_naira")
    .maybeSingle();

  if (!claimed) {
    return NextResponse.json(
      { error: "payout is not in a failed state" },
      { status: 409 },
    );
  }

  const { data: recipient } = await db
    .from("payout_recipients")
    .select("recipient_code")
    .eq("user_id", claimed.user_id)
    .maybeSingle();

  if (!recipient?.recipient_code) {
    await db
      .from("payouts")
      .update({
        status: "failed",
        failure_reason: "no payout account on file",
        updated_at: new Date().toISOString(),
      })
      .eq("id", payout_id);
    return NextResponse.json({ status: "failed", error: "no account" });
  }

  const reference = `payout_${payout_id}_${Date.now()}`;
  try {
    const transfer = await initiateTransfer({
      amountNaira: claimed.amount_naira,
      recipientCode: recipient.recipient_code,
      reason: "FlagRisk referral earnings",
      reference,
    });
    await db
      .from("payouts")
      .update({
        status: mapTransferStatus(transfer.status),
        paystack_transfer_code: transfer.transfer_code,
        paystack_ref: transfer.reference ?? reference,
        updated_at: new Date().toISOString(),
      })
      .eq("id", payout_id);
    return NextResponse.json({ status: mapTransferStatus(transfer.status) });
  } catch (e) {
    const message = e instanceof Error ? e.message : "transfer failed";
    await db
      .from("payouts")
      .update({
        status: "failed",
        failure_reason: message,
        updated_at: new Date().toISOString(),
      })
      .eq("id", payout_id);
    return NextResponse.json({ status: "failed", error: message });
  }
}
