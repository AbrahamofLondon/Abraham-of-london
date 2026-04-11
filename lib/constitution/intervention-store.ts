import type { InterventionRecord } from "./intervention-types";

const interventions = new Map<string, InterventionRecord>();

function now(): string {
  return new Date().toISOString();
}

function id(): string {
  return `intv_${Math.random().toString(36).slice(2, 10)}`;
}

export function createIntervention(
  input: Omit<InterventionRecord, "id" | "createdAt" | "status">,
): InterventionRecord {
  const record: InterventionRecord = {
    ...input,
    id: id(),
    createdAt: now(),
    status: "PENDING",
  };

  interventions.set(record.id, record);
  return record;
}

export function updateIntervention(
  id: string,
  patch: Partial<InterventionRecord>,
): InterventionRecord | null {
  const existing = interventions.get(id);
  if (!existing) return null;

  const updated = { ...existing, ...patch };
  interventions.set(id, updated);
  return updated;
}

export function listInterventions(): InterventionRecord[] {
  return Array.from(interventions.values()).sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
}

export function listOpenInterventions(): InterventionRecord[] {
  return listInterventions().filter(
    (x) => x.status !== "COMPLETED" && x.status !== "FAILED",
  );
}

export function getIntervention(id: string): InterventionRecord | null {
  return interventions.get(id) ?? null;
}