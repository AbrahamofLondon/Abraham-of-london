// app/layout.tsx — HARDENED (Server Shell, Deterministic)
import type { Metadata, Viewport } from "next";
import "./globals.css";

// ✅ BRAND SYSTEM & REGISTRY STYLES
import "@/styles/brand-system.css";

// ✅ TYPOGRAPHY
import { fontVariables, fontBodyClass } from "@/lib/next-fonts";

// ✅ CLIENT SHELL (single boundary for providers + UI)
import ClientShell from "./client-shell";

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: {
    template: "%s | Abraham of London",
    default: "Abraham of London // Strategic Intelligence & Registry",
  },
  description:
    "High-clearance strategic consulting, leadership frameworks, and executive intelligence dispatches.",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en-GB"
      className={`${fontVariables} scroll-smooth`}
      suppressHydrationWarning
    >
      <body
        className={`${fontBodyClass} min-h-screen bg-black text-white antialiased selection:bg-amber-500/30 selection:text-black`}
      >
        <ClientShell>{children}</ClientShell>
      </body>
    </html>
  );
}