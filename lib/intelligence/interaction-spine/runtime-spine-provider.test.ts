/**
 * lib/intelligence/interaction-spine/runtime-spine-provider.test.ts
 *
 * §3 durability proof through the ACTUAL provider (not the in-memory stand-in): set
 * INTERACTION_STORE_PATH to a real temp file, drive the live binding function through
 * resolveRuntimeSpine, then reopen a fresh SQLite store on the same file and confirm
 * the twin survived on disk. This proves the on-switch persists durably end-to-end,
 * and that with the env unset the provider honestly reports the deploy boundary.
 */

import { describe, it, expect, afterAll } from "vitest";
import os from "node:os";
import path from "node:path";
import fs from "node:fs";
import { recordPlaybookRunInteraction, resolveTenantCase } from "./runtime-binding";
import { resolveRuntimeSpine, isDurableRuntimeConfigured } from "./runtime-spine-provider";
import { getStrategicTwin } from "./product-interaction-spine";
import { isMappedProduct } from "./product-interaction-mappers";

const dbFile = path.join(os.tmpdir(), `aol-onswitch-${Date.now()}.db`);
afterAll(() => { try { fs.unlinkSync(dbFile); } catch { /* ignore */ } delete process.env.INTERACTION_STORE_PATH; });

describe("§3 durable on-switch through the runtime provider", () => {
  it("reports the deploy boundary when INTERACTION_STORE_PATH is unset", async () => {
    delete process.env.INTERACTION_STORE_PATH;
    expect(isDurableRuntimeConfigured()).toBe(false);
    expect(await resolveRuntimeSpine("case_x")).toBeNull();
  });

  it("persists the twin to a real SQLite file that survives a fresh reopen", async () => {
    process.env.INTERACTION_STORE_PATH = dbFile;
    expect(isDurableRuntimeConfigured()).toBe(true);
    const tc = resolveTenantCase({ subjectId: "durable-user" })!;

    const out = await recordPlaybookRunInteraction(resolveRuntimeSpine, {
      productCode: "drift_detection_framework",
      tenantId: tc.tenantId,
      caseId: tc.caseId,
      runId: "durable-run-1",
      result: { posture: "DRIFTING", overallSeverity: "HIGH", score: 30, contradictions: [{ ref: "policy drift", detail: "unreviewed change" }], evidenceGaps: ["change log"] },
    });
    expect(out.bound).toBe(true);
    expect(out.twinVersion).toBe(1);

    // reopen a brand-new store on the SAME file (fresh connection) — durability proof
    const { createSqliteInteractionStore } = await import("./sqlite-interaction-store");
    const fresh = createSqliteInteractionStore(dbFile);
    const twin = getStrategicTwin({ store: fresh, isCanonicalProduct: isMappedProduct }, tc.tenantId, tc.caseId);
    expect(twin).not.toBeNull();
    expect(twin!.version).toBe(1);
    expect(Object.keys(twin!.contradictions)).toContain("policy_drift");
    fresh.close();
  });
});
