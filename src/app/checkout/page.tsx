import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TIERS, formatNaira } from "@/lib/tiers";
import { CheckoutClient } from "@/components/checkout/CheckoutClient";

export const metadata: Metadata = { title: "Checkout" };
export const instant = false;

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ tier?: string; cycle?: string }>;
}) {
  const sp = await searchParams;
  const tierId = (sp.tier ?? "").toLowerCase();
  const cycle: "monthly" | "annual" = sp.cycle === "annual" ? "annual" : "monthly";

  const tier = TIERS.find((t) => t.id === tierId && t.paid);
  if (!tier) redirect("/plans");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/checkout?tier=${tierId}&cycle=${cycle}`)}`);
  }
  const hasEmail = !!user.email;

  // Annual is two months free (10 months), matching tier_prices / paystack-init.
  const amount = cycle === "annual" ? tier.monthly * 10 : tier.monthly;
  const priceLabel = formatNaira(amount);

  return (
    <main className="min-h-screen bg-mist flex flex-col items-center justify-center px-5 py-16">
      <div className="w-full max-w-[440px]">
        <Link href="/plans" className="mb-6 inline-block text-sm text-slate hover:text-ink">
          ← Back to plans
        </Link>
        <div className="rounded-[14px] border border-line bg-white p-7 shadow-sm">
          <h1 className="text-xl font-semibold text-night">Confirm your plan</h1>

          <div className="mt-6 rounded-[10px] bg-mist p-4">
            <div className="flex items-baseline justify-between">
              <span className="font-semibold text-ink">{tier.name}</span>
              <span className="text-lg font-semibold text-night">
                {priceLabel}
                <span className="text-sm font-normal text-slate">
                  {cycle === "annual" ? " / year" : " / month"}
                </span>
              </span>
            </div>
            <ul className="mt-3 space-y-1 text-sm text-slate">
              <li>{tier.radius}</li>
              <li>{tier.retention}</li>
              <li>{tier.verification}</li>
              <li>Up to 7 people in your circle</li>
            </ul>
          </div>

          <div className="mt-6">
            <CheckoutClient
              tier={tier.id}
              tierName={tier.name}
              cycle={cycle}
              priceLabel={priceLabel}
              hasEmail={hasEmail}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
