// paystack-init — UPDATED to accept a customer email from the request body when
// the account has none (phone-only website signups). Backward compatible: it
// uses user.email first, then body.email. Deploy with:
//   npx supabase functions deploy paystack-init --project-ref aqgkntulbuqqqjxjafmw
//
// Only the email handling changed from the original (marked CHANGED below).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body, status) {
  return new Response(JSON.stringify(body), { status: status || 200, headers: { ...cors, "Content-Type": "application/json" } });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const ANON = Deno.env.get("SUPABASE_ANON_KEY");
  const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  const authHeader = req.headers.get("Authorization") || "";
  const userClient = createClient(SUPABASE_URL, ANON, { global: { headers: { Authorization: authHeader } } });
  const { data: auth, error: authErr } = await userClient.auth.getUser();
  if (authErr || !auth || !auth.user) return json({ error: "Not authenticated" }, 401);
  const user = auth.user;

  let body = {};
  try { body = await req.json(); } catch (_e) { /* allow empty */ }

  // CHANGED: email may come from the account OR the request (phone-only users).
  const bodyEmail = typeof body.email === "string" ? body.email.trim() : "";
  const email = user.email || bodyEmail;
  if (!email) return json({ error: "No email provided" }, 400);

  const mode = String(body.mode || "tier").toLowerCase();
  const country = String(body.country || "NG").toUpperCase();

  const svc = createClient(SUPABASE_URL, SERVICE);

  const acctRes = await svc
    .from("payment_accounts")
    .select("provider, country, currency, account_ref, is_active, is_default")
    .eq("country", country).eq("is_active", true).eq("is_default", true)
    .limit(1).maybeSingle();
  if (acctRes.error) return json({ error: "Routing lookup failed: " + acctRes.error.message }, 500);
  const acct = acctRes.data;
  if (!acct) return json({ error: "No active payment account configured for " + country }, 400);
  if (acct.provider !== "paystack") return json({ error: "This market routes to " + acct.provider + ", not paystack" }, 400);

  const secret = Deno.env.get(acct.account_ref);
  if (!secret) return json({ error: "Missing secret for account_ref " + acct.account_ref }, 500);

  const currency = acct.currency;
  let amountLocal = 0;
  let meta = {};

  if (mode === "custom") {
    const km = body.custom_unlimited ? null : Number(body.custom_km);
    const unlimited = !!body.custom_unlimited;
    const qRes = await svc.rpc("quote_coverage", { p_km: km, p_unlimited: unlimited });
    if (qRes.error) return json({ error: "Coverage quote failed: " + qRes.error.message }, 500);
    const row = qRes.data && qRes.data[0] ? qRes.data[0] : null;
    const monthly = row ? Number(row.monthly_ngn) : null;
    if (!monthly || monthly <= 0) return json({ error: "Could not price custom coverage" }, 400);
    amountLocal = monthly;
    meta = { user_id: user.id, mode: "custom", custom_km: km, custom_unlimited: unlimited, country: country, account_ref: acct.account_ref };
  } else {
    const tier = String(body.tier || "").toLowerCase();
    const interval = String(body.billing_interval || "monthly").toLowerCase();
    if (!tier) return json({ error: "tier is required" }, 400);
    if (interval !== "monthly" && interval !== "annual") return json({ error: "billing_interval must be monthly or annual" }, 400);

    const tpRes = await svc
      .from("tier_prices")
      .select("amount")
      .eq("tier", tier).eq("currency", currency).eq("interval", interval)
      .maybeSingle();

    if (tpRes.data && Number(tpRes.data.amount) > 0) {
      amountLocal = Number(tpRes.data.amount);
    } else {
      const tcRes = await svc.from("tier_config").select("price_usd_month, price_usd_year").eq("tier", tier).maybeSingle();
      if (tcRes.error || !tcRes.data) return json({ error: "Unknown tier: " + tier }, 400);
      const usd = interval === "annual" ? Number(tcRes.data.price_usd_year) : Number(tcRes.data.price_usd_month);
      if (!usd || usd <= 0) return json({ error: "This tier is free or unpriced; no payment needed" }, 400);
      let rate = 1;
      if (currency !== "USD") {
        const crRes = await svc.from("currency_rates").select("usd_rate").eq("code", currency).maybeSingle();
        if (!crRes.data || !crRes.data.usd_rate) return json({ error: "No exchange rate set for " + currency }, 400);
        rate = Number(crRes.data.usd_rate);
      }
      amountLocal = usd * rate;
    }
    meta = { user_id: user.id, tier: tier, billing_interval: interval, country: country, account_ref: acct.account_ref };
  }

  const amountSubunit = Math.round(amountLocal * 100);
  const reference = "FR_" + user.id.slice(0, 8) + "_" + Date.now();

  const initRes = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: { Authorization: "Bearer " + secret, "Content-Type": "application/json" },
    // CHANGED: use the resolved email (account or request).
    body: JSON.stringify({ email: email, amount: amountSubunit, currency: currency, reference: reference, metadata: meta }),
  });
  const initJson = await initRes.json().catch(() => ({}));
  if (!initRes.ok || !initJson || !initJson.status) {
    return json({ error: "Paystack init failed", detail: (initJson && initJson.message) || initRes.statusText }, 502);
  }

  return json({
    authorization_url: initJson.data.authorization_url,
    access_code: initJson.data.access_code,
    reference: initJson.data.reference,
    currency: currency,
    amount: amountLocal,
  });
});
