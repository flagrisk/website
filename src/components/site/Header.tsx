"use client";

import { useState } from "react";
import Link from "next/link";
import { Logo } from "./Logo";

const NAV = [
  { label: "Home", href: "/" },
  { label: "How it works", href: "/#how" },
  { label: "Plans", href: "/plans" },
  { label: "Refer and earn", href: "/#refer" },
  { label: "Resources", href: "/#resources" },
];

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* thin top bar */}
      <div className="hidden bg-ink text-parchment/80 md:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-10 py-2 text-xs">
          <span>Community safety for everyone in Nigeria</span>
          <span className="flex gap-4">
            <a href="mailto:hello@flagrisk.org" className="hover:text-parchment">
              hello@flagrisk.org
            </a>
            <span className="text-parchment/40">|</span>
            <a href="/#refer" className="hover:text-parchment">
              Refer and earn
            </a>
          </span>
        </div>
      </div>

      <header className="sticky top-0 z-50 border-b border-line bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 md:px-10">
          <Link href="/" aria-label="FlagRisk home">
            <Logo tone="dark" />
          </Link>

          <nav className="hidden items-center gap-9 lg:flex">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-[0.95rem] font-medium text-ink/75 transition-colors hover:text-ink"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <Link href="/login" className="text-[0.95rem] font-medium text-ink/75 hover:text-ink">
              Sign in
            </Link>
            <Link href="/signup" className="btn btn-primary text-sm">
              Create account
            </Link>
          </div>

          <button
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-line text-ink lg:hidden"
            aria-label="Toggle menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <span className="text-lg">{open ? "✕" : "☰"}</span>
          </button>
        </div>

        {open && (
          <div className="border-t border-line bg-white px-6 py-4 lg:hidden">
            <nav className="flex flex-col gap-4">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="font-medium text-ink/80"
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <div className="mt-2 flex flex-col gap-3">
                <Link href="/login" className="btn btn-outline" onClick={() => setOpen(false)}>
                  Sign in
                </Link>
                <Link href="/signup" className="btn btn-primary" onClick={() => setOpen(false)}>
                  Create account
                </Link>
              </div>
            </nav>
          </div>
        )}
      </header>
    </>
  );
}
