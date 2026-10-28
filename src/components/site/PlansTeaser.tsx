import Link from "next/link";
import { TIERS, formatNaira } from "@/lib/tiers";
import { ArrowRightIcon } from "./Icons";

export function PlansTeaser() {
  return (
    <section id="plans" className="bg-white text-ink">
      <div className="mx-auto max-w-7xl px-6 py-24 md:px-10 md:py-28">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <p className="eyebrow mb-5">Plans</p>
            <h2 className="display">Reach further as your circle grows.</h2>
            <p className="mt-5 text-lg text-slate">
              Start free. A paid plan widens how far an alarm travels and keeps your history longer.
            </p>
          </div>
          <Link href="/plans" className="btn btn-primary shrink-0">
            Compare plans <ArrowRightIcon size={18} />
          </Link>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {TIERS.map((t) => (
            <Link
              key={t.id}
              href={`/plans?plan=${t.id}`}
              className={[
                "flex flex-col rounded-2xl p-7 transition-transform hover:-translate-y-1",
                t.hero ? "bg-night text-parchment" : "card-flat",
              ].join(" ")}
            >
              <div className="flex items-center justify-between">
                <h3 className={t.hero ? "text-lg text-parchment" : "text-lg text-ink"}>{t.name}</h3>
                {t.hero && (
                  <span className="rounded-full bg-lime px-2.5 py-1 text-[11px] font-bold text-ink">
                    Most reach
                  </span>
                )}
              </div>
              <div className="mt-3">
                <span className={t.hero ? "text-2xl font-bold text-parchment" : "text-2xl font-bold text-ink"}>
                  {t.monthly === 0 ? "Free" : formatNaira(t.monthly)}
                </span>
                {t.monthly > 0 && (
                  <span className={t.hero ? "text-sm text-parchment/55" : "text-sm text-slate"}> / mo</span>
                )}
              </div>
              <div className={["mt-5 text-sm", t.hero ? "text-parchment/75" : "text-slate"].join(" ")}>
                {t.radius}
              </div>
              <div className={["mt-1 text-sm", t.hero ? "text-parchment/75" : "text-slate"].join(" ")}>
                {t.retention}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
