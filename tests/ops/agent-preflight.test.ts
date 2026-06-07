/**
 * P9 — Ops: Agent Preflight Script Tests
 * Validates the preflight script logic without executing it as a process.
 */

import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();

describe("preflight script exists and is valid", () => {
  it("check-agent-execution-readiness.mjs exists", () => {
    const path = join(ROOT, "scripts", "check-agent-execution-readiness.mjs");
    expect(existsSync(path)).toBe(true);
  });

  it("script does not contain hard-coded secrets", () => {
    const { readFileSync } = require("node:fs");
    const path = join(ROOT, "scripts", "check-agent-execution-readiness.mjs");
    const content = readFileSync(path, "utf-8");

    // Must not contain real DB credentials, API keys, or tokens
    expect(content).not.toMatch(/neondb_owner/);
    expect(content).not.toMatch(/npg_[A-Za-z0-9]+/);
    expect(content).not.toMatch(/sk_live_/);
    expect(content).not.toMatch(/sk_test_/);
    expect(content).not.toMatch(/whsec_/);
  });

  it("script redacts DATABASE_URL before output", () => {
    const { readFileSync } = require("node:fs");
    const path = join(ROOT, "scripts", "check-agent-execution-readiness.mjs");
    const content = readFileSync(path, "utf-8");

    // Must not print full DATABASE_URL — must redact credentials
    expect(content).toMatch(/\*\*\*|redact|slice|cut/i);
  });

  it("script reports READY, READY_WITH_MANUAL_GATES, or BLOCKED", () => {
    const { readFileSync } = require("node:fs");
    const path = join(ROOT, "scripts", "check-agent-execution-readiness.mjs");
    const content = readFileSync(path, "utf-8");

    expect(content).toContain("READY");
    expect(content).toContain("BLOCKED");
    expect(content).toContain("READY_WITH_MANUAL_GATES");
  });

  it("script identifies manual gates", () => {
    const { readFileSync } = require("node:fs");
    const path = join(ROOT, "scripts", "check-agent-execution-readiness.mjs");
    const content = readFileSync(path, "utf-8");

    expect(content).toContain("stripe.webhook.create");
    expect(content).toContain("vercel.env.add");
  });
});

describe("ops directory structure", () => {
  it("agent-permissions.json exists", () => {
    expect(existsSync(join(ROOT, "ops", "agent-permissions.json"))).toBe(true);
  });

  it("agent-execution-authority.md exists", () => {
    expect(existsSync(join(ROOT, "docs", "ops", "agent-execution-authority.md"))).toBe(true);
  });

  it("agent-runbook.md exists", () => {
    expect(existsSync(join(ROOT, "docs", "ops", "agent-runbook.md"))).toBe(true);
  });
});

describe("preflight security invariants", () => {
  it("never_allowed actions include financial transactions", () => {
    const { readFileSync } = require("node:fs");
    const matrix = JSON.parse(
      readFileSync(join(ROOT, "ops", "agent-permissions.json"), "utf-8")
    );
    expect(matrix.payments?.["payment.charge.execute"]).toBe("never_allowed");
    expect(matrix.payments?.["payment.refund.execute"]).toBe("manual_only");
  });

  it("never_allowed actions include secret printing", () => {
    const { readFileSync } = require("node:fs");
    const matrix = JSON.parse(
      readFileSync(join(ROOT, "ops", "agent-permissions.json"), "utf-8")
    );
    expect(matrix.environment?.["env.secret.print"]).toBe("never_allowed");
    expect(matrix.environment?.["env.secret.log"]).toBe("never_allowed");
  });

  it("migrate deploy is not unconditionally allowed", () => {
    const { readFileSync } = require("node:fs");
    const matrix = JSON.parse(
      readFileSync(join(ROOT, "ops", "agent-permissions.json"), "utf-8")
    );
    const val = matrix.prisma?.["prisma.migrate.deploy"];
    expect(val).not.toBe("allowed");
  });

  it("Stripe dashboard actions are not allowed by agents", () => {
    const { readFileSync } = require("node:fs");
    const matrix = JSON.parse(
      readFileSync(join(ROOT, "ops", "agent-permissions.json"), "utf-8")
    );
    expect(matrix.stripe?.["stripe.webhook.create"]).toBe("manual_only");
    expect(matrix.stripe?.["stripe.dashboard.access"]).toBe("requires_browser_session");
  });
});
