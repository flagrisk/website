import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

// Public support intake for website visitors with no account. Creates a guest
// ticket in the same support_tickets queue the app and admin console use, via
// the create_guest_support_ticket RPC.
export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }

  // Honeypot: a real person leaves this empty.
  if (typeof body.company === "string" && body.company.trim() !== "") {
    return NextResponse.json({ ok: true });
  }

  const s = (v: unknown, n: number) =>
    typeof v === "string" ? v.trim().slice(0, n) : "";
  const name = s(body.name, 120);
  const email = s(body.email, 160);
  const subject = s(body.subject, 160);
  const message = s(body.message, 4000);

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json(
      { error: "Enter a valid email address." },
      { status: 400 },
    );
  }
  if (!subject || !message) {
    return NextResponse.json(
      { error: "Enter a subject and a message." },
      { status: 400 },
    );
  }

  const db = createServiceClient();
  const { error } = await db.rpc("create_guest_support_ticket", {
    p_name: name,
    p_email: email,
    p_subject: subject,
    p_message: message,
  });
  if (error) {
    return NextResponse.json(
      { error: "We could not send your message. Please try again." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
