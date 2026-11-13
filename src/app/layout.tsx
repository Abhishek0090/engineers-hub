import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";

import { THEME_SCRIPT } from "@/components/theme-toggle";
import { AUTHOR, SITE_NAME } from "@/lib/catalog";

import "./globals.css";

// Self-hosted at build time by next/font: no requests to Google from the browser.
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jbmono", display: "swap" });

export const metadata: Metadata = {
  title: { default: SITE_NAME, template: `%s | ${SITE_NAME}` },
  description:
    "Chapter-wise full stack study and interview prep: Next.js, React, TypeScript, Node.js, MongoDB, PostgreSQL, Prisma, Drizzle, Docker, system design and DSA. Learn a little every day, Duolingo style.",
  applicationName: SITE_NAME,
  authors: [{ name: AUTHOR }],
  creator: AUTHOR,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
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
      <body>{children}</body>
    </html>
  );
}
