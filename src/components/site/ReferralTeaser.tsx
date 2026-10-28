import Link from "next/link";
import { ArrowRightIcon } from "./Icons";

const REWARDS = [
  { step: "01", amount: "NGN 100", when: "when they sign up" },
  { step: "02", amount: "NGN 100", when: "when they build their safety circle" },
  { step: "03", amount: "NGN 200", when: "when they take a paid plan" },
];

export function ReferralTeaser() {
  return (
    <section id="refer" className="bg-white text-ink">
      <div className="mx-auto grid max-w-7xl items-center gap-14 px-6 py-24 md:grid-cols-2 md:px-10 md:py-28">
        <div>
          <p className="eyebrow mb-5">Refer and earn</p>
          <h2 className="display">Bring people in, and earn as they grow.</h2>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-slate">
            Every account gets a referral link. You earn at three points as each person you bring in
            goes deeper, not only when they sign up. Track it all from your account, and get paid
            straight to your bank.
          </p>
          <div className="mt-9">
            <Link href="/signup" className="btn btn-primary btn-lg">
              Start referring <ArrowRightIcon size={18} />
            </Link>
          </div>
        </div>

        <div className="card-flat p-9">
          <ul className="space-y-2">
            {REWARDS.map((r) => (
              <li key={r.step} className="flex items-center gap-4 border-b border-line py-4 last:border-0">
                <span className="icon-chip bg-night text-sm font-bold text-lime">{r.step}</span>
                <span className="flex-1 text-slate">{r.when}</span>
                <span className="text-xl font-bold text-ink">{r.amount}</span>
              </li>
            ))}
          </ul>
          <div className="mt-5 text-sm text-slate">
            Up to <span className="font-semibold text-ink">NGN 400</span> for every person you bring
            all the way through.
          </div>
        </div>
      </div>
    </section>
  );
}
