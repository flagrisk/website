// Wraps a real app screenshot in a phone frame.
export function PhoneFrame({
  src,
  alt,
  className = "",
  width = 260,
}: {
  src: string;
  alt: string;
  className?: string;
  width?: number;
}) {
  return (
    <div className={`phone ${className}`} style={{ width }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} loading="lazy" />
    </div>
  );
}
