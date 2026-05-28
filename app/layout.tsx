// app/layout.tsx — FINAL POLISH
import * as React from "react";
import type { Metadata } from "next";
import "@/app/globals.css";
import AppShell from "@/components/AppShell";

const RAW_URL = (process.env.NEXT_PUBLIC_SITE_URL || "")
  .replace(/^["']|["']$/g, "")  // Strip accidental quotes from Vercel env values
  .trim();
const BASE_URL = (RAW_URL || "https://www.abrahamoflondon.org").replace(/\/+$/, "");

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Abraham of London",
    template: "%s | Abraham of London",
  },
  description:
    "Institutional strategy, governance discipline, and operator doctrine for serious builders.",
  openGraph: {
    title: "Abraham of London",
    description:
      "Institutional strategy, governance discipline, and operator doctrine for serious builders.",
    images: ["/assets/images/social/og-image.jpg"],
    url: BASE_URL,
    siteName: "Abraham of London",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="bg-[#060609]">
      <body className="min-h-screen bg-[#060609] text-white selection:bg-amber-500/30">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}