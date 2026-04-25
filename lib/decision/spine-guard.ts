/**
 * Spine Guard — page-level redirect for spine-dependent stages.
 *
 * Every stage after Fast Diagnostic requires a spine.
 * If no spine exists, the user must start with their decision.
 * No fresh starts. No blank slates. No resets.
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { loadSpineFromSession } from "./spine-persistence";
import type { IntelligenceSpine, SpineStage } from "./intelligence-spine";

export type SpineGuardResult = {
  /** The spine, if loaded. Null during loading or if redirecting. */
  spine: IntelligenceSpine | null;
  /** True while loading from sessionStorage */
  loading: boolean;
  /** True if redirecting to fast diagnostic */
  redirecting: boolean;
};

/**
 * React hook that enforces spine availability.
 *
 * Usage in any assessment page:
 * ```
 * const { spine, loading } = useSpineGuard("constitutional");
 * if (loading || !spine) return <LoadingScreen />;
 * // spine is guaranteed non-null here
 * ```
 *
 * If no spine is found in session, redirects to /diagnostics/fast
 * with a returnTo parameter so the user comes back after completing it.
 */
export function useSpineGuard(requiredFor: SpineStage): SpineGuardResult {
  const router = useRouter();
  const [spine, setSpine] = useState<IntelligenceSpine | null>(null);
  const [loading, setLoading] = useState(true);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    const loaded = loadSpineFromSession();

    if (!loaded) {
      setRedirecting(true);
      const returnTo = encodeURIComponent(router.asPath);
      void router.replace(`/diagnostics/fast?returnTo=${returnTo}`);
      return;
    }

    setSpine(loaded);
    setLoading(false);
  }, [router, requiredFor]);

  return { spine, loading, redirecting };
}

/**
 * Get the inherited context message for display at the top of a stage.
 *
 * Shows what the spine already knows about this user's decision,
 * so no stage feels like a reset.
 */
export function getInheritedContext(spine: IntelligenceSpine): {
  headline: string;
  conditionClass: string;
  contradiction: string | null;
  stagesCompleted: string[];
  journeyDepth: number;
} {
  const synthesis = spine.synthesis;
  const condition = spine.deterministic.conditionClass;

  const headline = synthesis?.verdict
    ? `The system identified: ${synthesis.verdict.slice(0, 120)}${synthesis.verdict.length > 120 ? "..." : ""}`
    : `The system classified your decision condition as ${condition}. This stage tests the structural conditions sustaining that state.`;

  const contradiction = synthesis?.primaryContradiction ?? null;

  const stagesCompleted = spine.history.map((e) => {
    const names: Record<SpineStage, string> = {
      fast_diagnostic: "Fast Diagnostic",
      constitutional: "Constitutional Assessment",
      team: "Team Assessment",
      enterprise: "Enterprise Assessment",
      executive_reporting: "Executive Reporting",
      strategy_room: "Strategy Room",
      outcome_verification: "Outcome Verification",
    };
    return names[e.stage];
  });

  return {
    headline,
    conditionClass: condition,
    contradiction,
    stagesCompleted,
    journeyDepth: spine.history.length,
  };
}
