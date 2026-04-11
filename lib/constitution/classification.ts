/* lib/constitution/classification.ts */
export function classifyReadiness(score: number): "SOVEREIGN" | "EXECUTION_READY" | "STABILIZING" | "EMERGING" | "FRAGILE" {
  if (score >= 85) return "SOVEREIGN";
  if (score >= 72) return "EXECUTION_READY";
  if (score >= 58) return "STABILIZING";
  if (score >= 42) return "EMERGING";
  return "FRAGILE";
}

export function classifyPosture(clarity: number, coherence: number): "ORDERED" | "DRIFTING" | "MISALIGNED" | "DISORDERED" {
  const avg = (clarity + coherence) / 2;
  if (avg >= 82) return "ORDERED";
  if (avg >= 65) return "DRIFTING";
  if (avg >= 48) return "MISALIGNED";
  return "DISORDERED";
}