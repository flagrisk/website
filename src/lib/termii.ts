// Server-only Termii SMS client. Used by the Supabase Send SMS auth hook to
// deliver login/signup OTP codes. Nigeria endpoint by default.
import "server-only";

const BASE = process.env.TERMII_BASE_URL ?? "https://api.ng.termii.com";

export async function sendTermiiSms(toDigits: string, message: string) {
  const apiKey = process.env.TERMII_API_KEY;
  const from = process.env.TERMII_SENDER_ID;
  if (!apiKey || !from) {
    throw new Error("TERMII_API_KEY or TERMII_SENDER_ID not set");
  }

  const res = await fetch(`${BASE}/api/sms/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: apiKey,
      to: toDigits, // digits only, no leading +
      from, // approved sender ID
      sms: message,
      type: "plain",
      // DND channel so transactional OTP reaches DND-registered Nigerian numbers.
      channel: process.env.TERMII_CHANNEL ?? "dnd",
    }),
    cache: "no-store",
  });

  const body = (await res.json().catch(() => ({}))) as {
    message_id?: string;
    message?: string;
    code?: string;
  };

  // Termii returns 200 with a message_id on success; otherwise an error message.
  if (!res.ok || (body.code && body.code !== "ok" && !body.message_id)) {
    throw new Error(body.message || `Termii send failed (${res.status})`);
  }
  return body;
}
