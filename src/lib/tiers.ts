// Single source of truth for the plan tiers, shared by the marketing Plans
// section and, later, the subscription checkout. Prices are monthly in NGN.
// These mirror the app's tiers exactly so the website and app never disagree.

export type Tier = {
  id: "basic" | "standard" | "pro" | "premium";
  name: string;
  monthly: number; // NGN per month, 0 for free
  radius: string;
  retention: string;
  verification: string;
  paid: boolean;
  hero: boolean;
  blurb: string;
};

export const TIERS: Tier[] = [
  {
    id: "basic",
    name: "Basic",
    monthly: 0,
    radius: "5 km alert radius",
    retention: "7 days history",
    verification: "Standard verification",
    paid: false,
    hero: false,
    blurb: "Everything you need to start a circle and keep each other safe.",
  },
  {
    id: "standard",
    name: "Standard",
    monthly: 700,
    radius: "15 km alert radius",
    retention: "30 days history",
    verification: "Standard verification",
    paid: true,
    hero: false,
    blurb: "A wider reach for people whose circle is spread across a city.",
  },
  {
    id: "pro",
    name: "Pro",
    monthly: 1300,
    radius: "50 km alert radius",
    retention: "90 days history",
    verification: "Standard verification",
    paid: true,
    hero: false,
    blurb: "For circles that travel between towns and need more room.",
  },
  {
    id: "premium",
    name: "Premium",
    monthly: 2500,
    radius: "500 km alert radius",
    retention: "180 days history",
    verification: "Priority verification",
    paid: true,
    hero: true,
    blurb: "The widest reach, longest history, and priority verification.",
  },
];

export function formatNaira(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);
}
