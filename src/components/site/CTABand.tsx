import Link from "next/link";
import { ArrowRightIcon } from "./Icons";

export function CTABand() {
  return (
    <section className="bg-white text-ink">
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        <div className="relative overflow-hidden rounded-3xl bg-night px-8 py-16 text-center md:px-16 md:py-20">
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(50% 80% at 85% 0%, rgba(47,158,143,0.3), transparent 60%), radial-gradient(45% 70% at 5% 100%, rgba(221,238,91,0.12), transparent 60%)",
            }}
          />
          <div className="relative mx-auto max-w-2xl">
            <h2 className="display text-white">Ready to feel safer, starting today?</h2>
            <p className="mx-auto mt-5 max-w-xl text-lg text-parchment/80">
              Create a free account in minutes, invite the people you trust, and never face a
              dangerous moment alone again.
            </p>
            <div className="mt-9 flex justify-center">
              <Link href="/signup" className="btn btn-lime btn-lg">
                Create your account <ArrowRightIcon size={18} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
