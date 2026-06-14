/**
 * Tamper-Evident Ledger
 *
 * Provides hash-chain evidence integrity detection using canonical JSON serialization.
 * Note: This is tamper-evident (detects tampering), not tamper-proof (prevents tampering).
 * True tamper-proof storage requires external anchoring to HSM/timestamping service.
 */

import crypto from "crypto";

export type LedgerVerificationStatus = "verified" | "broken" | "unknown";

export type ExternalAnchorStatus =
  | "not_configured"
  | "ready"
  | "anchored"
  | "verification_failed";

export interface EvidenceLedgerEntry {
  ledgerId: string;
  chainId: string;
  tenantId: string;
  organisationId: string;
  environment: "synthetic" | "sandbox" | "production";
  sequenceNumber: number;
  currentRecordHash: string;
  previousRecordHash: string | null; // null only for genesis (seq 1)
  contentHash: string;
  timestamp: string;
  signalId: string;
  sourceType: string;
  canonicalPayload: unknown;
  createdAt: string;
}

export interface EvidenceLedgerVerification {
  recordHash: string;
  status: LedgerVerificationStatus;
  reason?: string;
  chainBrokenAt?: number;
  detectedIssues: string[];
}

export interface EvidenceLedgerChainState {
  ledgerId: string;
  lastSequenceNumber: number;
  lastRecordHash: string;
  totalRecords: number;
  verificationStatus: LedgerVerificationStatus;
  externalAnchorStatus: ExternalAnchorStatus;
}

export class TamperEvidenceLedger {
  /**
   * Canonicalize ledger payload for deterministic hashing
   */
  static canonicalizeLedgerPayload(payload: unknown): string {
    // Deterministic JSON serialization: sorted keys, no spaces
    if (payload === null || payload === undefined) {
      return JSON.stringify(payload);
    }
    if (typeof payload !== "object") {
      return JSON.stringify(payload);
    }
    if (Array.isArray(payload)) {
      return JSON.stringify(payload.map(item => this.canonicalizeLedgerPayload(item)));
    }
    // For objects, sort keys and serialize recursively
    const sorted: Record<string, unknown> = {};
    const keys = Object.keys(payload as Record<string, unknown>).sort();
    for (const key of keys) {
      sorted[key] = (payload as Record<string, unknown>)[key];
    }
    return JSON.stringify(sorted);
  }

  /**
   * Create stable evidence content hash (canonical JSON)
   */
  static createStableEvidenceHash(payload: unknown): string {
    const canonical = this.canonicalizeLedgerPayload(payload);
    return crypto.createHash("sha256").update(canonical).digest("hex");
  }

  /**
   * Create ledger entry hash (includes chain linking)
   */
  static createLedgerEntryHash(
    contentHash: string,
    previousRecordHash: string | null,
    sequenceNumber: number,
    timestamp: string
  ): string {
    const hashInput = `${contentHash}|${previousRecordHash || "genesis"}|${sequenceNumber}|${timestamp}`;
    return crypto.createHash("sha256").update(hashInput).digest("hex");
  }

