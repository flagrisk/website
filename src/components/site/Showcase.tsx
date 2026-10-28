import Link from "next/link";
import { PhoneFrame } from "./PhoneFrame";
import { CheckIcon, ArrowRightIcon } from "./Icons";

const POINTS = [
  "Add up to seven people you trust to your circle",
  "See who is reachable before anything goes wrong",
  "Everyone is alerted the moment you raise an alarm",
];

export function Showcase() {
  return (
    <section className="bg-white text-ink">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-20 md:grid-cols-2 md:py-28">
        <div className="order-2 flex justify-center md:order-1">
          <PhoneFrame src="/app/network.webp" alt="FlagRisk safety circle" width={258} />
        </div>
        <div className="order-1 md:order-2">
          <p className="eyebrow mb-4 text-teal">Your safety circle</p>
          <h2 className="display text-ink">The people who matter, all in one place.</h2>
          <p className="mt-5 max-w-lg text-lg leading-relaxed text-ink/65">
            Your circle is the heart of FlagRisk. Build it once, and everyone in it can reach you,
            and be reached by you, the moment it counts.
          </p>
          <ul className="mt-7 space-y-3">
            {POINTS.map((p) => (
              <li key={p} className="flex items-start gap-3 text-ink/80">
                <CheckIcon size={20} className="mt-0.5 text-teal" />
                <span>{p}</span>
              </li>
            ))}
          </ul>
          <div className="mt-8">
            <Link href="/signup" className="btn btn-primary">
              Build your circle <ArrowRightIcon size={18} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
