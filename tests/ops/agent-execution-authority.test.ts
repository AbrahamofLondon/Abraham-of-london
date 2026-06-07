/**
 * P9 — Ops: Agent Permission Matrix Tests
 * Validates that the ops/agent-permissions.json matrix is coherent and safe.
 */

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const PERMISSIONS_PATH = join(process.cwd(), "ops", "agent-permissions.json");
const matrix = JSON.parse(readFileSync(PERMISSIONS_PATH, "utf-8"));

const VALID_CLASSIFICATIONS = [
  "allowed",
  "allowed_with_confirmation",
  "manual_only",
  "never_allowed",
  "requires_secret_access",
  "requires_browser_session",
];

// Flatten all action:classification pairs
function flattenMatrix(obj: Record<string, unknown>, prefix = ""): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (k === "_meta") continue;
    if (typeof v === "string") {
      result[prefix ? `${prefix}.${k}` : k] = v;
    } else if (typeof v === "object" && v !== null) {
      Object.assign(result, flattenMatrix(v as Record<string, unknown>, k));
    }
  }
  return result;
}

const allActions = flattenMatrix(matrix);

describe("agent-permissions.json", () => {
  it("is parseable JSON", () => {
    expect(typeof matrix).toBe("object");
    expect(matrix).not.toBeNull();
  });

  it("has _meta with version and effective date", () => {
    expect(matrix._meta).toBeDefined();
    expect(matrix._meta.version).toBeTruthy();
    expect(matrix._meta.effective).toBeTruthy();
  });

  it("all classification values are valid", () => {
    for (const [action, classification] of Object.entries(allActions)) {
      expect(
        VALID_CLASSIFICATIONS,
        `Action "${action}" has invalid classification: "${classification}"`
      ).toContain(classification);
    }
  });

  it("git.push.force is never_allowed", () => {
    expect(allActions["git.git.push.force"] ?? matrix.git?.["git.push.force"]).toBe("never_allowed");
  });

  it("env.secret.print is never_allowed", () => {
    const val = matrix.environment?.["env.secret.print"];
    expect(val).toBe("never_allowed");
  });

  it("env.secret.log is never_allowed", () => {
    const val = matrix.environment?.["env.secret.log"];
    expect(val).toBe("never_allowed");
  });

  it("stripe.webhook.create is manual_only", () => {
    const val = matrix.stripe?.["stripe.webhook.create"];
    expect(val).toBe("manual_only");
  });

  it("stripe payment actions are manual_only or never_allowed", () => {
    const paymentActions = Object.entries(matrix.payments ?? {});
    for (const [action, classification] of paymentActions) {
      expect(
        ["manual_only", "never_allowed", "allowed_with_confirmation"],
        `Payment action "${action}" should not be simply "allowed"`
      ).toContain(classification);
      expect(classification).not.toBe("allowed");
    }
  });

  it("payment.charge.execute is never_allowed", () => {
    const val = matrix.payments?.["payment.charge.execute"];
    expect(val).toBe("never_allowed");
  });

  it("prisma.migrate.deploy requires confirmation not unconditional allow", () => {
    const val = matrix.prisma?.["prisma.migrate.deploy"];
    expect(val).not.toBe("allowed");
    expect(["allowed_with_confirmation", "manual_only"]).toContain(val);
  });

  it("prisma.migrate.reset is never_allowed", () => {
    const val = matrix.prisma?.["prisma.migrate.reset"];
    expect(val).toBe("never_allowed");
  });

  it("db.truncate is never_allowed", () => {
    const val = matrix.database?.["db.truncate"];
    expect(val).toBe("never_allowed");
  });

  it("db.drop.table is never_allowed", () => {
    const val = matrix.database?.["db.drop.table"];
    expect(val).toBe("never_allowed");
  });

  it("shell.kill_process.node is never_allowed", () => {
    const val = matrix.shell?.["shell.kill_process.node"];
    expect(val).toBe("never_allowed");
  });

  it("shell.kill_process.build is never_allowed", () => {
    const val = matrix.shell?.["shell.kill_process.build"];
    expect(val).toBe("never_allowed");
  });

  it("vercel.billing.update is manual_only", () => {
    const val = matrix.vercel?.["vercel.billing.update"];
    expect(val).toBe("manual_only");
  });

  it("public.http.smoke is allowed", () => {
    const val = matrix.http?.["public.http.smoke"];
    expect(val).toBe("allowed");
  });

  it("no manual_only action is classified as allowed", () => {
    const neverShouldBeAllowed = [
      "stripe.webhook.create",
      "stripe.webhook.delete",
      "payment.charge.execute",
      "payment.refund.execute",
      "payment.payout.execute",
      "db.truncate",
      "db.drop.table",
    ];

    for (const action of neverShouldBeAllowed) {
      const [category, ...rest] = action.split(".");
      const key = rest.join(".");
      const fullKey = `${category}.${action}`;
      const val =
        (matrix[category] as Record<string, string> | undefined)?.[action] ??
        (matrix[category] as Record<string, string> | undefined)?.[fullKey];
      expect(val, `"${action}" must not be "allowed"`).not.toBe("allowed");
    }
  });
});
