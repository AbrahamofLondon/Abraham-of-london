"use client";

// app/client-shell.tsx — CLIENT RUNTIME SHELL (Single Boundary)
import * as React from "react";
import { GoogleAnalytics } from "@next/third-parties/google";

// ✅ INSTITUTIONAL COMPONENTS (likely client)
import CommandNavigation from "@/components/layout/CommandNavigation";
import ProtocolFooter from "@/components/layout/ProtocolFooter";
import RegistrySearch from "@/components/RegistrySearch";

// ✅ CONTEXTS & PROVIDERS
import { Providers } from "./providers";
import { RegistryProvider } from "@/contexts/RegistryProvider";

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "";

export default function ClientShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* ✅ ANALYTICS (clean + battle-tested integration) */}
      {GA_ID ? <GoogleAnalytics gaId={GA_ID} /> : null}

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
    </>
  );
}