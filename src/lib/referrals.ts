// Referral programme constants. One source of truth for the amounts, shared by
// the UI and the server code. Amounts are whole Naira.
//
// A referrer earns up to NGN 400 for each person they bring in, across three
// milestones:
//   1. signup     - the referred person creates an account      -> NGN 100
//   2. circle     - the referred person builds a safety circle   -> NGN 100
//   3. paid_plan  - the referred person starts a paid plan       -> NGN 200

export const REFERRAL_REWARDS = {
  signup: 100,
  circle: 100,
  paid_plan: 200,
} as const;

export type ReferralMilestone = keyof typeof REFERRAL_REWARDS;

export const MAX_PER_REFERRAL =
  REFERRAL_REWARDS.signup + REFERRAL_REWARDS.circle + REFERRAL_REWARDS.paid_plan; // 400

// Minimum balance a member can withdraw in one payout (Naira).
export const MIN_PAYOUT_NAIRA = 1000;

export const MILESTONE_LABEL: Record<ReferralMilestone, string> = {
  signup: "Joined FlagRisk",
  circle: "Built their safety circle",
  paid_plan: "Started a paid plan",
};
