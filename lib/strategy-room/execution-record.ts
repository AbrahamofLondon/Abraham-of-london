import { prisma } from "@/lib/prisma.server";

export type StrategyExecutionRecord = {
  id: string;
  sessionId: string;
  decision: string;
  authority: string;
  conflictResolved: string;
  firstAction: string;
  timeline: string | null;
  owner: string | null;
  createdAt: string;
  evidenceSource: string;
  email: string | null;
};

export type PersistStrategyExecutionRecordInput = {
  sessionId: string;
  decision: string;
  authority: string;
  conflictResolved?: string | null;
  firstAction: string;
  timeline?: string | null;
  owner?: string | null;
  createdAt?: string | null;
  evidenceSource?: string | null;
  email?: string | null;
};

function parsePayload(value: unknown): Record<string, unknown> {
  if (!value) return {};
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? parsed as Record<string, unknown>
        : {};
    } catch {
      return {};
    }
  }
  return typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function toRecord(node: {
  id: string;
  sessionId: string | null;
  summary: string;
  evidenceText: string | null;
  createdAt: Date;
  email: string | null;
  payload: unknown;
}): StrategyExecutionRecord {
  const payload = parsePayload(node.payload);
  return {
    id: node.id,
    sessionId: String(payload.sessionId ?? node.sessionId ?? ""),
    decision: String(payload.decision ?? node.summary ?? ""),
    authority: String(payload.authority ?? ""),
    conflictResolved: String(payload.conflictResolved ?? ""),
    firstAction: String(payload.firstAction ?? ""),
    timeline: payload.timeline == null ? null : String(payload.timeline),
    owner: payload.owner == null ? null : String(payload.owner),
    createdAt: String(payload.createdAt ?? node.createdAt.toISOString()),
    evidenceSource: String(payload.evidenceSource ?? "execution_flow"),
    email: payload.email == null ? node.email : String(payload.email),
  };
}

export async function persistStrategyExecutionRecord(
  input: PersistStrategyExecutionRecordInput,
): Promise<StrategyExecutionRecord> {
  const createdAt = input.createdAt ? new Date(input.createdAt) : new Date();
  const node = await prisma.diagnosticEvidenceNode.create({
    data: {
      sessionId: input.sessionId,
      email: input.email ?? null,
      sourceStage: "strategy_room",
      kind: "execution_record",
      label: `Execution record: ${input.decision.slice(0, 100)}`,
      summary: input.decision,
      evidenceText: [
        `Authority: ${input.authority}`,
        input.conflictResolved ? `Conflict resolved: ${input.conflictResolved}` : null,
        `First action: ${input.firstAction}`,
        input.timeline ? `Timeline: ${input.timeline}` : null,
        input.owner ? `Owner: ${input.owner}` : null,
      ].filter(Boolean).join(" | "),
      severity: "high",
      confidence: 0.95,
      payload: {
        sessionId: input.sessionId,
        decision: input.decision,
        authority: input.authority,
        conflictResolved: input.conflictResolved ?? "",
        firstAction: input.firstAction,
        timeline: input.timeline ?? null,
        owner: input.owner ?? null,
        createdAt: createdAt.toISOString(),
        evidenceSource: input.evidenceSource ?? "execution_flow",
        email: input.email ?? null,
      },
      createdAt,
    },
  });

  return toRecord(node);
}

export async function findLatestStrategyExecutionRecord(filter: {
  sessionId?: string | null;
  email?: string | null;
}): Promise<StrategyExecutionRecord | null> {
  const clauses: Array<Record<string, unknown>> = [];
  if (filter.sessionId) clauses.push({ sessionId: filter.sessionId });
  if (filter.email) clauses.push({ email: filter.email.toLowerCase() });

  if (clauses.length === 0) return null;

  const node = await prisma.diagnosticEvidenceNode.findFirst({
    where: {
      kind: "execution_record",
      OR: clauses,
    },
    orderBy: { createdAt: "desc" },
  });

  return node ? toRecord(node) : null;
}
