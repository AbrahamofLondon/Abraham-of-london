import { createHash } from "crypto";

import { prisma } from "@/lib/prisma";
import type { DiagnosticSnapshot } from "@/lib/monitoring/longitudinal-engine";

export type DiagnosticJourneyStage =
  | "purpose_alignment"
  | "constitutional"
  | "team"
  | "enterprise"
  | "executive_reporting"
  | "monitoring";

export type DiagnosticJourneyRecord = {
  journeyKey: string;
  subjectKey: string;
  organisation?: string | null;
  email?: string | null;
  stages: Partial<Record<DiagnosticJourneyStage, unknown>>;
  mergedTensionThread: string[];
  escalationHistory: unknown[];
  routeDecisions: unknown[];
  snapshots: DiagnosticSnapshot[];
};

const memoryJourneys = new Map<string, DiagnosticJourneyRecord>();

function subjectKey(input: { email?: string | null; subjectId?: string | null; campaignId?: string | null }): string {
  const raw = input.subjectId || input.campaignId || input.email || "anonymous";
  return createHash("sha256").update(String(raw).toLowerCase()).digest("hex");
}

export function getJourneyKey(input: { email?: string | null; subjectId?: string | null; campaignId?: string | null }): string {
  return `journey_${subjectKey(input).slice(0, 24)}`;
}

function emptyJourney(input: {
  email?: string | null;
  subjectId?: string | null;
  campaignId?: string | null;
  organisation?: string | null;
}): DiagnosticJourneyRecord {
  return {
    journeyKey: getJourneyKey(input),
    subjectKey: subjectKey(input),
    organisation: input.organisation ?? null,
    email: input.email ?? null,
    stages: {},
    mergedTensionThread: [],
    escalationHistory: [],
    routeDecisions: [],
    snapshots: [],
  };
}

function readJsonArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function readJsonObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function normalizeSnapshot(value: unknown): DiagnosticSnapshot | null {
  const snapshot = readJsonObject(value);
  if (!snapshot.timestamp || typeof snapshot.timestamp !== "string") return null;
  return {
    id: typeof snapshot.id === "string" ? snapshot.id : undefined,
    timestamp: snapshot.timestamp,
    stage: typeof snapshot.stage === "string" ? snapshot.stage : "diagnostic",
    coreMetrics: readJsonObject(snapshot.coreMetrics) as Record<string, number>,
    tensions: Array.isArray(snapshot.tensions)
      ? snapshot.tensions.map(String).filter(Boolean)
      : [],
    escalationLevel:
      typeof snapshot.escalationLevel === "number" ? snapshot.escalationLevel : 0,
    directive: typeof snapshot.directive === "string" ? snapshot.directive : null,
    benchmarkPosition: snapshot.benchmarkPosition,
    trajectoryResult: snapshot.trajectoryResult,
  };
}

function fromPrismaJourney(row: any, fallback: {
  email?: string | null;
  subjectId?: string | null;
  campaignId?: string | null;
  organisation?: string | null;
}): DiagnosticJourneyRecord {
  const stages: Partial<Record<DiagnosticJourneyStage, unknown>> = {};
  for (const stage of row?.stages || []) {
    stages[stage.stage as DiagnosticJourneyStage] = stage.payload;
  }

  const monitoringSnapshots = (row?.monitoringSnapshots || [])
    .map((entry: any) => normalizeSnapshot(entry.snapshot))
    .filter(Boolean) as DiagnosticSnapshot[];

  const threadSnapshots = (row?.threadSnapshots || [])
    .map((entry: any) => normalizeSnapshot(entry.snapshot))
    .filter(Boolean) as DiagnosticSnapshot[];

  return {
    journeyKey: row?.journeyKey || getJourneyKey(fallback),
    subjectKey: row?.subjectKey || subjectKey(fallback),
    organisation: row?.organisation ?? fallback.organisation ?? null,
    email: row?.email ?? fallback.email ?? null,
    stages,
    mergedTensionThread: readJsonArray(row?.mergedTensionThread).map(String),
    escalationHistory: readJsonArray(row?.escalationHistory),
    routeDecisions: readJsonArray(row?.routeDecisions),
    snapshots: [...threadSnapshots, ...monitoringSnapshots],
  };
}

