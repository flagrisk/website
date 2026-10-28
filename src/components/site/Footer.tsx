import Link from "next/link";
import { Logo } from "./Logo";

const COLS = [
  {
    title: "Product",
    links: [
      { label: "How it works", href: "/#how" },
      { label: "Plans", href: "/plans" },
      { label: "Refer and earn", href: "/#refer" },
      { label: "Resources", href: "/#resources" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Create account", href: "/signup" },
      { label: "Sign in", href: "/login" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy policy", href: "/privacy.html" },
      { label: "Terms", href: "/terms.html" },
      { label: "Delete your account", href: "/userrequests.html" },
    ],
  },
];

const SOCIAL = [
  { label: "Facebook", href: "https://facebook.com/flagriskinc" },
  { label: "Instagram", href: "https://instagram.com/flagrisk" },
  { label: "X", href: "https://x.com/FlagRisk" },
  { label: "LinkedIn", href: "https://linkedin.com/company/flagrisk" },
  { label: "TikTok", href: "https://tiktok.com/@flagrisk" },
];

const YEAR = new Date().getFullYear();

export function Footer() {
  return (
    <footer className="border-t border-line bg-mist text-ink">
      <div className="mx-auto max-w-7xl px-6 py-16 md:px-10">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <Logo tone="dark" />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate">
              Community safety that starts with the people you trust. Raise an alarm, share a trip,
              and know your area.
            </p>
            <a
              href="mailto:hello@flagrisk.org"
              className="mt-4 inline-block text-sm font-medium text-night hover:underline"
            >
              hello@flagrisk.org
            </a>
          </div>

          {COLS.map((col) => (
            <div key={col.title}>
              <div className="text-sm font-semibold text-ink">{col.title}</div>
              <ul className="mt-4 space-y-3">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-sm text-slate transition-colors hover:text-ink">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-5 border-t border-line pt-7 md:flex-row md:items-center">
          <p className="text-sm text-slate">&copy; {YEAR} FlagRisk. All rights reserved.</p>
          <div className="flex flex-wrap gap-5">
            {SOCIAL.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-slate transition-colors hover:text-ink"
              >
                {s.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
