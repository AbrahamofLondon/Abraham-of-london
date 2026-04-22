import { PLAYBOOK_REGISTRY } from "@/lib/playbooks/registry";
import type { MatchedPlaybook, PlaybookDefinition, PlaybookMatchContext } from "@/lib/playbooks/types";

function normalize(value: string): string {
  return value.trim().toUpperCase();
}

function overlaps(source: string[], target: string[]): string[] {
  const lookup = new Set(source.map(normalize));
  return target.filter((item) => lookup.has(normalize(item)));
}

function scorePlaybook(
  playbook: PlaybookDefinition,
  context: PlaybookMatchContext,
): MatchedPlaybook | null {
  let score = 0;
  const reasons: string[] = [];

  if (!playbook.routes.includes(context.route)) {
    return null;
  }

  score += 16;
  reasons.push(`Matched route: ${context.route.toLowerCase().replace(/_/g, " ")}`);

  if (playbook.readiness.includes(context.readiness as PlaybookDefinition["readiness"][number])) {
    score += 10;
    reasons.push(`Suitable for ${String(context.readiness).toLowerCase()} readiness`);
  }

  const failureOverlap = overlaps(context.failureModes, playbook.failureModes);
  if (failureOverlap.length > 0) {
    score += failureOverlap.length * 14;
    reasons.push(`Addresses ${failureOverlap.slice(0, 2).join(" and ").toLowerCase().replace(/_/g, " ")}`);
  }

  const dominantOverlap = overlaps(
    context.dominantDomains ?? [],
    playbook.dominantDomains ?? [],
  );
  if (dominantOverlap.length > 0) {
    score += dominantOverlap.length * 8;
    reasons.push(`Aligned to ${dominantOverlap[0]!.toLowerCase()} pressure`);
  }

  if (
    context.authorityType &&
    playbook.authorityTypes?.includes(context.authorityType as "DIRECT" | "PROXY" | "UNCLEAR")
  ) {
    score += 6;
    reasons.push(`Supports ${context.authorityType.toLowerCase()} authority condition`);
  }

  // Bonus for accumulated thread context
  if (context.teamFragility === "FRACTURED" && playbook.failureModes.some(m => /TRUST|SIGNAL/i.test(m))) {
    score += 8;
    reasons.push("Team fragility confirms structural strain");
  }
  if (context.enterprisePattern && playbook.failureModes.some(m => /EXECUTION|GOVERNANCE/i.test(m))) {
    score += 6;
    reasons.push("Enterprise pattern reinforces operational risk");
  }

  if (score < 24) {
    return null;
  }

  return {
    ...playbook,
    score,
    reasons,
  };
}

export function matchPlaybooks(
  context: PlaybookMatchContext,
  limit = 3,
): MatchedPlaybook[] {
  return PLAYBOOK_REGISTRY
    .map((playbook) => scorePlaybook(playbook, context))
    .filter((playbook): playbook is MatchedPlaybook => Boolean(playbook))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
