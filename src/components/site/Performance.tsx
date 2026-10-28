const FACTS = [
  { value: "7", label: "in your circle", sub: "The trusted few, told when you need them." },
  { value: "500", unit: "km", label: "alert reach", sub: "How far a Premium alarm travels to your circle." },
  { value: "180", unit: "days", label: "of history", sub: "How long your records are kept on Premium." },
  { value: "3", label: "ways to stay safe", sub: "Raise an alarm, share a trip, know your area." },
];

export function Performance() {
  return (
    <section className="bg-mist text-ink">
      <div className="mx-auto max-w-7xl px-6 py-24 md:px-10 md:py-28">
        <div className="max-w-2xl">
          <p className="eyebrow mb-5">By the numbers</p>
          <h2 className="display">What your circle is built on.</h2>
        </div>
        <div className="mt-14 grid gap-10 border-t border-line pt-12 sm:grid-cols-2 md:grid-cols-4">
          {FACTS.map((f) => (
            <div key={f.label}>
              <div className="flex items-baseline gap-1.5">
                <span className="text-5xl font-semibold text-ink">{f.value}</span>
                {f.unit && <span className="text-xl font-semibold text-teal">{f.unit}</span>}
              </div>
              <div className="mt-3 font-semibold text-ink">{f.label}</div>
              <p className="mt-1.5 text-sm leading-relaxed text-slate">{f.sub}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
