/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import { WifiOff, ShieldAlert, ChevronLeft, RefreshCw } from "lucide-react";

/**
 * Abraham of London: Offline Recovery Page
 * Rendered by the Service Worker when a non-cached route is requested without signal.
 */
export default function OfflinePage() {
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleRetry = () => {
    setIsRefreshing(true);
    window.location.reload();
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#030712] px-6 text-center selection:bg-amber-500/30">
      <Head>
        <title>Connection Interrupted | Abraham of London</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      {/* Institutional Background Element */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-xl">
        {/* Iconography */}
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <WifiOff className="h-16 w-16 text-amber-500/20" />
            <ShieldAlert className="absolute -bottom-2 -right-2 h-8 w-8 text-amber-500 animate-pulse" />
          </div>
        </div>

        {/* Messaging */}
        <h1 className="font-serif text-3xl md:text-4xl italic text-white mb-6 tracking-tight">
          Beyond the Digital Perimeter
        </h1>
        
        <p className="font-sans text-lg text-white/60 leading-relaxed mb-10 font-light">
          This specific intelligence brief has not yet been synchronized for offline access. 
          Please restore your connection to the grid to retrieve these strategic assets.
        </p>

        {/* Action Suite */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={handleRetry}
            disabled={isRefreshing}
            className="group relative flex items-center gap-3 rounded-full bg-amber-500 px-8 py-4 text-xs font-bold uppercase tracking-[0.2em] text-black transition-all hover:bg-amber-400 disabled:opacity-50"
          >
            <RefreshCw className={cx("h-4 w-4", isRefreshing && "animate-spin")} />
            {isRefreshing ? "Recalibrating..." : "Retry Connection"}
          </button>

          <Link
            href="/"
            className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-8 py-4 text-xs font-bold uppercase tracking-[0.2em] text-white transition-all hover:bg-white/10"
          >
            <ChevronLeft className="h-4 w-4" />
            Return to Core
          </Link>
        </div>

        {/* Footer Note */}
        <div className="mt-16 pt-8 border-t border-white/5">
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-white/30">
            Abraham of London — Institutional Resilience Protocol 4.0
          </p>
        </div>
      </div>
    </div>
  );
}

// Utility for class merging
function cx(...parts: any[]) {
  return parts.filter(Boolean).join(" ");
}