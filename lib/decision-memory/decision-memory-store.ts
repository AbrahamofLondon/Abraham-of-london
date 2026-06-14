/**
 * Decision Memory Store
 *
 * Persistence adapter for decision memory events.
 * Currently uses JSON file storage for simplicity and auditability.
 *
 * Can be swapped to database without changing the interface.
 *
 * Invariant: All events are immutable once written.
 * No deletion, only append.
 */

import fs from "fs";
import path from "path";
import {
  DecisionMemoryEvent,
  ContradictionDefinition,
  EvidenceGapDefinition,
  CommitmentRecord,
  ConsequenceRecord,
  MemoryQuery,
  MemoryQueryResult,
} from "./decision-memory-contract";

const MEMORY_ROOT = path.join(process.cwd(), "artifacts", "decision-memory");
const EVENTS_FILE = path.join(MEMORY_ROOT, "events.json");
const CONTRADICTIONS_FILE = path.join(MEMORY_ROOT, "contradictions.json");
const EVIDENCE_GAPS_FILE = path.join(MEMORY_ROOT, "evidence-gaps.json");
const COMMITMENTS_FILE = path.join(MEMORY_ROOT, "commitments.json");
const CONSEQUENCES_FILE = path.join(MEMORY_ROOT, "consequences.json");

function ensureStorageExists() {
  if (!fs.existsSync(MEMORY_ROOT)) {
    fs.mkdirSync(MEMORY_ROOT, { recursive: true });
  }
  if (!fs.existsSync(EVENTS_FILE)) {
    fs.writeFileSync(EVENTS_FILE, JSON.stringify([], null, 2));
  }
  if (!fs.existsSync(CONTRADICTIONS_FILE)) {
    fs.writeFileSync(CONTRADICTIONS_FILE, JSON.stringify([], null, 2));
  }
  if (!fs.existsSync(EVIDENCE_GAPS_FILE)) {
    fs.writeFileSync(EVIDENCE_GAPS_FILE, JSON.stringify([], null, 2));
  }
  if (!fs.existsSync(COMMITMENTS_FILE)) {
    fs.writeFileSync(COMMITMENTS_FILE, JSON.stringify([], null, 2));
  }
  if (!fs.existsSync(CONSEQUENCES_FILE)) {
    fs.writeFileSync(CONSEQUENCES_FILE, JSON.stringify([], null, 2));
  }
}

export class DecisionMemoryStore {
  constructor() {
    ensureStorageExists();
  }

  /**
   * Append a decision memory event
   * Immutable: events cannot be modified after creation
   */
  appendEvent(event: DecisionMemoryEvent): boolean {
    try {
      const events = this.readFile<DecisionMemoryEvent[]>(EVENTS_FILE);
      events.push(event);
      fs.writeFileSync(EVENTS_FILE, JSON.stringify(events, null, 2));
      return true;
    } catch (error) {
      console.error("Failed to append event:", error);
      return false;
    }
  }

  /**
   * Get all events for a specific case
   */
  getEventsByCaseId(caseId: string): DecisionMemoryEvent[] {
    const events = this.readFile<DecisionMemoryEvent[]>(EVENTS_FILE);
    return events.filter((e) => e.caseId === caseId);
  }

  /**
   * Get all events for a specific product
   */
  getEventsByProductCode(productCode: string): DecisionMemoryEvent[] {
    const events = this.readFile<DecisionMemoryEvent[]>(EVENTS_FILE);
    return events.filter((e) => e.productCode === productCode);
  }

  /**
   * Get contradiction history for a case
   */
  getContradictionHistory(
    caseId: string
  ): { event: DecisionMemoryEvent; contradiction: string }[] {
    const events = this.getEventsByCaseId(caseId);
    const history: { event: DecisionMemoryEvent; contradiction: string }[] = [];

    events.forEach((event) => {
      event.contradictionKeys.forEach((key) => {
        history.push({ event, contradiction: key });
      });
    });

    return history;
  }

  /**
   * Get open commitments for a case
   */
  getOpenCommitments(caseId: string): CommitmentRecord[] {
    const commitments = this.readFile<CommitmentRecord[]>(COMMITMENTS_FILE);
    return commitments.filter(
      (c) =>
        c.caseId === caseId &&
        c.verificationStatus !== "verified" &&
        c.verificationStatus !== "failed" &&
        c.verificationStatus !== "abandoned"
    );
  }

  /**
   * Get verifications due for a case
   */
  getVerificationDue(caseId: string, beforeDate: string): CommitmentRecord[] {
    const commitments = this.readFile<CommitmentRecord[]>(COMMITMENTS_FILE);
    return commitments.filter(
      (c) =>
        c.caseId === caseId &&
        c.verificationDueAt &&
        c.verificationDueAt <= beforeDate &&
        c.verificationStatus === "pending"
    );
  }

  /**
   * Record a contradiction definition
   */
  defineContradiction(def: ContradictionDefinition): boolean {
    try {
      const contradictions = this.readFile<ContradictionDefinition[]>(
        CONTRADICTIONS_FILE
      );
      const exists = contradictions.some((c) => c.key === def.key);
      if (!exists) {
        contradictions.push(def);
        fs.writeFileSync(
          CONTRADICTIONS_FILE,
          JSON.stringify(contradictions, null, 2)
        );
      }
      return true;
    } catch (error) {
      console.error("Failed to define contradiction:", error);
      return false;
    }
  }

