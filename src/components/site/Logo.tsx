// FlagRisk logo lockup: lime mark on a Night Indigo rounded tile.
// tone sets the wordmark colour: "dark" for light backgrounds, "light" for dark.

export function Logo({
  size = 34,
  withWordmark = true,
  tone = "dark",
}: {
  size?: number;
  withWordmark?: boolean;
  tone?: "dark" | "light";
}) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <svg width={size} height={size} viewBox="0 0 100 100" role="img" aria-label="FlagRisk">
        <rect width="100" height="100" rx={22} fill="#1b1e3d" />
        <g fill="#ddee5b">
          <rect x="34" y="23" width="9" height="54" rx="2" />
          <path d="M43 25 H70 L61 37 L70 49 H43 Z" />
        </g>
      </svg>
      {withWordmark && (
        <span
          className={`text-[1.15rem] font-bold tracking-tight ${
            tone === "light" ? "text-parchment" : "text-ink"
          }`}
          style={{ letterSpacing: "-0.02em" }}
        >
          FlagRisk
        </span>
      )}
    </span>
  );
}
