// app/layout.tsx — HARDENED (Core Institutional Shell)
import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";

// ✅ BRAND SYSTEM & REGISTRY STYLES
import "@/styles/brand-system.css"; 

// ✅ INSTITUTIONAL COMPONENTS
import CommandNavigation from "@/components/layout/CommandNavigation";
import ProtocolFooter from "@/components/layout/ProtocolFooter";
import RegistrySearch from "@/components/RegistrySearch";

// ✅ CONTEXTS & PROVIDERS
import { Providers } from "./providers";
import { RegistryProvider } from "@/contexts/RegistryProvider"; // Pluralized as requested

// ✅ LOGIC & TYPOGRAPHY
import { fontVariables, fontBodyClass } from "@/lib/next-fonts";

/* -----------------------------------------------------------------------------
  METADATA & VIEWPORT CONFIGURATION
----------------------------------------------------------------------------- */
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
  description: "High-clearance strategic consulting, leadership frameworks, and executive intelligence dispatches.",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "";

/* -----------------------------------------------------------------------------
  ROOT LAYOUT IMPLEMENTATION
----------------------------------------------------------------------------- */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html 
      lang="en" 
      className={`${fontVariables} scroll-smooth`} 
      suppressHydrationWarning
    >
      <body className={`${fontBodyClass} min-h-screen bg-black text-white antialiased selection:bg-amber-500/30 selection:text-black`}>
        
        {/* ✅ ANALYTICS PROTOCOL */}
        {GA_ID && (
          <>
            <Script 
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} 
              strategy="afterInteractive" 
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_ID}', { 
                  anonymize_ip: true,
                  cookie_flags: 'SameSite=None;Secure'
                });
              `}
            </Script>
          </>
        )}

        {/* ✅ GLOBAL PROVIDER STACK */}
        <Providers>
          <RegistryProvider>
            
            <div className="flex min-h-screen flex-col bg-black relative">
              
              {/* SYSTEM HUD / NAVIGATION */}
              <CommandNavigation />

              {/* MAIN INTELLIGENCE FEED */}
              <main id="main-content" className="flex-1 w-full relative outline-none">
                {children}
              </main>

              {/* ARCHIVAL FOOTER */}
              <ProtocolFooter />

              {/* REGISTRY COMMAND TERMINAL (Triggered via Cmd+K) */}
              <RegistrySearch />
              
            </div>

          </RegistryProvider>
        </Providers>
      </body>
    </html>
  );
}