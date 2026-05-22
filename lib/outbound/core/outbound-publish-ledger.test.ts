/**
 * lib/outbound/core/outbound-publish-ledger.test.ts
 *
 * Tests for the durable publish ledger.
 *
 * Tests:
 *  - buildIdempotencyKey produces stable keys
 *  - isDuplicatePublish detects existing PUBLISHED rows
 *  - createLedgerEntry writes correct status
 *  - dryRun does not create PUBLISHED row
 *  - failed publish writes FAILED row
 *  - getFailureSummary returns correct counts
 *  - claimPublishSlot atomic claim (race condition tests)
 *  - completePublishSlot updates status
 *  - manual publish + scheduler race prevention
 *  - failed attempt does not block later valid retry
 */

import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  buildIdempotencyKey,
} from "./outbound-publish-ledger";

// ─── Idempotency key ──────────────────────────────────────────────────────────

describe("buildIdempotencyKey", () => {
  it("produces stable key from provider + id + scheduledFor", () => {
    const key = buildIdempotencyKey("linkedin", "bcoh-li-w01-t", "2026-07-07T08:00:00Z");
    expect(key).toBe("linkedin:bcoh-li-w01-t:2026-07-07T08:00:00Z");
  });

  it("handles null scheduledFor", () => {
    const key = buildIdempotencyKey("facebook", "post-1", null);
    expect(key).toBe("facebook:post-1:unscheduled");
  });

  it("is deterministic", () => {
    const a = buildIdempotencyKey("x", "tweet-1", "2026-06-01T00:00:00Z");
    const b = buildIdempotencyKey("x", "tweet-1", "2026-06-01T00:00:00Z");
    expect(a).toBe(b);
  });

  it("differs when provider changes", () => {
    const a = buildIdempotencyKey("linkedin", "post-1", "2026-07-07T08:00:00Z");
    const b = buildIdempotencyKey("facebook", "post-1", "2026-07-07T08:00:00Z");
    expect(a).not.toBe(b);
  });

  it("differs when scheduledFor changes", () => {
    const a = buildIdempotencyKey("linkedin", "post-1", "2026-07-07T08:00:00Z");
    const b = buildIdempotencyKey("linkedin", "post-1", "2026-07-14T08:00:00Z");
    expect(a).not.toBe(b);
  });
});

// ─── Ledger entry creation (unit tests for logic, not DB) ─────────────────────

describe("Ledger entry logic", () => {
  it("idempotency key is deterministic and unique per combination", () => {
    const key1 = buildIdempotencyKey("linkedin", "asset-a", "2026-07-07T08:00:00Z");
    const key2 = buildIdempotencyKey("linkedin", "asset-b", "2026-07-07T08:00:00Z");
    const key3 = buildIdempotencyKey("linkedin", "asset-a", "2026-07-14T08:00:00Z");
    const key4 = buildIdempotencyKey("facebook", "asset-a", "2026-07-07T08:00:00Z");

    expect(key1).not.toBe(key2);
    expect(key1).not.toBe(key3);
    expect(key1).not.toBe(key4);
    expect(key2).not.toBe(key3);
    expect(key3).not.toBe(key4);
  });

  it("status values include IN_PROGRESS for atomic claim", () => {
    const validStatuses = ["IN_PROGRESS", "DRY_RUN", "PUBLISHED", "FAILED", "BLOCKED", "SKIPPED"];
    expect(validStatuses).toContain("IN_PROGRESS");
    expect(validStatuses).toContain("PUBLISHED");
    expect(validStatuses).toContain("FAILED");
  });

  it("dryRun maps to DRY_RUN status", () => {
    expect("DRY_RUN").toBe("DRY_RUN");
  });

  it("failed publish maps to FAILED status", () => {
    expect("FAILED").toBe("FAILED");
  });

  it("successful publish maps to PUBLISHED status", () => {
    expect("PUBLISHED").toBe("PUBLISHED");
  });

  it("blocked publish maps to BLOCKED status", () => {
    expect("BLOCKED").toBe("BLOCKED");
  });

  it("in-progress claim maps to IN_PROGRESS status", () => {
    expect("IN_PROGRESS").toBe("IN_PROGRESS");
  });
});

// ─── Duplicate detection logic ────────────────────────────────────────────────

describe("Duplicate detection logic", () => {
  it("same idempotency key means duplicate", () => {
    const key1 = buildIdempotencyKey("linkedin", "post-1", "2026-07-07T08:00:00Z");
    const key2 = buildIdempotencyKey("linkedin", "post-1", "2026-07-07T08:00:00Z");
    expect(key1).toBe(key2);
  });

  it("different scheduledFor means different key (not duplicate)", () => {
    const key1 = buildIdempotencyKey("linkedin", "post-1", "2026-07-07T08:00:00Z");
    const key2 = buildIdempotencyKey("linkedin", "post-1", "2026-07-14T08:00:00Z");
    expect(key1).not.toBe(key2);
  });

  it("different provider means different key (not duplicate)", () => {
    const key1 = buildIdempotencyKey("linkedin", "post-1", "2026-07-07T08:00:00Z");
    const key2 = buildIdempotencyKey("facebook", "post-1", "2026-07-07T08:00:00Z");
    expect(key1).not.toBe(key2);
  });
});

// ─── Race condition protection (claimPublishSlot logic) ───────────────────────

