import { NextResponse, type NextRequest } from "next/server";
import crypto from "node:crypto";
import { createServiceClient } from "@/lib/supabase/server";
import { mapTransferStatus } from "@/lib/paystack";

// Optional: if a Paystack webhook URL is pointed here, transfer.* events settle
// payouts instantly. Settlement also works without this via /api/payouts/reconcile.
// Only transfer events are handled; subscription charges are owned by the app's
// own Edge Functions, so anything else is acknowledged and ignored.
export async function POST(request: NextRequest) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) {
    return NextResponse.json({ error: "not configured" }, { status: 500 });
  }

  const raw = await request.text();
  const signature = request.headers.get("x-paystack-signature") ?? "";
  const expected = crypto
    .createHmac("sha512", secret)
    .update(raw)
    .digest("hex");

  if (
    signature.length !== expected.length ||
    !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  ) {
    return NextResponse.json({ error: "bad signature" }, { status: 401 });
  }

  const event = JSON.parse(raw) as {
    event?: string;
    data?: { transfer_code?: string; reference?: string; status?: string };
  };

  if (event.event?.startsWith("transfer.") && event.data) {
    const db = createServiceClient();
    const status = mapTransferStatus(event.data.status ?? "");
    const match = event.data.transfer_code
      ? { col: "paystack_transfer_code", val: event.data.transfer_code }
      : event.data.reference
        ? { col: "paystack_ref", val: event.data.reference }
        : null;

    if (match) {
      await db
        .from("payouts")
        .update({ status, updated_at: new Date().toISOString() })
        .eq(match.col, match.val);
    }
  }

  // Always 200 so Paystack stops retrying a handled event.
  return NextResponse.json({ received: true });
}
