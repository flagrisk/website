import { HeartIcon, UsersIcon, MapPinIcon } from "./Icons";

const SHIFTS = [
  {
    icon: HeartIcon,
    from: "Hoping someone notices something is wrong.",
    to: "Knowing the people who love you are already with you.",
  },
  {
    icon: UsersIcon,
    from: "Facing a frightening moment on your own.",
    to: "Reaching your circle in one tap, wherever they are.",
  },
  {
    icon: MapPinIcon,
    from: "Walking into trouble you had no way to see.",
    to: "Knowing the safety concerns around you before you go.",
  },
];

export function Transformation() {
  return (
    <section className="bg-white text-ink">
      <div className="mx-auto max-w-6xl px-5 py-24 md:py-28">
        <div className="max-w-3xl">
          <p className="eyebrow mb-5 text-teal">The change you feel</p>
          <h2 className="display">
            FlagRisk changes how safe you feel long before anything goes wrong.
          </h2>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate">
            It is not about more alerts or more features. It is about moving through your life knowing
            that if something happens, the right people already know where you are and are ready to
            act.
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {SHIFTS.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div key={idx} className="card-flat flex flex-col p-9">
                <span className="icon-chip bg-night text-lime">
                  <Icon size={26} />
                </span>
                <p className="mt-7 text-xs font-semibold uppercase tracking-wider text-slate/60">
                  From
                </p>
                <p className="mt-1.5 text-slate">{s.from}</p>
                <div className="my-5 h-px w-full bg-ink/10" />
                <p className="text-xs font-semibold uppercase tracking-wider text-teal">To</p>
                <p className="mt-1.5 text-lg font-semibold leading-snug text-ink">{s.to}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
