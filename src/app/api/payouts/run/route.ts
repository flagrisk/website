import { NextResponse, type NextRequest } from "next/server";
import { requireAdminFromRequest } from "@/lib/admin";
import { createServiceClient } from "@/lib/supabase/server";
import { initiateTransfer, mapTransferStatus } from "@/lib/paystack";

// Admin-triggered payout processing. Initiates a Paystack transfer for each
// given pending payout (or all pending ones), then records the outcome.
// POST body: { payout_id?: string }  — omit to process every pending payout.
export async function POST(request: NextRequest) {
  const admin = await requireAdminFromRequest(request);
  if (!admin) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { payout_id } = (await request.json().catch(() => ({}))) as {
    payout_id?: string;
  };

  const db = createServiceClient();

  let query = db
    .from("payouts")
    .select("id, user_id, amount_naira, status")
    .eq("status", "pending");
  if (payout_id) query = query.eq("id", payout_id);

  const { data: payouts, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const results: Array<{ id: string; status: string; error?: string }> = [];

  for (const p of payouts ?? []) {
    // Claim the row so a second run can't double-pay it.
    const { data: claimed } = await db
      .from("payouts")
      .update({ status: "processing", updated_at: new Date().toISOString() })
      .eq("id", p.id)
      .eq("status", "pending")
      .select("id")
      .maybeSingle();
    if (!claimed) {
      results.push({ id: p.id, status: "skipped" });
      continue;
    }

    const { data: recipient } = await db
      .from("payout_recipients")
      .select("recipient_code")
      .eq("user_id", p.user_id)
      .maybeSingle();

    if (!recipient?.recipient_code) {
      await db
        .from("payouts")
        .update({
          status: "failed",
          failure_reason: "no payout account on file",
          updated_at: new Date().toISOString(),
        })
        .eq("id", p.id);
      results.push({ id: p.id, status: "failed", error: "no account" });
      continue;
    }

    const reference = `payout_${p.id}`;
    try {
      const transfer = await initiateTransfer({
        amountNaira: p.amount_naira,
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
        .eq("id", p.id);
      results.push({ id: p.id, status: mapTransferStatus(transfer.status) });
    } catch (e) {
      const message = e instanceof Error ? e.message : "transfer failed";
      // Leave as failed so the amount frees back up for a retry.
      await db
        .from("payouts")
        .update({
          status: "failed",
          failure_reason: message,
          updated_at: new Date().toISOString(),
        })
        .eq("id", p.id);
      results.push({ id: p.id, status: "failed", error: message });
    }
  }

  return NextResponse.json({ processed: results.length, results });
}
