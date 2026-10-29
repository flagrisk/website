"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { TIERS, formatNaira } from "@/lib/tiers";
import { CheckIcon } from "./Icons";

// Annual billing charges 12 months up front for now (no discount set yet).
// Change MONTHS_CHARGED_ANNUAL to e.g. 10 to give "2 months free".
const MONTHS_CHARGED_ANNUAL = 12;

export function PlansTable() {
  const [annual, setAnnual] = useState(false);
  const initialPlan = useSearchParams().get("plan") ?? undefined;

  return (
    <div>
      <div className="flex justify-center">
        <div className="inline-flex rounded-lg border border-ink/15 bg-white p-1">
          <button
            onClick={() => setAnnual(false)}
            className={[
              "rounded-md px-5 py-2 text-sm font-semibold transition-colors",
              !annual ? "bg-night text-parchment" : "text-ink/60 hover:text-ink",
            ].join(" ")}
          >
            Monthly
          </button>
          <button
            onClick={() => setAnnual(true)}
            className={[
              "rounded-md px-5 py-2 text-sm font-semibold transition-colors",
              annual ? "bg-night text-parchment" : "text-ink/60 hover:text-ink",
            ].join(" ")}
          >
            Annual
          </button>
        </div>
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {TIERS.map((t) => {
          const highlighted = initialPlan ? t.id === initialPlan : t.hero;
          const price = annual ? t.monthly * MONTHS_CHARGED_ANNUAL : t.monthly;
          return (
            <div
              key={t.id}
              className={[
                "flex flex-col rounded-2xl p-7",
                highlighted ? "bg-night text-parchment" : "card-flat text-ink",
              ].join(" ")}
            >
              <div className="flex items-center justify-between">
                <h3 className={highlighted ? "text-xl text-parchment" : "text-xl text-ink"}>{t.name}</h3>
                {t.hero && (
                  <span className="rounded-full bg-lime px-2.5 py-1 text-[11px] font-bold text-ink">
                    Most reach
                  </span>
                )}
              </div>

              <div className="mt-4">
                <span className="text-3xl font-bold">
                  {t.monthly === 0 ? "Free" : formatNaira(price)}
                </span>
                {t.monthly > 0 && (
                  <span className={highlighted ? "text-parchment/60" : "text-ink/55"}>
                    {annual ? " / year" : " / month"}
                  </span>
                )}
              </div>

              <p className={["mt-3 text-sm leading-relaxed", highlighted ? "text-parchment/70" : "text-ink/60"].join(" ")}>
                {t.blurb}
              </p>

              <ul className={["mt-6 space-y-3 text-sm", highlighted ? "text-parchment/85" : "text-ink/75"].join(" ")}>
                {[t.radius, t.retention, t.verification, "Up to 7 people in your circle"].map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <CheckIcon size={18} className={highlighted ? "mt-0.5 text-lime" : "mt-0.5 text-teal"} />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-7 pt-1">
                <Link
                  href={
                    t.paid
                      ? `/checkout?tier=${t.id}&cycle=${annual ? "annual" : "monthly"}`
                      : `/signup?plan=${t.id}`
                  }
                  className={["btn w-full", highlighted ? "btn-lime" : t.paid ? "btn-primary" : "btn-outline"].join(" ")}
                >
                  {t.paid ? `Choose ${t.name}` : "Start free"}
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-6 text-center text-sm text-ink/55">
        Prices are in Nigerian Naira. Secure payment by Paystack. Change or cancel anytime.
      </p>
    </div>
  );
}
