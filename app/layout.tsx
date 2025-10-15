// app/layout.tsx
import "../styles/globals.css";
import type { Metadata } from "next";
import { sans, serif, cursive } from "@/lib/fonts";

export const metadata: Metadata = {
  title: {
    default: "Abraham of London",
    template: "%s | Abraham of London",
  },
  description: "Official site for Abraham of London.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en-GB"
      className={`scroll-smooth ${sans.variable} ${serif.variable} ${cursive.variable}`}
      data-theme="light"
      data-user-theme="system"
      suppressHydrationWarning
    >
      <body>{children}</body>
    </html>
  );
}
