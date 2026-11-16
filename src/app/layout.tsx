import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";

import { ServiceWorkerRegister } from "@/components/pwa";
import { THEME_SCRIPT } from "@/components/theme-toggle";
import { AUTHOR, SITE_DESCRIPTION, SITE_NAME } from "@/lib/catalog";

import "./globals.css";

// Self-hosted at build time by next/font: no requests to Google from the browser.
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jbmono", display: "swap" });

export const metadata: Metadata = {
  title: { default: SITE_NAME, template: `%s | ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: AUTHOR }],
  creator: AUTHOR,
  // Installed app (PWA): the manifest is src/app/manifest.ts, the service worker public/sw.js.
  appleWebApp: { capable: true, title: SITE_NAME, statusBarStyle: "black-translucent" },
  icons: {
    icon: [{ url: "/pwa-icon/192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/pwa-icon/apple-180.png", sizes: "180x180", type: "image/png" }],
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0b0d17" },
    { media: "(prefers-color-scheme: light)", color: "#f6f6fb" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
