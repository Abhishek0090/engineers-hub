// The StudyHub app icon as SVG markup, shared by the PWA icon route and anything else that needs
// the mark outside React (the <LogoMark> component draws the same shapes for the UI).
//
// `maskable` fills the whole square and keeps the book inside the central 80% safe zone, so
// Android can crop it to a circle or squircle without cutting the artwork.
export function brandIconSvg({ maskable = false }: { maskable?: boolean } = {}): string {
  const bg = maskable
    ? `<rect width="40" height="40" fill="url(#g)"/>`
    : `<rect x="1" y="1" width="38" height="38" rx="11" fill="url(#g)"/>`;
  // Maskable: shrink the artwork to 70% around the centre.
  const art = maskable ? `transform="translate(6 6) scale(0.7)"` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
<stop offset="0" stop-color="#6366f1"/><stop offset="0.55" stop-color="#8b5cf6"/><stop offset="1" stop-color="#ec4899"/>
</linearGradient></defs>
${bg}
<g ${art}>
<path d="M20 15.5c-2.6-1.9-6-2.5-9.5-2v13c3.5-.5 6.9.1 9.5 2 2.6-1.9 6-2.5 9.5-2v-13c-3.5-.5-6.9.1-9.5 2zM20 15.5v13" fill="none" stroke="#fff" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"/>
<path d="M28.5 6.5l.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9z" fill="#fde047"/>
</g>
</svg>`;
}

export const brandIconDataUri = (opts?: { maskable?: boolean }) =>
  `data:image/svg+xml;base64,${Buffer.from(brandIconSvg(opts)).toString("base64")}`;
