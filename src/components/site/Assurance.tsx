import { ShieldIcon, UsersIcon, CheckIcon } from "./Icons";

const POINTS = [
  {
    icon: ShieldIcon,
    title: "Encrypted on the way",
    body: "Everything you share travels encrypted, from your location to the photos on a report.",
  },
  {
    icon: UsersIcon,
    title: "You choose who sees you",
    body: "Your location is shared only with the circle you picked, and only when you raise an alarm, share a trip, or check in.",
  },
  {
    icon: CheckIcon,
    title: "Yours to delete, anytime",
    body: "Close your account whenever you want and your data goes with it. No forms, no waiting.",
  },
];

export function Assurance() {
  return (
    <section className="bg-mist text-ink">
      <div className="mx-auto max-w-6xl px-5 py-24 md:py-28">
        <div className="max-w-2xl">
          <p className="eyebrow mb-5 text-teal">Built to be trusted</p>
          <h2 className="display">Safety you can hand your family without worry.</h2>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {POINTS.map((p) => {
            const Icon = p.icon;
            return (
              <div key={p.title} className="flex gap-4">
                <span className="icon-chip bg-night text-lime">
                  <Icon size={24} />
                </span>
                <div>
                  <h3 className="text-lg text-ink">{p.title}</h3>
                  <p className="mt-2 leading-relaxed text-ink/65">{p.body}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
