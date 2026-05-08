import type { EnterpriseControlRoomSnapshot } from "@/lib/product/enterprise-control-room-contract";

const UNSAFE_PATTERNS = [
  /employee\s+\w+/i,
  /respondent\s+\w+/i,
  /said\s+["']/i,
  /operator note/i,
  /warning:/i,
  /threshold/i,
  /algorithm/i,
  /kernel/i,
];

function isUnsafeText(value: string): boolean {
  return UNSAFE_PATTERNS.some((pattern) => pattern.test(value));
}

function sanitizeString(value: string): string {
  if (isUnsafeText(value)) {
    return "Sponsor-safe aggregate wording has replaced suppressed internal or respondent-level detail.";
  }
  return value;
}

export function sanitizeEnterpriseControlRoomSnapshot(snapshot: EnterpriseControlRoomSnapshot): EnterpriseControlRoomSnapshot {
  return {
    ...snapshot,
    sponsorRequiredActions: snapshot.sponsorRequiredActions.map(sanitizeString),
    warnings: snapshot.warnings.map(sanitizeString),
    sections: snapshot.sections.map((section) => ({
      ...section,
      summary: sanitizeString(section.summary),
      data: section.data,
    })),
    visibilityRetained: snapshot.visibilityRetained
      ? {
          ...snapshot.visibilityRetained,
          headline: sanitizeString(snapshot.visibilityRetained.headline),
          items: snapshot.visibilityRetained.items.map((item) => ({
            ...item,
            description: sanitizeString(item.description),
            evidence: sanitizeString(item.evidence),
          })),
        }
      : null,
  };
}

export function assertEnterpriseControlRoomSafety(snapshot: EnterpriseControlRoomSnapshot): string[] {
  const warnings: string[] = [];
  for (const section of snapshot.sections) {
    if (isUnsafeText(section.summary)) {
      warnings.push(`Section ${section.key} required sponsor-safe rewriting.`);
    }
  }
  return warnings;
}
