/**
 * lib/living-intelligence/drift-memory-store.ts
 *
 * Tracks contradictions and findings across runs so the system can learn
 * from repeated failures, regressions, and resolutions.
 *
 * Memory is stored in reports/living-product-memory.json.
 * Each entry tracks:
 *   - contradiction id
 *   - doctrine claim id
 *   - first seen / last seen
 *   - recurrence count
 *   - previous / current severity
 *   - status
 *   - affected files
 *   - evidence
 *   - owner decision
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const MEMORY_PATH = path.join(ROOT, "reports", "living-product-memory.json");

export type MemoryEntryStatus =
  | "new"
  | "repeated"
  | "worsened"
  | "improved"
  | "resolved"
  | "regressed"
  | "accepted_risk"
  | "owner_decision_required";

export type DriftMemoryEntry = {
  id: string;
  title: string;
  doctrineClaimId?: string;
  firstSeen: string;
  lastSeen: string;
  recurrenceCount: number;
  previousSeverity: string;
  currentSeverity: string;
  status: MemoryEntryStatus;
  affectedFiles: string[];
  evidence: string[];
  ownerDecision?: string;
  ownerDecisionDate?: string;
};

export type DriftMemoryStore = {
  version: number;
  updatedAt: string;
  entries: DriftMemoryEntry[];
};

// ─── Load / Save ────────────────────────────────────────────────────────────

function loadMemory(): DriftMemoryStore {
  try {
    if (fs.existsSync(MEMORY_PATH)) {
      const raw = fs.readFileSync(MEMORY_PATH, "utf-8");
      return JSON.parse(raw);
    }
  } catch {
    // Corrupted or missing — start fresh
  }
  return { version: 1, updatedAt: new Date().toISOString(), entries: [] };
}

function saveMemory(store: DriftMemoryStore): void {
  const dir = path.dirname(MEMORY_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  store.updatedAt = new Date().toISOString();
  fs.writeFileSync(MEMORY_PATH, JSON.stringify(store, null, 2), "utf-8");
}

// ─── Merge new findings into memory ─────────────────────────────────────────

export type FindingToRemember = {
  id: string;
  title: string;
  doctrineClaimId?: string;
  severity: string;
  affectedFiles: string[];
  evidence: string[];
};

export function mergeIntoMemory(findings: FindingToRemember[]): DriftMemoryStore {
  const store = loadMemory();
  const now = new Date().toISOString();

  for (const finding of findings) {
    const existing = store.entries.find((e) => e.id === finding.id);

    if (existing) {
      // Update existing entry
      existing.lastSeen = now;
      existing.recurrenceCount++;
      existing.evidence = finding.evidence;
      existing.affectedFiles = [...new Set([...existing.affectedFiles, ...finding.affectedFiles])];

      // Determine status based on severity change
      const prevSeverity = existing.currentSeverity;
      const currSeverity = finding.severity;
      existing.previousSeverity = prevSeverity;
      existing.currentSeverity = currSeverity;

      if (currSeverity === prevSeverity) {
        existing.status = existing.recurrenceCount > 1 ? "repeated" : "new";
      } else if (isWorse(currSeverity, prevSeverity)) {
        existing.status = "worsened";
      } else {
        existing.status = "improved";
      }
    } else {
      // New entry
      store.entries.push({
        id: finding.id,
        title: finding.title,
        doctrineClaimId: finding.doctrineClaimId,
        firstSeen: now,
        lastSeen: now,
        recurrenceCount: 1,
        previousSeverity: "none",
        currentSeverity: finding.severity,
        status: "new",
        affectedFiles: finding.affectedFiles,
        evidence: finding.evidence,
      });
    }
  }

  // Mark entries not in current findings as resolved (if they were previously open)
  const currentIds = new Set(findings.map((f) => f.id));
  for (const entry of store.entries) {
    if (!currentIds.has(entry.id) && entry.status !== "resolved" && entry.status !== "accepted_risk") {
      entry.status = "resolved";
      entry.lastSeen = now;
    }
  }

  saveMemory(store);
  return store;
}

function isWorse(curr: string, prev: string): boolean {
  const order: Record<string, number> = {
    informational_note: 0,
    governed_tension: 1,
    narrative_drift: 2,
    storefront_gap: 3,
    content_route_failure: 4,
    governance_contradiction: 5,
    publication_lifecycle_conflict: 6,
    source_of_truth_conflict: 7,
    commercial_safety_blocker: 8,
    checkout_bypass: 9,
    fatal_build_blocker: 10,
  };
  return (order[curr] ?? 0) > (order[prev] ?? 0);
}

export function getMemory(): DriftMemoryStore {
  return loadMemory();
}

export function getMemoryEntry(id: string): DriftMemoryEntry | undefined {
  return loadMemory().entries.find((e) => e.id === id);
}

export function getRepeatedContradictions(): DriftMemoryEntry[] {
  return loadMemory().entries.filter((e) => e.status === "repeated" || e.status === "worsened" || e.status === "regressed");
}

export function getResolvedContradictions(): DriftMemoryEntry[] {
  return loadMemory().entries.filter((e) => e.status === "resolved");
}