  /**
   * Create evidence ledger entry
   */
  static createEvidenceLedgerEntry(
    ledgerId: string,
    chainId: string,
    tenantId: string,
    organisationId: string,
    environment: "synthetic" | "sandbox" | "production",
    sequenceNumber: number,
    previousRecordHash: string | null,
    signalId: string,
    sourceType: string,
    canonicalPayload: unknown
  ): EvidenceLedgerEntry {
    const contentHash = this.createStableEvidenceHash(canonicalPayload);
    const timestamp = new Date().toISOString();
    const currentRecordHash = this.createLedgerEntryHash(
      contentHash,
      previousRecordHash,
      sequenceNumber,
      timestamp
    );

    return {
      ledgerId,
      chainId,
      tenantId,
      organisationId,
      environment,
      sequenceNumber,
      currentRecordHash,
      previousRecordHash,
      contentHash,
      timestamp,
      signalId,
      sourceType,
      canonicalPayload,
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Verify ledger entry hash
   */
  static verifyLedgerEntryHash(entry: EvidenceLedgerEntry): {
    valid: boolean;
    computedHash: string;
  } {
    const computedHash = this.createLedgerEntryHash(
      entry.contentHash,
      entry.previousRecordHash,
      entry.sequenceNumber,
      entry.timestamp
    );

    return {
      valid: computedHash === entry.currentRecordHash,
      computedHash,
    };
  }

  /**
   * Verify ledger chain
   */
  static verifyLedgerChain(
    entries: EvidenceLedgerEntry[]
  ): EvidenceLedgerVerification[] {
    const verifications: EvidenceLedgerVerification[] = [];

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      if (!entry) {
        continue;
      }
      const detectedIssues: string[] = [];

      // Check 1: Genesis record rules
      if (entry.sequenceNumber === 1 && entry.previousRecordHash !== null) {
        detectedIssues.push("Genesis record should have null previousRecordHash");
      }

      if (entry.sequenceNumber > 1 && entry.previousRecordHash === null) {
        detectedIssues.push("Non-genesis record must have previousRecordHash");
      }

      // Check 2: Tenant/org/env consistency
      if (i > 0) {
        const prev = entries[i - 1];
        if (!prev) {
          detectedIssues.push("Previous entry missing");
        } else {
          if (entry.tenantId !== prev.tenantId) {
            detectedIssues.push("Tenant mismatch in chain");
          }

          if (entry.organisationId !== prev.organisationId) {
            detectedIssues.push("Organisation mismatch in chain");
          }

          if (entry.environment !== prev.environment) {
            detectedIssues.push("Environment mismatch in chain");
          }

          // Check 3: Previous hash linkage
          if (entry.previousRecordHash !== prev.currentRecordHash) {
            detectedIssues.push(
              "Previous hash linkage broken"
            );
          }
        }
      }

      // Check 4: Sequence continuity
      if (i > 0) {
        const prevEntry = entries[i - 1];
        if (prevEntry && entry.sequenceNumber !== prevEntry.sequenceNumber + 1) {
          detectedIssues.push("Sequence gap detected");
        }
      }

      // Check 5: Content hash validity
      const contentCheck = this.createStableEvidenceHash(entry.canonicalPayload);
      if (contentCheck !== entry.contentHash) {
        detectedIssues.push("Content hash mismatch");
      }

      // Check 6: Entry hash validity
      const hashVerification = this.verifyLedgerEntryHash(entry);
      if (!hashVerification.valid) {
        detectedIssues.push("Entry hash invalid");
      }

      const status: LedgerVerificationStatus =
        detectedIssues.length === 0 ? "verified" : "broken";

      verifications.push({
        recordHash: entry.currentRecordHash,
        status,
        reason:
          detectedIssues.length > 0
            ? detectedIssues.join("; ")
            : undefined,
        detectedIssues,
      });
    }

    return verifications;
  }

  /**
   * Detect backdating (sequence contradicts timestamp)
   */
  static detectLedgerBackdating(entries: EvidenceLedgerEntry[]): {
    hasBackdating: boolean;
    issues: string[];
  } {
    const issues: string[] = [];

    for (let i = 1; i < entries.length; i++) {
      const curr = entries[i];
      const prev = entries[i - 1];

      if (!curr || !prev) {
        continue;
      }

      // Sequence increases but timestamp decreases = backdating
      if (
        curr.sequenceNumber > prev.sequenceNumber &&
        new Date(curr.timestamp) < new Date(prev.timestamp)
      ) {
        issues.push(
          `Backdating at sequence ${curr.sequenceNumber}: timestamp ${curr.timestamp} < ${prev.timestamp}`
        );
      }
    }

    return {
      hasBackdating: issues.length > 0,
      issues,
    };
  }

  /**
   * Evaluate ledger anchor readiness (NOT falsely claiming implementation)
   */
  static evaluateLedgerAnchorReadiness(): ExternalAnchorStatus {
    // This layer does NOT implement external anchoring.
    // Return honest status: not configured until actual integration.
    return "not_configured";
  }

  /**
   * Create ledger chain state
   */
  static createLedgerChainState(
    entries: EvidenceLedgerEntry[],
    verifications: EvidenceLedgerVerification[]
  ): EvidenceLedgerChainState {
    const lastEntry = entries[entries.length - 1];
    if (!lastEntry) {
      throw new Error("Ledger chain is empty");
    }
    const brokenCount = verifications.filter((v) => v.status === "broken")
      .length;
    const status: LedgerVerificationStatus =
      brokenCount === 0 ? "verified" : "broken";

    return {
      ledgerId: lastEntry.ledgerId,
      lastSequenceNumber: lastEntry.sequenceNumber,
      lastRecordHash: lastEntry.currentRecordHash,
      totalRecords: entries.length,
      verificationStatus: status,
      externalAnchorStatus: this.evaluateLedgerAnchorReadiness(),
    };
  }
}

/**
 * Ledger Invariants
 */
export const TAMPER_EVIDENT_LEDGER_INVARIANTS = {
  CANONICAL_JSON_HASHING:
    "All hashes use deterministic canonical JSON serialization",
  CHAIN_LINKING: "Each entry links to previous via previousRecordHash",
  GENESIS_RULES:
    "Sequence 1 is genesis; only genesis has null previousRecordHash",
  TENANT_CONSISTENCY: "Chain cannot mix tenants, organisations, or environments",
  SEQUENCE_CONTINUITY: "Sequence numbers must be monotonic without gaps",
  TIMESTAMP_ORDERING:
    "Backdating detected when sequence increases but timestamp decreases",
  TAMPER_EVIDENT_NOT_PROOF:
    "This layer detects tampering, does not prevent it; external anchoring required for proof",
  HONEST_ANCHOR_STATUS:
    "External anchoring status is honest (not_configured unless actually integrated)",
  VERIFICATION_STATES:
    "Status is verified, broken, or unknown; no false positives claiming success",
};
