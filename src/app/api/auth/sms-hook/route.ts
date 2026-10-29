import { NextResponse, type NextRequest } from "next/server";
import { Webhook } from "standardwebhooks";
import { sendTermiiSms } from "@/lib/termii";

// Supabase "Send SMS" auth hook (HTTPS). Supabase calls this whenever it needs
// to deliver a phone OTP (signup, login, phone change). It signs the request
// with SEND_SMS_HOOK_SECRET (Standard Webhooks). We verify, then hand the code
// to Termii. Returning non-2xx makes Supabase surface the send failure.
//
// Payload shape: { user: { phone, ... }, sms: { otp } }

type HookPayload = {
  user: { phone?: string };
  sms: { otp: string };
};

export async function POST(request: NextRequest) {
  const secret = process.env.SEND_SMS_HOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "hook not configured" }, { status: 500 });
  }

  const raw = await request.text();
  const headers: Record<string, string> = {};
  request.headers.forEach((v, k) => (headers[k] = v));

  let payload: HookPayload;
  try {
    // standardwebhooks wants the base64 secret, without the "v1,whsec_" prefix.
    const wh = new Webhook(secret.replace("v1,whsec_", ""));
    payload = wh.verify(raw, headers) as HookPayload;
  } catch {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  const phone = (payload.user?.phone ?? "").replace(/[^0-9]/g, "");
  const otp = payload.sms?.otp;
  if (!phone || !otp) {
    return NextResponse.json({ error: "missing phone or otp" }, { status: 400 });
  }

  try {
    await sendTermiiSms(
      phone,
      `${otp} is your FlagRisk verification code. It expires in 10 minutes. Never share it.`,
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "send failed";
    return NextResponse.json(
      { error: { http_code: 502, message } },
      { status: 502 },
    );
  }

  return NextResponse.json({});
}
