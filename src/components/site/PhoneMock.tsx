import { ShieldIcon, BellIcon, UsersIcon } from "./Icons";

// A stylised FlagRisk app screen for the hero. Pure CSS/SVG, no external image,
// so it renders identically everywhere.
export function PhoneMock() {
  return (
    <div className="relative mx-auto w-[260px] sm:w-[290px]">
      <div className="absolute -inset-6 rounded-[44px] bg-teal/20 blur-2xl" aria-hidden />
      <div className="relative rounded-[40px] border border-white/15 bg-ink p-3 shadow-lift">
        <div className="overflow-hidden rounded-[30px] bg-night">
          {/* status bar */}
          <div className="flex items-center justify-between px-5 pt-4 text-[10px] text-parchment/50">
            <span>9:41</span>
            <span className="flex gap-1">
              <span className="h-2 w-3 rounded-sm bg-parchment/30" />
              <span className="h-2 w-2 rounded-sm bg-parchment/30" />
            </span>
          </div>

          {/* header */}
          <div className="px-5 pt-4">
            <p className="text-[11px] uppercase tracking-widest text-lime">You are protected</p>
            <p className="mt-1 text-lg font-bold text-parchment">Your circle is close</p>
          </div>

          {/* pulse */}
          <div className="flex items-center justify-center py-7">
            <div className="relative flex h-28 w-28 items-center justify-center">
              <span className="absolute h-28 w-28 rounded-full bg-teal/15" />
              <span className="absolute h-20 w-20 rounded-full bg-teal/25" />
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-lime text-ink">
                <ShieldIcon size={26} />
              </span>
            </div>
          </div>

          {/* circle row */}
          <div className="px-5">
            <div className="flex items-center justify-between rounded-2xl bg-dusk/60 px-4 py-3">
              <div className="flex items-center gap-2 text-parchment/80">
                <UsersIcon size={18} className="text-teal" />
                <span className="text-xs">5 in your circle</span>
              </div>
              <div className="flex -space-x-2">
                {["#46b3a6", "#ddee5b", "#f5a623", "#8a8fd0"].map((c) => (
                  <span key={c} className="h-6 w-6 rounded-full border-2 border-night" style={{ background: c }} />
                ))}
              </div>
            </div>
          </div>

          {/* alarm button */}
          <div className="px-5 pb-6 pt-4">
            <div className="flex items-center justify-center gap-2 rounded-xl border border-amber/40 bg-amber/15 py-3 text-sm font-semibold text-amber">
              <BellIcon size={18} />
              Hold to raise an alarm
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
