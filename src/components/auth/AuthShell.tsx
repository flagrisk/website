import Link from "next/link";

// Plain, centred shell for the login and signup screens. Styling is deliberately
// minimal for now; the brand design comes later.
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-mist flex flex-col items-center justify-center px-5 py-16">
      <div className="w-full max-w-[400px]">
        <Link
          href="/"
          className="flex items-center gap-2 mb-8 justify-center"
          aria-label="FlagRisk home"
        >
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-[8px] bg-night text-lime font-bold text-lg">
            F!
          </span>
          <span className="font-semibold text-night text-lg">FlagRisk</span>
        </Link>

        <div className="rounded-[14px] border border-line bg-white p-7 shadow-sm">
          <h1 className="text-xl font-semibold text-night">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-slate">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>

        {footer && (
          <div className="mt-5 text-center text-sm text-slate">{footer}</div>
        )}
      </div>
    </main>
  );
}

export function Field({
  label,
  name,
  type = "text",
  required,
  autoComplete,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  autoComplete?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-ink">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        placeholder={placeholder}
        className="mt-1.5 w-full rounded-[10px] border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition focus:border-night focus:ring-2 focus:ring-night/10"
      />
    </label>
  );
}
