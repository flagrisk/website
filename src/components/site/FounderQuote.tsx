// Founder statement. Mono to confirm or replace the wording and the title.

export function FounderQuote() {
  return (
    <section className="bg-night">
      <div className="mx-auto max-w-4xl px-5 py-20 text-center md:py-28">
        <p className="eyebrow mb-6 text-lime">Why we built it</p>
        <blockquote className="text-2xl font-semibold leading-snug text-parchment md:text-3xl">
          &ldquo;Safety should not depend on whether a stranger picks up the phone. It should start
          with the people who already love you, and reach them before it is too late to help.&rdquo;
        </blockquote>
        <div className="mt-8">
          <div className="font-semibold text-parchment">Godwin Mayaki</div>
          <div className="text-sm text-parchment/55">Founder, FlagRisk</div>
        </div>
      </div>
    </section>
  );
}
