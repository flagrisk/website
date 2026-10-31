import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

// Public support chat for website visitors with no account. A chat is a guest
// ticket in the same support_tickets queue the app and admin console use. The
// visitor holds a per-chat secret token (kept in their browser) that guards
// reading and posting to their own ticket. Replies come from the admin console.
export async function POST(request: NextRequest) {
  let b: Record<string, unknown>;
  try {
    b = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }

  const action = typeof b.action === "string" ? b.action : "";
  const s = (v: unknown, n: number) =>
    typeof v === "string" ? v.trim().slice(0, n) : "";
  const db = createServiceClient();

  if (action === "start") {
    // Honeypot: a real person leaves this empty.
    if (typeof b.company === "string" && b.company.trim() !== "") {
      return NextResponse.json({ ticket: "", token: "" });
    }
    const name = s(b.name, 120);
    const email = s(b.email, 160);
    const phone = s(b.phone, 40);
    if (!email && !phone) {
      return NextResponse.json(
        { error: "Add an email or phone number so we can reach you." },
        { status: 400 },
      );
    }
    const { data, error } = await db.rpc("guest_chat_start", {
      p_name: name,
      p_email: email,
      p_phone: phone,
    });
    if (error) {
      const msg = /valid/i.test(error.message)
        ? "Enter a valid email address."
        : "We could not start the chat. Please try again.";
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    return NextResponse.json(data);
  }

  if (action === "send") {
    const ticket = s(b.ticket, 64);
    const token = s(b.token, 80);
    const body = s(b.body, 4000);
    if (!ticket || !token || !body) {
      return NextResponse.json({ error: "Missing fields." }, { status: 400 });
    }
    const { error } = await db.rpc("guest_chat_send", {
      p_ticket: ticket,
      p_token: token,
      p_body: body,
    });
    if (error) {
      return NextResponse.json(
        { error: "We could not send your message." },
        { status: 400 },
      );
    }
    return NextResponse.json({ ok: true });
  }

  if (action === "thread") {
    const ticket = s(b.ticket, 64);
    const token = s(b.token, 80);
    if (!ticket || !token) {
      return NextResponse.json({ error: "Missing fields." }, { status: 400 });
    }
    const { data, error } = await db.rpc("guest_chat_thread", {
      p_ticket: ticket,
      p_token: token,
    });
    if (error) {
      return NextResponse.json({ error: "Could not load." }, { status: 400 });
    }
    return NextResponse.json({ messages: data ?? [] });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
