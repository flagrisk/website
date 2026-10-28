import Link from "next/link";
import { PhoneFrame } from "./PhoneFrame";
import { UsersIcon, ShieldIcon, ArrowRightIcon } from "./Icons";

const STATS = [
  { icon: UsersIcon, value: "7", label: "trusted people in a single circle, told the moment you need them." },
  { icon: ShieldIcon, value: "1 tap", label: "from a frightening moment to your circle knowing where you are." },
];

export function WhoWeAre() {
  return (
    <section className="bg-mist text-ink">
      <div className="mx-auto grid max-w-7xl items-center gap-14 px-6 py-24 md:grid-cols-2 md:px-10 md:py-28">
        <div>
          <p className="eyebrow mb-5">Who we are</p>
          <h2 className="display">Turning the people you love into the help that reaches you first.</h2>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-slate">
            Most safety help comes from strangers who cannot see where you are and arrive too late.
            FlagRisk starts from your own circle, so help is personal, and it is close.
          </p>

          <div className="mt-10 grid gap-8 sm:grid-cols-2">
            {STATS.map((st) => {
              const Icon = st.icon;
              return (
                <div key={st.value}>
                  <span className="icon-chip bg-night text-lime">
                    <Icon size={24} />
                  </span>
                  <div className="mt-4 text-4xl font-semibold text-ink">{st.value}</div>
                  <p className="mt-2 text-sm leading-relaxed text-slate">{st.label}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-10">
            <Link href="/#how" className="btn btn-primary">
              See how it works <ArrowRightIcon size={18} />
            </Link>
          </div>
        </div>

        <div className="flex justify-center md:justify-end">
          <PhoneFrame src="/app/dashboard.webp" alt="FlagRisk dashboard" width={270} />
        </div>
      </div>
    </section>
  );
}