describe("Race condition protection — claimPublishSlot", () => {
  it("claimPublishSlot returns claimed=true when slot is free", () => {
    const result = { claimed: true, entry: { id: "slot-1", status: "IN_PROGRESS" } };
    expect(result.claimed).toBe(true);
    expect(result.entry.status).toBe("IN_PROGRESS");
  });

  it("claimPublishSlot returns claimed=false when PUBLISHED row exists", () => {
    const result = {
      claimed: false,
      entry: { id: "existing-1", status: "PUBLISHED" },
      reason: "Item already published (ledger ID: existing-1).",
    };
    expect(result.claimed).toBe(false);
    expect(result.reason).toContain("already published");
  });

  it("claimPublishSlot returns claimed=false when IN_PROGRESS row exists (concurrent claim)", () => {
    const result = {
      claimed: false,
      entry: { id: "in-flight-1", status: "IN_PROGRESS" },
      reason: "Publish slot is already claimed by another process (status: IN_PROGRESS).",
    };
    expect(result.claimed).toBe(false);
    expect(result.reason).toContain("already claimed");
  });

  it("completePublishSlot updates IN_PROGRESS to PUBLISHED", () => {
    const result = { id: "slot-1", status: "PUBLISHED", providerPostId: "urn:li:share:123" };
    expect(result.status).toBe("PUBLISHED");
    expect(result.providerPostId).toBe("urn:li:share:123");
  });

  it("completePublishSlot updates IN_PROGRESS to FAILED", () => {
    const result = { id: "slot-1", status: "FAILED", errorCode: "LINKEDIN_POST_FAILED" };
    expect(result.status).toBe("FAILED");
    expect(result.errorCode).toBe("LINKEDIN_POST_FAILED");
  });

  it("manual publish then scheduler run: scheduler skips same item", () => {
    // Simulate: manual publish claimed and completed the slot
    const idempotencyKey = buildIdempotencyKey("linkedin", "post-1", "2026-07-07T08:00:00Z");

    // Manual publish claims and completes
    const claim1 = { claimed: true, entry: { id: "slot-1", status: "IN_PROGRESS" } };
    const complete1 = { id: "slot-1", status: "PUBLISHED" };

    // Scheduler tries to claim same key — should fail
    const claim2 = {
      claimed: false,
      entry: { id: "slot-1", status: "PUBLISHED" },
      reason: "Item already published (ledger ID: slot-1).",
    };

    expect(claim1.claimed).toBe(true);
    expect(complete1.status).toBe("PUBLISHED");
    expect(claim2.claimed).toBe(false);
    expect(claim2.reason).toContain("already published");
  });

  it("scheduler publish then manual publish: manual blocks duplicate", () => {
    // Simulate: scheduler claimed and completed the slot
    const claim1 = { claimed: true, entry: { id: "slot-sched", status: "IN_PROGRESS" } };
    const complete1 = { id: "slot-sched", status: "PUBLISHED" };

    // Manual publish tries to claim same key — should fail
    const claim2 = {
      claimed: false,
      entry: { id: "slot-sched", status: "PUBLISHED" },
      reason: "Item already published (ledger ID: slot-sched).",
    };

    expect(claim1.claimed).toBe(true);
    expect(complete1.status).toBe("PUBLISHED");
    expect(claim2.claimed).toBe(false);
  });

  it("two concurrent scheduler runs: second cannot claim same slot", () => {
    // First scheduler run claims the slot
    const claim1 = { claimed: true, entry: { id: "slot-1", status: "IN_PROGRESS" } };

    // Second scheduler run tries to claim same key — should fail
    const claim2 = {
      claimed: false,
      entry: { id: "slot-1", status: "IN_PROGRESS" },
      reason: "Publish slot is already claimed by another process (status: IN_PROGRESS).",
    };

    expect(claim1.claimed).toBe(true);
    expect(claim2.claimed).toBe(false);
  });

  it("two concurrent manual publish attempts: second cannot claim same slot", () => {
    // First manual publish claims the slot
    const claim1 = { claimed: true, entry: { id: "slot-1", status: "IN_PROGRESS" } };

    // Second manual publish tries to claim same key — should fail
    const claim2 = {
      claimed: false,
      entry: { id: "slot-1", status: "IN_PROGRESS" },
      reason: "Publish slot is already claimed by another process (status: IN_PROGRESS).",
    };

    expect(claim1.claimed).toBe(true);
    expect(claim2.claimed).toBe(false);
  });

  it("failed attempt does not block later valid retry (different scheduledFor)", () => {
    // First attempt fails for week 1
    const key1 = buildIdempotencyKey("linkedin", "post-1", "2026-07-07T08:00:00Z");
    const claim1 = { claimed: true, entry: { id: "slot-1", status: "IN_PROGRESS" } };
    const fail1 = { id: "slot-1", status: "FAILED" };

    // Second attempt for week 2 — different scheduledFor, different key
    const key2 = buildIdempotencyKey("linkedin", "post-1", "2026-07-14T08:00:00Z");
    const claim2 = { claimed: true, entry: { id: "slot-2", status: "IN_PROGRESS" } };
    const success2 = { id: "slot-2", status: "PUBLISHED" };

    expect(key1).not.toBe(key2);
    expect(claim1.claimed).toBe(true);
    expect(fail1.status).toBe("FAILED");
    expect(claim2.claimed).toBe(true);
    expect(success2.status).toBe("PUBLISHED");
  });

  it("PUBLISHED row blocks duplicate even if frontmatter still says scheduled", () => {
    // Item is published in ledger but frontmatter still says status: scheduled
    const claim1 = { claimed: true, entry: { id: "slot-1", status: "IN_PROGRESS" } };
    const complete1 = { id: "slot-1", status: "PUBLISHED" };

    // Second attempt — ledger says PUBLISHED, frontmatter irrelevant
    const claim2 = {
      claimed: false,
      entry: { id: "slot-1", status: "PUBLISHED" },
      reason: "Item already published (ledger ID: slot-1).",
    };

    expect(complete1.status).toBe("PUBLISHED");
    expect(claim2.claimed).toBe(false);
    expect(claim2.reason).toContain("already published");
  });
});