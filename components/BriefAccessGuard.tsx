/* components/BriefAccessGuard.tsx — BULLETPROOF (PUBLIC NEVER BLOCKS) */
"use client";

import * as React from "react";
import tiers, { type AccessTier } from "@/lib/access/tiers";
import { useFortifiedAccess } from "@/hooks/useFortifiedAccess";

interface GuardProps {
  children: React.ReactNode;

  /**
   * Must be doc-derived required tier.
   * Accepts string for resilience, but normalized to AccessTier immediately.
   */
  requiredTier: AccessTier | string;

  /**
   * Server verdict (best signal). If true, do NOT re-block client-side.
   * If omitted/false, client may still verify.
   */
  initialAccess?: boolean;
}

export function BriefAccessGuard({ children, requiredTier, initialAccess }: GuardProps) {
  // ✅ REQUIRED tier normalization (doc context): unknown -> PUBLIC (no accidental paywall)
  const required = tiers.normalizeRequired(requiredTier);

  // ✅ Hard rule: public content never blocked by network state.
  if (required === "public") {
    return <>{children}</>;
  }

  /**
   * If server already granted access, do not “re-litigate” it on the client.
   * This prevents the “princes locked out because API hiccuped” situation.
   */
  if (initialAccess === true) {
    return <>{children}</>;
  }

  /**
   * Only now do we use the access hook (restricted content).
   * The hook may call /api/access/check and return states.
   */
  const { access, isLoading, isSystemBusy, retry } = useFortifiedAccess(false);

  const hasAccess = !!access?.hasAccess;

  // 1) Loading (restricted only)
  if (isLoading && !hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] space-y-4">
        <div className="w-8 h-8 border-2 border-amber-900/30 border-t-amber-600 rounded-full animate-spin" />
        <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
          Verifying Credentials...
        </p>
      </div>
    );
  }

  // 2) System busy / timeout (restricted only)
  if (isSystemBusy && !hasAccess) {
    return (
      <div className="mx-auto max-w-2xl my-20 p-8 border border-amber-900/30 bg-amber-950/5 rounded-lg text-center">
        <h2 className="font-serif text-xl text-amber-200 mb-2">Vault Connection Latency</h2>
        <p className="text-zinc-500 text-sm mb-6">
          The access service is currently under load. Your clearance could not be verified in real-time.
        </p>
        <button
          onClick={retry}
          className="px-6 py-2 bg-amber-900/40 border border-amber-800/50 text-amber-200 text-xs font-mono uppercase tracking-widest hover:bg-amber-800/60 transition"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  // 3) Unauthorized (restricted only)
  if (!hasAccess) {
    return (
      <div className="mx-auto max-w-2xl my-20 p-12 border border-white/5 bg-zinc-900/20 rounded-lg text-center">
        <div className="mb-6 inline-block p-4 rounded-full bg-amber-950/10 border border-amber-900/20">
          <span className="text-2xl">🔒</span>
        </div>
        <h2 className="font-serif text-2xl text-white mb-2">Restricted Intelligence</h2>
        <p className="text-zinc-500 text-sm mb-8">
          This brief requires{" "}
          <span className="text-amber-600/80 font-mono uppercase">
            {tiers.getLabel(required)}
          </span>{" "}
          level clearance.
        </p>
        <a
          href="/inner-circle"
          className="px-8 py-3 bg-white text-black text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition"
        >
          Upgrade Clearance
        </a>

        {/* Optional: display reason if you want (safe) */}
        {/* <div className="mt-6 text-[10px] font-mono text-zinc-600 uppercase tracking-widest">
          Reason: {access?.reason || "requires_auth"}
        </div> */}
      </div>
    );
  }

  // 4) Access granted
  return <>{children}</>;
}

export default BriefAccessGuard;