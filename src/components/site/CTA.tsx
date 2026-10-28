import Link from "next/link";

export function CTA() {
  return (
    <section className="bg-lime text-ink">
      <div className="mx-auto max-w-6xl px-5 py-20 md:py-24">
        <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
          <div>
            <h2 className="display max-w-2xl">
              Build your circle today. Help is always closer than you think.
            </h2>
            <p className="mt-3 max-w-xl text-ink/70">
              Create a free account in minutes and invite the people you trust.
            </p>
          </div>
          <div className="flex shrink-0 gap-3">
            <Link href="/signup" className="btn btn-primary">
              Create your account
            </Link>
            <Link href="/login" className="btn btn-outline">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
