import Link from "next/link";

export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <svg className="logo-mark" width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <defs>
        <linearGradient id="seh-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2563eb" />
          <stop offset="0.5" stopColor="#7c3aed" />
          <stop offset="1" stopColor="#e11d48" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="38" height="38" rx="11" fill="url(#seh-g)" />
      <rect x="1" y="33" width="38" height="6" rx="3" fill="#000" opacity="0.18" />
      <path d="M15 13 9 20l6 7" fill="none" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m25 13 6 7-6 7" fill="none" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="20" cy="20" r="3.2" fill="#fff" />
    </svg>
  );
}

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="logo" aria-label="Software Engineers Hub home">
      <LogoMark />
      <span className="logo-text">
        Engineers Hub
        <small>Software</small>
      </span>
    </Link>
  );
}
