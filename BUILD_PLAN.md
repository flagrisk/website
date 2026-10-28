# FlagRisk website — build plan

The functional website for FlagRisk. Marketing frontend + member accounts +
subscriptions + a 3-way referral programme with automated payouts + an admin
console. Design comes later; this plan is about what the site *does*.

- **Stack:** Next.js 16 (App Router) · React 19 · Tailwind v4 · TypeScript
- **Backend:** existing Supabase project `aqgkntulbuqqqjxjafmw` (shared with the app)
- **Payments & payouts:** Paystack (subscriptions in, automated transfers out)
- **Deploy:** Vercel, replacing flagrisk.org

## Architecture

```
Browser ──► Next.js (Vercel)
               │
               ├─ public marketing pages (home, plans, about, contact, stories)
               ├─ /login /signup            → Supabase Auth (email + password)
               ├─ /dashboard  (gated)        → subscription, referral link, earnings, payouts
               ├─ /admin      (gated, admin) → users, referrals, payouts, metrics
               │
               ├─ /api/paystack/initialize   → start a checkout (server)
               ├─ /api/paystack/webhook      → activate sub, award paid_plan reward (server, service role)
               └─ /api/payouts/run           → create Paystack transfer for a pending payout (server, service role)
               │
               └──► Supabase (Postgres + Auth + RLS)
```

Session gating lives in `proxy.ts` (Next 16's renamed middleware): anyone hitting
`/dashboard` or `/admin` without a session is bounced to `/login`.

## Database (supabase/migrations/0001_web_schema.sql)

All new tables are web-scoped and sit beside the app's tables. RLS everywhere;
every cross-user or money-moving write goes through a `SECURITY DEFINER` RPC so
members can never mint their own rewards.

| Table | Holds |
|---|---|
| `web_roles` | who is an admin (`is_admin()`) |
| `referral_codes` | one stable code per member (`ensure_referral_code()`) |
| `referrals` | who referred whom (one row per referred person) |
| `referral_rewards` | one row per earned milestone; `unique(referred_id, milestone)` |
| `website_subscriptions` | plan bought on web/WhatsApp, Paystack refs, period end |
| `payout_recipients` | Paystack transfer recipient per member |
| `payouts` | a withdrawal of referral earnings |

RPCs: `record_referral(code)`, `award_referral_reward(referred, milestone)`,
`my_referral_balance()`, `request_payout(amount)`.

## Referral engine

A referrer earns up to **₦400** per person they bring in:

| Milestone | Trigger | Reward |
|---|---|---|
| signup | referred person creates an account | ₦100 |
| circle | referred person builds a safety circle | ₦100 |
| paid_plan | referred person starts a paid plan | ₦200 |

- `signup` is awarded the moment the new user is attributed (`record_referral`).
- `paid_plan` is awarded by the Paystack webhook when a subscription goes active.
- `circle` is awarded when the app records a circle for that user (hook TBD — a
  DB trigger on the app's circle table, or a small server endpoint the app calls).
- Withdraw at **₦1,000** minimum; `request_payout` checks the balance, then
  trusted server code fires an automated Paystack transfer.

## Money rules (locked)

- Subscriptions are sold on **web/WhatsApp only**, never in-app (Google Play
  Nigeria billing policy).
- `SUPABASE_SERVICE_ROLE_KEY` and `PAYSTACK_SECRET_KEY` are **server-only**, never
  in a Client Component, never committed. Env vars only.
- Every Paystack webhook is signature-verified before it changes anything.

## Milestones

1. **Foundation** ✅ — scaffold, Supabase clients, proxy gating, env template, schema, referral constants.
2. **Auth + dashboard** — signup (with `?ref=` capture), login, logout; dashboard showing subscription status, referral link, milestone progress, earnings, and a payout request + history.
3. **Paystack** — checkout initialize, signature-verified webhook (activate sub + award `paid_plan`), transfer-recipient creation, automated payout transfer, payout status reconcile.
4. **Admin console** — members, referrals, payouts (approve/retry), headline metrics.

## Env (see .env.example)

`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`,
`PAYSTACK_SECRET_KEY`, `PAYSTACK_WEBHOOK_SECRET`, `NEXT_PUBLIC_SITE_URL`.
