// PNG app icons for the web app manifest and iOS, rendered from the brand SVG at build time.
//   /pwa-icon/192.png  /pwa-icon/512.png            regular (rounded square)
//   /pwa-icon/maskable-512.png                       full-bleed, for Android adaptive icons
//   /pwa-icon/apple-180.png                          iOS home screen (iOS adds its own rounding)
import { ImageResponse } from "next/og";

import { brandIconDataUri } from "@/lib/brand-icon";

const FILES: Record<string, { size: number; maskable: boolean }> = {
  "192.png": { size: 192, maskable: false },
  "512.png": { size: 512, maskable: false },
  "maskable-512.png": { size: 512, maskable: true },
  "apple-180.png": { size: 180, maskable: true },
};

export const dynamic = "force-static";

export function generateStaticParams() {
  return Object.keys(FILES).map((file) => ({ file }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ file: string }> }) {
  const spec = FILES[(await params).file];
  if (!spec) return new Response("Not found", { status: 404 });
  const { size, maskable } = spec;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex" }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- rendered by ImageResponse, not the browser */}
        <img src={brandIconDataUri({ maskable })} width={size} height={size} alt="" />
      </div>
    ),
    { width: size, height: size },
  );
}
