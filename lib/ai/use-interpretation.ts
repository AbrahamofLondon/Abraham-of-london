/**
 * lib/ai/use-interpretation.ts — Client-side async interpretation hook
 *
 * Usage pattern:
 * 1. Component renders with canonical engine output (immediate)
 * 2. useEffect calls this hook with canonical output + user inputs
 * 3. Hook fires async interpretation request
 * 4. When interpretation arrives, component enriches display
 *
 * If interpretation fails → canonical output stands. Never blocks.
 */

import { useState, useEffect } from "react";
import { stableInputHash } from "@/lib/diagnostics/runtime-validation";
import type { InterpretationOutput } from "./interpretation-engine";
import type { InterpretationStage } from "./prompts";

type UseInterpretationInput = {
  canonicalResult: Record<string, unknown>;
  userInputs: Record<string, unknown>;
  stage: InterpretationStage;
  tensionThread?: Record<string, unknown> | null;
  /** Only fire if this is true (prevents unnecessary calls) */
  enabled?: boolean;
};

type UseInterpretationResult = {
  interpretation: InterpretationOutput | null;
  loading: boolean;
  error: string | null;
  source: "llm" | "fallback" | "cached" | "pending";
};

export function useInterpretation(input: UseInterpretationInput): UseInterpretationResult {
  const [interpretation, setInterpretation] = useState<InterpretationOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const enabled = input.enabled !== false;
  const requestSignature = [
    input.stage,
    stableInputHash(input.canonicalResult),
    stableInputHash(input.userInputs),
    stableInputHash(input.tensionThread ?? null),
  ].join(":");

  useEffect(() => {
    if (!enabled || !input.canonicalResult || !input.userInputs) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch("/api/interpret", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        canonicalResult: input.canonicalResult,
        userInputs: input.userInputs,
        stage: input.stage,
        tensionThread: input.tensionThread ?? null,
        cacheScope:
          typeof input.userInputs.journeyId === "string" ? input.userInputs.journeyId :
          typeof input.userInputs.sessionId === "string" ? input.userInputs.sessionId :
          typeof input.userInputs.email === "string" ? input.userInputs.email :
          null,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data.ok) {
          setInterpretation(data as InterpretationOutput);
        } else {
          setError(data.reason || "Interpretation unavailable");
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Interpretation request failed");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, requestSignature]);

  return {
    interpretation,
    loading,
    error,
    source: interpretation?.source ?? "pending",
  };
}
