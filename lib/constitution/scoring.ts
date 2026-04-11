/* lib/constitution/scoring.ts */
export function wordCount(text: string): number {
  return text.trim().split(/\s+/).length;
}

export function scoreClarity(text: string): number {
  const len = wordCount(text);
  if (len < 40) return 20;
  if (len < 80) return 40;
  if (len < 140) return 60;
  if (len < 220) return 75;
  return 85;
}

export function scoreCoherence(text: string): number {
  const hasStructure = /because|therefore|however|result|impact|risk|leads to|in order to/i.test(text);
  return hasStructure ? 70 : 40;
}

export function detectAuthority(role: string): "DIRECT" | "PROXY" | "UNCLEAR" {
  const r = role.toLowerCase();
  if (/founder|ceo|director|owner|head of|chairman/.test(r)) return "DIRECT";
  if (/manager|lead|advisor|consultant|executive/.test(r)) return "PROXY";
  return "UNCLEAR";
}

export function scoreReadiness(
  clarity: number,
  coherence: number,
  authority: "DIRECT" | "PROXY" | "UNCLEAR"
): number {
  let score = clarity * 0.5 + coherence * 0.3;
  if (authority === "DIRECT") score += 20;
  if (authority === "PROXY") score += 8;
  return Math.min(100, Math.max(10, Math.round(score)));
}