/* lib/constitution/failure.ts */
export function detectFailureModes(
  clarity: number,
  coherence: number,
  authority: "DIRECT" | "PROXY" | "UNCLEAR"
): string[] {
  const modes: string[] = [];

  if (clarity < 45) modes.push("Weak problem articulation");
  if (coherence < 50) modes.push("Narrative fragmentation");
  if (authority === "UNCLEAR") modes.push("Ambiguous decision rights");
  if (clarity < 55 && coherence < 55) modes.push("Strategic drift");
  if (clarity < 40) modes.push("Foundational misalignment");

  return modes;
}