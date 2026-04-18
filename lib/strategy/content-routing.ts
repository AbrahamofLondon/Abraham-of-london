export type ContentSurface = "essays" | "shorts" | "intelligence";

export type ContentRoutingRule = {
  source: ContentSurface;
  primaryIntent: string;
  destination: "diagnostics" | "essays" | "strategy-room-qualification";
  rationale: string;
};

export const CONTENT_ROUTING_RULES: ContentRoutingRule[] = [
  {
    source: "essays",
    primaryIntent: "Move serious readers from worldview clarification into structured self-assessment.",
    destination: "diagnostics",
    rationale:
      "Essays should turn resonance and conceptual agreement into measurable signal through diagnostic entry.",
  },
  {
    source: "shorts",
    primaryIntent: "Capture awareness and emotional recognition, then deepen into longer-form authority.",
    destination: "essays",
    rationale:
      "Shorts are for attention and self-recognition. Essays do the heavier reframing required before qualification.",
  },
  {
    source: "intelligence",
    primaryIntent: "Qualify high-seriousness readers for the strategic chamber rather than general awareness flows.",
    destination: "strategy-room-qualification",
    rationale:
      "Intelligence surfaces should feed buyers who already think in consequence, governance, and strategic risk.",
  },
];
