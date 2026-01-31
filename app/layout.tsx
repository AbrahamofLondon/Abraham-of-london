import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import "@/styles/brand-system.css"; 

// Update these imports to the new Institutional Components
import CommandNavigation from "@/components/layout/CommandNavigation";
import ProtocolFooter from "@/components/layout/ProtocolFooter";
import { Providers } from "./providers";
import { fontVariables, fontBodyClass } from "@/lib/next-fonts";

export const metadata: Metadata = {
  title: "Abraham of London - Strategic Consulting & Leadership Development",
  description: "Premium strategic consulting, leadership development frameworks, and executive coaching from Abraham of London.",
};

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={fontVariables} suppressHydrationWarning>
      <body className={`${fontBodyClass} min-h-screen bg-black`}>
        {GA_ID ? (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
            <Script id="google-analytics" strategy="afterInteractive">
              {`window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', '${GA_ID}', { anonymize_ip: true });`}
            </Script>
          </>
        ) : null}

        <Providers>
          <div className="flex min-h-screen flex-col bg-black text-foreground">
            <CommandNavigation />
            <main className="flex-1">{children}</main>
            <ProtocolFooter />
          </div>
        </Providers>
      </body>
    </html>
  );
}