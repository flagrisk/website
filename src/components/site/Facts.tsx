const FACTS = [
  { value: "7", label: "people in a circle", sub: "The trusted few who are told when you need them." },
  { value: "500", label: "km max alert reach", sub: "How far a Premium alarm can travel to your circle." },
  { value: "3", label: "ways to stay safe", sub: "Raise an alarm, share a trip, know your area." },
  { value: "180", label: "days of history", sub: "How long your records are kept on Premium." },
];

export function Facts() {
  return (
    <section className="bg-night">
      <div className="mx-auto max-w-6xl px-5 py-20 md:py-24">
        <div className="max-w-2xl">
          <p className="eyebrow mb-5 text-lime">By the numbers</p>
          <h2 className="display text-parchment">What your circle is built on.</h2>
        </div>
        <div className="mt-14 grid gap-10 sm:grid-cols-2 md:grid-cols-4">
          {FACTS.map((f) => (
            <div key={f.label}>
              <div className="text-5xl font-semibold text-lime">{f.value}</div>
              <div className="mt-3 font-semibold text-parchment">{f.label}</div>
              <p className="mt-1.5 text-sm leading-relaxed text-parchment/55">{f.sub}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
