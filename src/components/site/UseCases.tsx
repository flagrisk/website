import { UsersIcon, RouteIcon, HeartIcon } from "./Icons";

const CASES = [
  {
    icon: UsersIcon,
    tag: "For students",
    title: "Away from home, never out of reach.",
    body: "Students far from family keep a circle of friends and relatives who are told the instant something feels wrong on or off campus.",
  },
  {
    icon: RouteIcon,
    tag: "For late journeys",
    title: "Every trip, watched to the door.",
    body: "Share a ride or a walk home and your circle is checked in along the way, and told at once if you stop checking in before you arrive.",
  },
  {
    icon: HeartIcon,
    tag: "For families",
    title: "Everyone you love, one circle.",
    body: "Parents, partners and children in one trusted circle, each able to raise an alarm and reach the others the moment it counts.",
  },
];

export function UseCases() {
  return (
    <section className="bg-white text-ink">
      <div className="mx-auto max-w-7xl px-6 py-24 md:px-10 md:py-28">
        <div className="max-w-3xl">
          <p className="eyebrow mb-5">Who it is for</p>
          <h2 className="display">Built for the people who worry about getting home safe.</h2>
        </div>

        <div className="mt-14 grid gap-7 md:grid-cols-3">
          {CASES.map((c) => {
            const Icon = c.icon;
            return (
              <div key={c.tag} className="card-flat flex flex-col overflow-hidden">
                <div className="relative flex h-44 items-center justify-center bg-night">
                  <div
                    className="pointer-events-none absolute inset-0"
                    style={{
                      background:
                        "radial-gradient(60% 80% at 70% 10%, rgba(47,158,143,0.4), transparent 60%)",
                    }}
                  />
                  <span className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-lime text-ink">
                    <Icon size={30} />
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-8">
                  <span className="text-xs font-semibold uppercase tracking-wider text-teal">
                    {c.tag}
                  </span>
                  <h3 className="mt-3 text-xl font-semibold text-ink">{c.title}</h3>
                  <p className="mt-3 flex-1 leading-relaxed text-slate">{c.body}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
