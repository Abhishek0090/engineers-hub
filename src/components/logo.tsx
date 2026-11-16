import Link from "next/link";

import { SITE_NAME } from "@/lib/catalog";

/** StudyHub mark: an open book with a spark, on the brand gradient. */
export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <svg className="logo-mark" width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <defs>
        <linearGradient id="sh-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#6366f1" />
          <stop offset="0.55" stopColor="#8b5cf6" />
          <stop offset="1" stopColor="#ec4899" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="38" height="38" rx="11" fill="url(#sh-g)" />
      <rect x="1" y="33" width="38" height="6" rx="3" fill="#000" opacity="0.16" />
      <path
        d="M20 15.5c-2.6-1.9-6-2.5-9.5-2v13c3.5-.5 6.9.1 9.5 2 2.6-1.9 6-2.5 9.5-2v-13c-3.5-.5-6.9.1-9.5 2zM20 15.5v13"
        fill="none"
        stroke="#fff"
        strokeWidth="2.6"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <path d="M28.5 6.5l.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9z" fill="#fde047" />
    </svg>
  );
}

/** Logo with the site name; `sub` is a small line under it (the current program in the app). */
export function Logo({ href = "/", sub }: { href?: string; sub?: string }) {
  return (
    <Link href={href} className="logo" aria-label={`${SITE_NAME} home`}>
      <LogoMark />
      <span className="logo-text">
        {SITE_NAME}
        {sub ? <small>{sub}</small> : null}
      </span>
    </Link>
  );
}
