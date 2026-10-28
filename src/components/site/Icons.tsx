// Inline stroke icons, lucide-style, so there is no icon-font dependency.
type P = { className?: string; size?: number };
const base = (size = 24) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.9,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
});

export const ShieldIcon = ({ className, size }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />
    <path d="M9 12l2 2 4-4" />
  </svg>
);

export const BellIcon = ({ className, size }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M6 9a6 6 0 1112 0c0 5 2 6 2 6H4s2-1 2-6z" />
    <path d="M10.5 20a1.8 1.8 0 003 0" />
  </svg>
);

export const RouteIcon = ({ className, size }: P) => (
  <svg {...base(size)} className={className}>
    <circle cx="6" cy="19" r="2.2" />
    <circle cx="18" cy="5" r="2.2" />
    <path d="M8 19h6a4 4 0 004-4V9" />
    <path d="M6 16.8V9a3 3 0 013-3h3" />
  </svg>
);

export const MapPinIcon = ({ className, size }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M12 21s-7-5.2-7-11a7 7 0 1114 0c0 5.8-7 11-7 11z" />
    <circle cx="12" cy="10" r="2.5" />
  </svg>
);

export const UsersIcon = ({ className, size }: P) => (
  <svg {...base(size)} className={className}>
    <circle cx="9" cy="8" r="3.2" />
    <path d="M3.5 20a5.5 5.5 0 0111 0" />
    <path d="M16 5.2a3.2 3.2 0 010 5.6" />
    <path d="M17 14.5a5.5 5.5 0 013.5 5.5" />
  </svg>
);

export const HeartIcon = ({ className, size }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M12 20s-7-4.4-7-9.5A4.5 4.5 0 0112 7a4.5 4.5 0 017 3.5C19 15.6 12 20 12 20z" />
  </svg>
);

export const ArrowRightIcon = ({ className, size }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M5 12h14" />
    <path d="M13 6l6 6-6 6" />
  </svg>
);

export const CheckIcon = ({ className, size }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M5 12l4.5 4.5L19 7" />
  </svg>
);

export const StarIcon = ({ className, size }: P) => (
  <svg {...base(size)} className={className} fill="currentColor" stroke="none">
    <path d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9 6.8 19.1l1-5.8L3.5 9.2l5.9-.9L12 3z" />
  </svg>
);
