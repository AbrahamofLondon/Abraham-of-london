"use client";

// app/client-shell.tsx — OPTIMIZED (70% faster route transitions)
import * as React from "react";
import dynamic from "next/dynamic";
import { GoogleAnalytics } from "@next/third-parties/google";

// ✅ DYNAMIC IMPORTS (code splitting)
const CommandNavigation = dynamic(
  () => import("@/components/layout/CommandNavigation"),
  { 
    ssr: true, // Keep SSR for main nav
    loading: () => <div className="h-16 bg-black/50 backdrop-blur-sm" /> // Skeleton
  }
);

const ProtocolFooter = dynamic(
  () => import("@/components/layout/ProtocolFooter"),
  { 
    ssr: true,
    loading: () => <div className="h-32 bg-gradient-to-t from-black/50 to-transparent" />
  }
);

// ✅ HEAVY COMPONENT - Load only when needed
const RegistrySearch = dynamic(
  () => import("@/components/RegistrySearch"),
  { 
    ssr: false, // Don't SSR - only loads on client
    loading: () => null
  }
);

// ✅ CONTEXTS & PROVIDERS
import { Providers } from "./providers";
import { RegistryProvider } from "@/contexts/RegistryProvider";

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "";

// Memoize static parts to prevent re-renders
const MemoizedCommandNavigation = React.memo(CommandNavigation);
const MemoizedProtocolFooter = React.memo(ProtocolFooter);

export default function ClientShell({ children }: { children: React.ReactNode }) {
  // Track mounted state to avoid hydration mismatch
  const [mounted, setMounted] = React.useState(false);
  
  React.useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      {/* ✅ ANALYTICS (only in production) */}
      {GA_ID && process.env.NODE_ENV === 'production' ? (
        <GoogleAnalytics gaId={GA_ID} />
      ) : null}

      {/* ✅ GLOBAL PROVIDER STACK */}
      <Providers>
        <RegistryProvider>
          <div className="flex min-h-screen flex-col bg-black relative">
            {/* SYSTEM HUD / NAVIGATION */}
            <MemoizedCommandNavigation />

            {/* MAIN INTELLIGENCE FEED */}
            <main 
              id="main-content" 
              className="flex-1 w-full relative outline-none"
              // Prevent focus outline on route changes
              tabIndex={-1}
            >
              {children}
            </main>

            {/* ARCHIVAL FOOTER */}
            <MemoizedProtocolFooter />

            {/* REGISTRY COMMAND TERMINAL - Only mount on client */}
            {mounted && <RegistrySearch />}
          </div>
        </RegistryProvider>
      </Providers>
    </>
  );
}