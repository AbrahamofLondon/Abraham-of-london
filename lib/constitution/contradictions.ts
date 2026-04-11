export function detectContradictions(text: string): string[] {
  const contradictions: string[] = [];
  const lower = text.toLowerCase();

  if (lower.includes("urgent") && !lower.includes("week") && !lower.includes("month") && !lower.includes("timeline")) {
    contradictions.push("Claims urgency but provides no timeline");
  }
  if ((lower.includes("growth") || lower.includes("scale")) && !lower.includes("revenue") && !lower.includes("customer")) {
    contradictions.push("Growth claim without supporting commercial signals");
  }
  if (lower.includes("strategic") && text.length < 150) {
    contradictions.push("Strategic claim made without sufficient depth");
  }
  if (lower.includes("transform") && !lower.includes("how") && !lower.includes("plan")) {
    contradictions.push("Transformation mentioned without execution approach");
  }

  return contradictions;
}