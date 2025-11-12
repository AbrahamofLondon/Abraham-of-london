// app/layout.tsx
import "../styles/globals.css";
import type { Metadata } from "next";
import { ThemeProvider } from "@/lib/themeContext";

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
      className="scroll-smooth"
      data-theme="light"
      data-user-theme="system"
      suppressHydrationWarning
    >
      <body>
        <ThemeProvider defaultTheme="system" storageKey="theme">
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}