import type {
  ConstitutionalEvent,
  ConstitutionalDriftFlag,
  DriftTribunalCase,
} from "./observability-types";

// Transient in-memory state
const eventStore = new Map<string, ConstitutionalEvent>();
const driftStore = new Map<string, ConstitutionalDriftFlag>();
const tribunalStore = new Map<string, DriftTribunalCase>();

export function saveConstitutionalEvent(
  event: ConstitutionalEvent,
): ConstitutionalEvent {
  eventStore.set(event.id, event);
  return event;
}

export function listConstitutionalEvents(): ConstitutionalEvent[] {
  return Array.from(eventStore.values()).sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
}

export function saveDriftFlag(
  flag: ConstitutionalDriftFlag,
): ConstitutionalDriftFlag {
  driftStore.set(flag.id, flag);
  return flag;
}

export function listDriftFlags(): ConstitutionalDriftFlag[] {
  return Array.from(driftStore.values()).sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
}

export function saveTribunalCase(
  item: DriftTribunalCase,
): DriftTribunalCase {
  tribunalStore.set(item.id, item);
  return item;
}

/**
 * Crucial for the Rule Mutation Engine to analyze recent history
 */
export function listTribunalCases(): DriftTribunalCase[] {
  return Array.from(tribunalStore.values()).sort((a, b) =>
    (b.updatedAt || "").localeCompare(a.updatedAt || ""),
  );
}

export function getTribunalCase(id: string): DriftTribunalCase | null {
  return tribunalStore.get(id) ?? null;
}