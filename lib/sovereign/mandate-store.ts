import type { MandateRecord } from "./execution-types";

const mandates = new Map<string, MandateRecord>();

function now() {
  return new Date().toISOString();
}

function id() {
  return `mdt_${Math.random().toString(36).slice(2, 10)}`;
}

export function createMandate(
  input: Omit<MandateRecord, "id" | "audit" | "status">,
): MandateRecord {
  const record: MandateRecord = {
    ...input,
    id: id(),
    status: "PROPOSED",
    audit: { createdAt: now() },
  };

  mandates.set(record.id, record);
  return record;
}

export function updateMandate(
  id: string,
  patch: Partial<MandateRecord>,
): MandateRecord | null {
  const existing = mandates.get(id);
  if (!existing) return null;

  const updated = { ...existing, ...patch };
  mandates.set(id, updated);
  return updated;
}

export function listMandates(): MandateRecord[] {
  return Array.from(mandates.values());
}