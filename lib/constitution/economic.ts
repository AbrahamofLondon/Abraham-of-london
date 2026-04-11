export function inferEconomicWeight(text: string): "LOW" | "MEDIUM" | "HIGH" {
  const lower = text.toLowerCase();

  if (/million|funding|investment|valuation|acquisition|exit/.test(lower)) return "HIGH";
  if (/revenue|budget|cost|profit|margin|burn/.test(lower)) return "MEDIUM";
  return "LOW";
}