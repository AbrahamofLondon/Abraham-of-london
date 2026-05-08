import { prisma } from "@/lib/prisma";

export type PatternRecurrenceResult = {
  status:
    | "NO_PRIOR_PATTERN"
    | "POSSIBLE_RECURRENCE"
    | "VERIFIED_RECURRENCE"
    | "INSUFFICIENT_HISTORY";
  priorCount: number;
  matchedCaseIds: string[];
  explanation: string;
};

function normalize(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function tokenSet(value: string): Set<string> {
  const stop = new Set(["the", "and", "for", "with", "that", "this", "from", "into", "have", "been", "your", "their", "about"]);
  return new Set(
    value
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((token) => token.length > 3 && !stop.has(token)),
  );
}

function overlap(a: string, b: string): number {
  const left = tokenSet(a);
  const right = tokenSet(b);
  if (!left.size || !right.size) return 0;
  let matches = 0;
  for (const token of left) {
    if (right.has(token)) matches += 1;
  }
  return matches / Math.max(left.size, right.size);
}

export async function detectPatternRecurrenceV0(input: {
  email?: string | null;
  organisationKey?: string | null;
  currentCaseId?: string | null;
  contradiction?: string | null;
  decisionText?: string | null;
}): Promise<PatternRecurrenceResult> {
  const contradiction = normalize(input.contradiction);
  const decisionText = normalize(input.decisionText);
  const organisationKey = normalize(input.organisationKey);
  const email = normalize(input.email);

  if (!contradiction && !decisionText) {
    return {
      status: "INSUFFICIENT_HISTORY",
      priorCount: 0,
      matchedCaseIds: [],
      explanation: "Pattern recurrence cannot be assessed because there is no contradiction or decision text to compare.",
    };
  }

  const journeys = await prisma.diagnosticJourney.findMany({
    where: {
      OR: [
        ...(organisationKey ? [{ organisationKey }] : []),
        ...(email ? [{ email }] : []),
      ],
      ...(input.currentCaseId ? { journeyKey: { not: input.currentCaseId } } : {}),
    },
    include: {
      evidenceNodes: {
        where: { kind: { in: ["contradiction", "pattern_recurrence", "persistent_root_cause"] } },
        select: { summary: true, label: true },
      },
      decisionObjects: {
        select: { decisionText: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 25,
  });

  if (journeys.length === 0) {
    return {
      status: "INSUFFICIENT_HISTORY",
      priorCount: 0,
      matchedCaseIds: [],
      explanation: "No prior case history exists for this actor or organisation.",
    };
  }

  const matched = journeys.filter((journey) => {
    const contradictionMatch = contradiction
      ? journey.evidenceNodes.some((node) => {
          const text = normalize(node.summary || node.label);
          return text === contradiction || overlap(text, contradiction) >= 0.45;
        })
      : false;
    const decisionMatch = decisionText
      ? journey.decisionObjects.some((decision) => overlap(normalize(decision.decisionText), decisionText) >= 0.45)
      : false;
    return contradictionMatch || decisionMatch;
  });

  const priorCount = matched.length;
  if (priorCount === 0) {
    return {
      status: "NO_PRIOR_PATTERN",
      priorCount: 0,
      matchedCaseIds: [],
      explanation: "No prior contradiction or decision pattern could be matched with sufficient confidence.",
    };
  }

  if (priorCount === 1) {
    return {
      status: "POSSIBLE_RECURRENCE",
      priorCount,
      matchedCaseIds: matched.map((journey) => journey.journeyKey),
      explanation: "One prior case appears materially similar. Treat as a possible recurrence until additional evidence confirms the pattern.",
    };
  }

  return {
    status: "VERIFIED_RECURRENCE",
    priorCount,
    matchedCaseIds: matched.map((journey) => journey.journeyKey),
    explanation: `${priorCount} prior case histories match the current contradiction or decision shape. This supports a verified recurrence reading rather than a one-off event.`,
  };
}