  /**
   * Record an evidence gap definition
   */
  defineEvidenceGap(def: EvidenceGapDefinition): boolean {
    try {
      const gaps = this.readFile<EvidenceGapDefinition[]>(EVIDENCE_GAPS_FILE);
      const exists = gaps.some((g) => g.key === def.key);
      if (!exists) {
        gaps.push(def);
        fs.writeFileSync(EVIDENCE_GAPS_FILE, JSON.stringify(gaps, null, 2));
      }
      return true;
    } catch (error) {
      console.error("Failed to define evidence gap:", error);
      return false;
    }
  }

  /**
   * Record a commitment
   */
  recordCommitment(commitment: CommitmentRecord): boolean {
    try {
      const commitments = this.readFile<CommitmentRecord[]>(COMMITMENTS_FILE);
      commitments.push(commitment);
      fs.writeFileSync(
        COMMITMENTS_FILE,
        JSON.stringify(commitments, null, 2)
      );
      return true;
    } catch (error) {
      console.error("Failed to record commitment:", error);
      return false;
    }
  }

  /**
   * Update commitment verification status
   */
  updateCommitmentStatus(
    commitmentId: string,
    status: CommitmentRecord["verificationStatus"]
  ): boolean {
    try {
      const commitments = this.readFile<CommitmentRecord[]>(COMMITMENTS_FILE);
      const commitment = commitments.find((c) => c.commitmentId === commitmentId);
      if (commitment) {
        commitment.verificationStatus = status;
        fs.writeFileSync(
          COMMITMENTS_FILE,
          JSON.stringify(commitments, null, 2)
        );
        return true;
      }
      return false;
    } catch (error) {
      console.error("Failed to update commitment status:", error);
      return false;
    }
  }

  /**
   * Record a consequence
   */
  recordConsequence(consequence: ConsequenceRecord): boolean {
    try {
      const consequences = this.readFile<ConsequenceRecord[]>(
        CONSEQUENCES_FILE
      );
      consequences.push(consequence);
      fs.writeFileSync(
        CONSEQUENCES_FILE,
        JSON.stringify(consequences, null, 2)
      );
      return true;
    } catch (error) {
      console.error("Failed to record consequence:", error);
      return false;
    }
  }

  /**
   * Query memory with multiple filters
   */
  query(query: MemoryQuery): MemoryQueryResult {
    const events = this.readFile<DecisionMemoryEvent[]>(EVENTS_FILE);
    const contradictions = this.readFile<ContradictionDefinition[]>(
      CONTRADICTIONS_FILE
    );
    const evidenceGaps = this.readFile<EvidenceGapDefinition[]>(
      EVIDENCE_GAPS_FILE
    );
    const commitments = this.readFile<CommitmentRecord[]>(COMMITMENTS_FILE);
    const consequences = this.readFile<ConsequenceRecord[]>(CONSEQUENCES_FILE);

    let filteredEvents = events;

    if (query.caseId) {
      filteredEvents = filteredEvents.filter((e) => e.caseId === query.caseId);
    }
    if (query.productCode) {
      filteredEvents = filteredEvents.filter(
        (e) => e.productCode === query.productCode
      );
    }
    if (query.eventTypes && query.eventTypes.length > 0) {
      filteredEvents = filteredEvents.filter((e) =>
        query.eventTypes!.includes(e.eventType)
      );
    }
    if (query.timeRange) {
      filteredEvents = filteredEvents.filter(
        (e) =>
          e.timestamp >= query.timeRange!.from &&
          e.timestamp <= query.timeRange!.to
      );
    }

    const relatedContradictions = new Set<string>();
    filteredEvents.forEach((e) => {
      e.contradictionKeys.forEach((k) => relatedContradictions.add(k));
    });
    if (query.contradictionKeys && query.contradictionKeys.length > 0) {
      relatedContradictions.forEach((k) => {
        if (!query.contradictionKeys!.includes(k)) {
          relatedContradictions.delete(k);
        }
      });
    }

    const resultContradictions = contradictions.filter((c) =>
      relatedContradictions.has(c.key)
    );
    const resultEvidenceGaps = evidenceGaps;
    const resultCommitments = commitments;
    const resultConsequences = consequences;

    return {
      events: filteredEvents,
      contradictions: resultContradictions,
      evidenceGaps: resultEvidenceGaps,
      commitments: resultCommitments,
      consequences: resultConsequences,
      patternsDetected: Array.from(relatedContradictions),
    };
  }

  /**
   * Get statistics about the memory store
   */
  getStats(): {
    totalEvents: number;
    uniqueCases: number;
    uniqueProducts: number;
    totalCommitments: number;
    openCommitments: number;
    totalConsequences: number;
  } {
    const events = this.readFile<DecisionMemoryEvent[]>(EVENTS_FILE);
    const commitments = this.readFile<CommitmentRecord[]>(COMMITMENTS_FILE);
    const consequences = this.readFile<ConsequenceRecord[]>(CONSEQUENCES_FILE);

    const uniqueCases = new Set(events.map((e) => e.caseId)).size;
    const uniqueProducts = new Set(events.map((e) => e.productCode)).size;
    const openCommitments = commitments.filter(
      (c) =>
        c.verificationStatus !== "verified" &&
        c.verificationStatus !== "failed" &&
        c.verificationStatus !== "abandoned"
    ).length;

    return {
      totalEvents: events.length,
      uniqueCases,
      uniqueProducts,
      totalCommitments: commitments.length,
      openCommitments,
      totalConsequences: consequences.length,
    };
  }

  private readFile<T>(filePath: string): T {
    try {
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, "utf-8");
        return JSON.parse(content);
      }
      return [] as any;
    } catch (error) {
      console.error(`Failed to read ${filePath}:`, error);
      return [] as any;
    }
  }
}

export default new DecisionMemoryStore();