export async function getDiagnosticJourney(input: {
  email?: string | null;
  subjectId?: string | null;
  campaignId?: string | null;
  organisation?: string | null;
}): Promise<DiagnosticJourneyRecord> {
  const key = getJourneyKey(input);
  const cached = memoryJourneys.get(key);
  if (cached) return cached;

  try {
    const p = prisma as any;
    if (p?.diagnosticJourney?.findUnique) {
      const row = await p.diagnosticJourney.findUnique({
        where: { journeyKey: key },
        include: {
          stages: { orderBy: { createdAt: "asc" } },
          threadSnapshots: { orderBy: { createdAt: "asc" } },
          monitoringSnapshots: { orderBy: { createdAt: "asc" } },
        },
      });
      if (row) {
        const parsed = fromPrismaJourney(row, input);
        memoryJourneys.set(key, parsed);
        return parsed;
      }
    }

    const latest = await prisma.diagnosticRecord.findFirst({
      where: {
        diagnosticType: "diagnostic_journey",
        userEmail: input.email || undefined,
      },
      orderBy: { createdAt: "desc" },
      select: { responsesJson: true },
    });
    if (latest?.responsesJson) {
      const parsed = JSON.parse(latest.responsesJson) as DiagnosticJourneyRecord;
      memoryJourneys.set(key, parsed);
      return parsed;
    }
  } catch {}

  const fresh = emptyJourney(input);
  memoryJourneys.set(key, fresh);
  return fresh;
}

export async function persistDiagnosticStage(input: {
  email?: string | null;
  subjectId?: string | null;
  campaignId?: string | null;
  organisation?: string | null;
  stage: DiagnosticJourneyStage;
  payload: unknown;
  tensions?: string[];
  routeDecision?: unknown;
  escalationEvent?: unknown;
  snapshot?: DiagnosticSnapshot;
}): Promise<DiagnosticJourneyRecord> {
  const journey = await getDiagnosticJourney(input);
  journey.stages[input.stage] = input.payload;
  journey.organisation = input.organisation ?? journey.organisation ?? null;
  journey.email = input.email ?? journey.email ?? null;
  journey.mergedTensionThread = [
    ...new Set([...journey.mergedTensionThread, ...(input.tensions || [])]),
  ];
  if (input.routeDecision) journey.routeDecisions.push(input.routeDecision);
  if (input.escalationEvent) journey.escalationHistory.push(input.escalationEvent);
  if (input.snapshot) journey.snapshots.push(input.snapshot);

  memoryJourneys.set(journey.journeyKey, journey);

  try {
    const p = prisma as any;
    if (p?.diagnosticJourney?.upsert) {
      const persisted = await p.diagnosticJourney.upsert({
        where: { journeyKey: journey.journeyKey },
        create: {
          journeyKey: journey.journeyKey,
          subjectKey: journey.subjectKey,
          email: journey.email,
          organisation: journey.organisation,
          mergedTensionThread: journey.mergedTensionThread,
          escalationHistory: journey.escalationHistory,
          routeDecisions: journey.routeDecisions,
        },
        update: {
          email: journey.email,
          organisation: journey.organisation,
          mergedTensionThread: journey.mergedTensionThread,
          escalationHistory: journey.escalationHistory,
          routeDecisions: journey.routeDecisions,
        },
        select: { id: true },
      });

      await p.diagnosticStageRecord.create({
        data: {
          journeyId: persisted.id,
          stage: input.stage,
          payload: input.payload,
        },
      });

      await p.diagnosticThreadSnapshot.create({
        data: {
          journeyId: persisted.id,
          snapshot: {
            stage: input.stage,
            payload: input.payload,
            tensions: input.tensions || [],
            routeDecision: input.routeDecision || null,
            escalationEvent: input.escalationEvent || null,
            capturedAt: new Date().toISOString(),
          },
        },
      });

      if (input.snapshot) {
        await p.monitoringSnapshot.create({
          data: {
            journeyId: persisted.id,
            campaignId: input.campaignId || null,
            cadence: input.stage === "monitoring" ? "monthly" : "ad_hoc",
            snapshot: input.snapshot,
          },
        });
      }

      return journey;
    }

    await prisma.diagnosticRecord.create({
      data: {
        diagnosticType: "diagnostic_journey",
        title: `Diagnostic Journey ${journey.journeyKey}`,
        score: 0,
        severity: "low",
        verdict: input.stage,
        responsesJson: JSON.stringify(journey),
        userEmail: input.email || null,
      },
    });
  } catch {}

  return journey;
}

export async function getMonitoringSnapshots(input: {
  email?: string | null;
  subjectId?: string | null;
  campaignId?: string | null;
}): Promise<DiagnosticSnapshot[]> {
  const journey = await getDiagnosticJourney(input);
  return journey.snapshots;
}
