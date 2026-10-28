import { ArrowRightIcon } from "./Icons";

const STEPS = [
  {
    img: "/app/alarms.webp",
    title: "Raise an alarm",
    body: "When something is wrong, one tap reaches your circle with your live location. No call to make, no stranger to convince.",
  },
  {
    img: "/app/tripwatch.webp",
    title: "Share a trip",
    body: "Share a journey and FlagRisk checks you in along the way. If you go quiet before you arrive, your circle is told where you were last seen.",
  },
  {
    img: "/app/map.webp",
    title: "Know your area",
    body: "See verified safety concerns reported near you, so you can make a different choice before you set out.",
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="bg-white text-ink">
      <div className="mx-auto max-w-6xl px-5 py-24 md:py-28">
        <div className="max-w-2xl">
          <p className="eyebrow mb-5 text-teal">How it works</p>
          <h2 className="display">Three ways your circle keeps you safe.</h2>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.title} className="card-flat group flex flex-col p-8">
              <div className="relative h-52 overflow-hidden rounded-2xl bg-white shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={s.img}
                  alt={s.title}
                  loading="lazy"
                  className="absolute left-1/2 top-5 w-[64%] -translate-x-1/2 rounded-xl shadow-md"
                />
              </div>
              <h3 className="mt-7 text-2xl text-ink">{s.title}</h3>
              <p className="mt-3 flex-1 leading-relaxed text-slate">{s.body}</p>
              <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-teal">
                Learn more <ArrowRightIcon size={15} />
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
