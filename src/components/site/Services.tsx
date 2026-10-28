import Link from "next/link";
import { ArrowRightIcon } from "./Icons";

const CARDS = [
  {
    img: "/app/alarms.webp",
    title: "Raise an alarm",
    body: "One tap reaches your circle with your live location, so the people who can act know at once. No call to make, no stranger to convince.",
  },
  {
    img: "/app/tripwatch.webp",
    title: "Share a trip",
    body: "Share a journey and FlagRisk checks you in along the way. If you go quiet before you arrive, your circle is told where you were last seen.",
  },
  {
    img: "/app/map.webp",
    title: "Know your area",
    body: "See verified safety concerns reported near you, so you can make a different choice before you set out rather than after.",
  },
];

export function Services() {
  return (
    <section id="how" className="bg-white text-ink">
      <div className="mx-auto max-w-7xl px-6 py-24 md:px-10 md:py-28">
        <div className="max-w-3xl">
          <p className="eyebrow mb-5">How it works</p>
          <h2 className="display">Safety that starts with the people who already care about you.</h2>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate">
            FlagRisk turns the people you trust into the help that reaches you first. Three simple
            things, working together, every day.
          </p>
        </div>

        <div className="mt-14 grid gap-7 md:grid-cols-3">
          {CARDS.map((c) => (
            <div key={c.title} className="card-flat flex flex-col p-9">
              <div className="relative h-56 overflow-hidden rounded-2xl bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={c.img}
                  alt={c.title}
                  loading="lazy"
                  className="absolute left-1/2 top-6 w-[62%] -translate-x-1/2 rounded-xl shadow-md"
                />
              </div>
              <h3 className="mt-7 text-[1.6rem] font-semibold text-ink">{c.title}</h3>
              <p className="mt-3 flex-1 leading-relaxed text-slate">{c.body}</p>
              <Link
                href="/signup"
                className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-night"
              >
                Get started <ArrowRightIcon size={15} />
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-12 flex justify-center">
          <Link href="/signup" className="btn btn-primary btn-lg">
            Start your circle today <ArrowRightIcon size={18} />
          </Link>
        </div>
      </div>
    </section>
  );
}
