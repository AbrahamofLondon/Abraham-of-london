import "server-only";

export function arbitrateProtectedOutput<T extends { summary?: string; directive?: string }>(
  output: T,
): T {
  return {
    ...output,
    summary: output.summary || "Governed analysis complete.",
  };
}
