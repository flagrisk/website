import type { Metadata } from "next";
import { Suspense } from "react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { PlansTable } from "@/components/site/PlansTable";

export const metadata: Metadata = {
  title: "Plans",
  description:
    "Choose how far your FlagRisk circle can reach. Start free, or pick a plan for a wider alert radius and longer history. Secure payment by Paystack.",
};

const FAQ = [
  {
    q: "What do I actually pay for?",
    a: "A paid plan widens how far an alarm reaches your circle and keeps your history longer. The safety basics, your circle, alarms, and trips, work on every plan including the free one.",
  },
  {
    q: "Can I change or cancel later?",
    a: "Yes. Move up, move down, or cancel whenever you want from your account. A change takes effect from your next billing date.",
  },
  {
    q: "How do I pay?",
    a: "Payment is handled securely by Paystack, with the cards and bank options you already use in Nigeria. FlagRisk never sees your card details.",
  },
  {
    q: "Does the free plan expire?",
    a: "No. Basic is free for as long as you want it. You only pay if you choose a wider plan.",
  },
];

export default function PlansPage() {
  return (
    <>
      <Header />
      <main>
        {/* Transformation-led intro */}
        <section className="glow relative bg-night">
          <div className="relative mx-auto max-w-3xl px-5 py-20 text-center md:py-24">
            <p className="eyebrow mx-auto mb-4 w-fit text-lime">Plans</p>
            <h1 className="text-4xl text-parchment md:text-5xl">
              Pick how far your people can reach you.
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-parchment/75">
              Every plan starts from the same promise: the people you trust are one tap away. A paid
              plan simply widens how far that reach travels, for circles spread across a city, a
              region, or the whole country.
            </p>
          </div>
        </section>

        {/* Plans */}
        <section className="bg-parchment text-ink">
          <div className="mx-auto max-w-6xl px-5 py-16 md:py-20">
            <Suspense fallback={<div className="h-80" />}>
              <PlansTable />
            </Suspense>
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-parchment text-ink">
          <div className="mx-auto max-w-3xl px-5 pb-24">
            <h2 className="text-2xl md:text-3xl">Questions people ask first.</h2>
            <div className="mt-8 divide-y divide-ink/10 border-t border-ink/10">
              {FAQ.map((f) => (
                <div key={f.q} className="py-6">
                  <h3 className="text-lg text-ink">{f.q}</h3>
                  <p className="mt-2 leading-relaxed text-ink/65">{f.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
