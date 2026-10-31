import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

// Public intake for compliance requests from the website (account deletion and
// other data subject requests). We take these through a form, not by email.
// The row is a request record only. Identity is confirmed, and the account is
// actually deleted, as separate steps worked in the admin console.
const TYPES = new Set([
  "deletion",
  "access",
  "correction",
  "objection",
  "withdraw_consent",
  "other",
]);

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }

  // Honeypot. A real person leaves this empty; a bot fills it. Report success
  // so the bot does not learn it was caught, but write nothing.
  if (typeof body.company === "string" && body.company.trim() !== "") {
    return NextResponse.json({ ok: true });
  }

  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  if (phone.length < 7 || phone.length > 20) {
    return NextResponse.json(
      { error: "Enter the mobile number on your account." },
      { status: 400 },
    );
  }

  const requestType =
    typeof body.request_type === "string" && TYPES.has(body.request_type)
      ? body.request_type
      : "deletion";

  const clip = (v: unknown, n: number) =>
    typeof v === "string" && v.trim() !== "" ? v.trim().slice(0, n) : null;

  const row = {
    request_type: requestType,
    full_name: clip(body.full_name, 120),
    phone: phone.slice(0, 20),
    email: clip(body.email, 160),
    channel: clip(body.channel, 20),
    reason: clip(body.reason, 2000),
    source: "website",
    user_agent: (request.headers.get("user-agent") ?? "").slice(0, 400) || null,
  };

  const db = createServiceClient();
  const { error } = await db.from("data_requests").insert(row);
  if (error) {
    return NextResponse.json(
      { error: "We could not save your request. Please try again." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
