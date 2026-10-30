import { NextResponse, type NextRequest } from "next/server";
import { requireAdminFromRequest } from "@/lib/admin";
import { createServiceClient } from "@/lib/supabase/server";
import { fetchTransfer, mapTransferStatus } from "@/lib/paystack";

// Re-check every payout still "processing" against Paystack and settle it.
// Useful when a transfer came back pending, or if no webhook is configured.
export async function POST(request: NextRequest) {
  const admin = await requireAdminFromRequest(request);
  if (!admin) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const db = createServiceClient();
  const { data: payouts, error } = await db
    .from("payouts")
    .select("id, paystack_ref")
    .eq("status", "processing");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const results: Array<{ id: string; status: string }> = [];

  for (const p of payouts ?? []) {
    if (!p.paystack_ref) continue;
    try {
      const transfer = await fetchTransfer(p.paystack_ref);
      const status = mapTransferStatus(transfer.status);
      if (status !== "processing") {
        await db
          .from("payouts")
          .update({ status, updated_at: new Date().toISOString() })
          .eq("id", p.id);
      }
      results.push({ id: p.id, status });
    } catch {
      // leave it for the next reconcile
    }
  }

  return NextResponse.json({ checked: results.length, results });
}
