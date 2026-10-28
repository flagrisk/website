"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ArrowRightIcon } from "./Icons";

const SLIDES = [
  {
    title: "Safety that reaches you before it is too late.",
    sub: "Build a circle of people you trust, and reach them in one tap when it matters most.",
    cta: { label: "Create your account", href: "/signup" },
  },
  {
    title: "Help from people who actually know you.",
    sub: "Not a stranger on a hotline. The people you chose, told the moment you need them.",
    cta: { label: "Create your account", href: "/signup" },
  },
  {
    title: "Know the risks around you before you go.",
    sub: "See verified safety concerns nearby, and move through your day with confidence.",
    cta: { label: "See the plans", href: "/plans" },
  },
];

export function Hero() {
  const [i, setI] = useState(0);
  const go = useCallback((n: number) => setI((n + SLIDES.length) % SLIDES.length), []);

  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % SLIDES.length), 5000);
    return () => clearInterval(t);
  }, []);

  const s = SLIDES[i];

  return (
    <section className="relative flex min-h-[86vh] items-end overflow-hidden">
      {/* background (stands in for a hero photo; swap for real imagery later) */}
      <div className="absolute inset-0 bg-night" />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 70% at 78% 18%, rgba(47,158,143,0.35), transparent 60%), radial-gradient(55% 60% at 12% 95%, rgba(221,238,91,0.14), transparent 60%), linear-gradient(130deg, #14152a 0%, #1b1e3d 45%, #2e2f5c 100%)",
        }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.05)_1px,transparent_0)] [background-size:28px_28px]" />

      <div className="relative mx-auto w-full max-w-7xl px-6 pb-20 pt-28 md:px-10">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-medium text-parchment/80">
            <span className="h-1.5 w-1.5 rounded-full bg-lime" />
            Community safety, built for Africa
          </span>

          <h1 key={i} className="display-xl mt-7 text-white" style={{ animation: "fadeUp 0.6s ease" }}>
            {s.title}
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-parchment/80">{s.sub}</p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link href={s.cta.href} className="btn btn-lime btn-lg">
              {s.cta.label} <ArrowRightIcon size={18} />
            </Link>
            <Link href="/#how" className="btn btn-ghost btn-lg">
              How it works
            </Link>
          </div>

          {/* slide dots */}
          <div className="mt-12 flex gap-2">
            {SLIDES.map((_, n) => (
              <button
                key={n}
                aria-label={`Slide ${n + 1}`}
                onClick={() => go(n)}
                className={`h-1.5 rounded-full transition-all ${
                  n === i ? "w-9 bg-lime" : "w-3.5 bg-white/30"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* edge arrows */}
      <button
        aria-label="Previous slide"
        onClick={() => go(i - 1)}
        className="absolute left-4 top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 text-parchment backdrop-blur transition-colors hover:border-white hover:bg-white/10 md:flex"
      >
        &#8592;
      </button>
      <button
        aria-label="Next slide"
        onClick={() => go(i + 1)}
        className="absolute right-4 top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 text-parchment backdrop-blur transition-colors hover:border-white hover:bg-white/10 md:flex"
      >
        &#8594;
      </button>

      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}`}</style>
    </section>
  );
}
