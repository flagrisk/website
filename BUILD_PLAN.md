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
               ├─ checkout                   → reuse the app's paystack-init Edge Function
               ├─ /auth/callback             → verify via the app's paystack-verify Edge Function
               └─ /api/payouts/run           → create Paystack transfer for a pending payout (server, service role)
               │
               └──► Supabase (Postgres + Auth + RLS) — SHARED with the app and WhatsApp bot
```

Session gating lives in `proxy.ts` (Next 16's renamed middleware): anyone hitting
`/dashboard` or `/admin` without a session is bounced to `/login`.

## Shared database

One Supabase project (`aqgkntulbuqqqjxjafmw`) serves the app, the WhatsApp bot,
and this website. The app already owns `profiles` (gates features on
`profiles.current_tier` = basic/standard/pro/premium), `subscriptions`,
`payments`, `network_connections`, and more. The website adds only new tables
and never duplicates app state.

**Subscriptions are not re-implemented.** The app's `paystack-init` /
`paystack-verify` Edge Functions already set `current_tier` and write
`subscriptions` + `payments`. The website reuses them, so a web or WhatsApp
purchase unlocks the app through the exact same path.

### New objects — 0001_web_schema.sql (safe; touches nothing the app owns)

| Table | Holds |
|---|---|
| `web_roles` | website console admins (`web_is_admin()`) |
| `referral_codes` | one stable code per member (`ensure_referral_code()`) |
| `referrals` | who referred whom (one row per referred person) |
| `referral_rewards` | one row per earned milestone; `unique(referred_id, milestone)` |
| `payout_recipients` | Paystack transfer recipient per member |
| `payouts` | a withdrawal of referral earnings |

RPCs: `record_referral(code)`, `award_referral_reward(referred, milestone)`,
`my_referral_balance()`, `request_payout(amount)`. `is_admin` was renamed
`web_is_admin` to avoid colliding with anything in the app's `public` schema.

### Triggers — 0002_web_triggers.sql (review before running; touches app tables)

Milestones must fire whichever surface the referred person used, so two triggers
sit on app-owned tables. Both swallow their own errors and can never block or
fail an app write.

| Trigger | On | Awards |
|---|---|---|
| `web_paid_plan_trg` | `profiles` when `current_tier` becomes paid | paid_plan |
| `web_circle_trg` | first `network_connections` row for an owner | circle |

## Referral engine

A referrer earns up to **₦400** per person they bring in:

| Milestone | Trigger | Reward |
|---|---|---|
| signup | referred person creates an account | ₦100 |
| circle | referred person builds a safety circle | ₦100 |
| paid_plan | referred person starts a paid plan | ₦200 |

- `signup` is awarded the moment the new user is attributed (`record_referral`).
- `paid_plan` is awarded by `web_paid_plan_trg` when `profiles.current_tier`
  becomes a paid tier (i.e. after `paystack-verify` runs), on any surface.
- `circle` is awarded by `web_circle_trg` on the first `network_connections`
  row for a user.
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
3. **Paystack** — checkout by reusing the app's `paystack-init`, confirm by reusing `paystack-verify` (which sets `current_tier`; the trigger then awards `paid_plan`), transfer-recipient creation, automated payout transfer, payout status reconcile.
4. **Admin console** — members, referrals, payouts (approve/retry), headline metrics.

## Env (see .env.example)

`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`,
`PAYSTACK_SECRET_KEY`, `PAYSTACK_WEBHOOK_SECRET`, `NEXT_PUBLIC_SITE_URL`.
