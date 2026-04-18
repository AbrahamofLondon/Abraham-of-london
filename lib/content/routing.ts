export type ContentSurface = "shorts" | "essay" | "intelligence" | "playbook" | "framework";

export type ContentIntent = "diagnostic" | "strategy-room" | "intelligence" | "playbooks";

export type ContentRouteRecommendation = {
  label: string;
  href: string;
  description: string;
};

export function getContentRouteRecommendation(
  surface: ContentSurface,
  intent?: ContentIntent,
): ContentRouteRecommendation {
  if (surface === "intelligence" || intent === "strategy-room") {
    return {
      label: "Enter Strategy Room",
      href: "/strategy-room",
      description: "Escalate from analysis into governed intervention.",
    };
  }

  if (surface === "playbook" || intent === "playbooks") {
    return {
      label: "Run the Diagnostic",
      href: "/diagnostics/constitutional-diagnostic",
      description: "Use the constitutional layer to determine which playbook is actually warranted.",
    };
  }

  return {
    label: "Run the Diagnostic",
    href: "/diagnostics/constitutional-diagnostic",
    description: "Move from signal and insight into a real constitutional reading.",
  };
}
