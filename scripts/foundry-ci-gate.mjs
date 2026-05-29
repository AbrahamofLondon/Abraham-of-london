#!/usr/bin/env node
/**
 * scripts/foundry-ci-gate.mjs
 *
 * Foundry CI Gate — thin runner for the /api/admin/intelligence-foundry/ci-gate endpoint.
 * Exits 1 when the gate is blocked; exits 0 when clear.
 *
 * Environment variables:
 *   FOUNDRY_BASE_URL   — base URL of the deployed app (e.g. https://app.example.com)
 *   FOUNDRY_CI_API_KEY — bearer token configured on the server (FOUNDRY_CI_API_KEY env var)
 *
 * Usage (local):
 *   FOUNDRY_BASE_URL=http://localhost:3000 FOUNDRY_CI_API_KEY=secret node scripts/foundry-ci-gate.mjs
 *
 * Usage (curl equivalent):
 *   curl -s -X POST https://app.example.com/api/admin/intelligence-foundry/ci-gate \
 *     -H "Authorization: Bearer $FOUNDRY_CI_API_KEY" | jq .
 *
 * GitHub Actions example:
 *   - name: Foundry CI gate
 *     env:
 *       FOUNDRY_BASE_URL: ${{ vars.FOUNDRY_BASE_URL }}
 *       FOUNDRY_CI_API_KEY: ${{ secrets.FOUNDRY_CI_API_KEY }}
 *     run: node scripts/foundry-ci-gate.mjs
 *
 * Response JSON (on success):
 *   {
 *     "ok": true,
 *     "block": false,
 *     "criticalUnresolved": 0,
 *     "productHealth": { "red": 0, "amber": 3, "green": 8, "grey": 1, "releaseBlockers": 0 },
 *     "message": "CI gate clear. No blocking runs or RED product surfaces."
 *   }
 *
 * Response JSON (blocked):
 *   {
 *     "ok": true,
 *     "block": true,
 *     "criticalUnresolved": 2,
 *     "productHealth": { "red": 1, "amber": 2, "green": 7, "grey": 2, "releaseBlockers": 1 },
 *     "message": "CI gate blocked: 2 unresolved CRITICAL/HIGH run(s), 1 RED product surface(s)."
 *   }
 */

const baseUrl  = process.env.FOUNDRY_BASE_URL?.replace(/\/$/, "") ?? "http://localhost:3000";
const apiKey   = process.env.FOUNDRY_CI_API_KEY ?? "";
const endpoint = `${baseUrl}/api/admin/intelligence-foundry/ci-gate`;

const RESET  = "\x1b[0m";
const RED    = "\x1b[31m";
const GREEN  = "\x1b[32m";
const YELLOW = "\x1b[33m";
const BOLD   = "\x1b[1m";
const DIM    = "\x1b[2m";

function print(color, ...args) {
  console.log(color, ...args, RESET);
}

async function run() {
  print(DIM, `[foundry-ci-gate] POST ${endpoint}`);

  const headers = { "Content-Type": "application/json" };
  if (apiKey) {
    headers["Authorization"] = `Bearer ${apiKey}`;
  } else {
    print(YELLOW, "[foundry-ci-gate] WARN: FOUNDRY_CI_API_KEY not set — request will fail unless server has no key configured.");
  }

  let res;
  try {
    res = await fetch(endpoint, { method: "POST", headers });
  } catch (err) {
    print(RED, `[foundry-ci-gate] NETWORK ERROR: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }

  if (res.status === 401) {
    print(RED, "[foundry-ci-gate] AUTH FAILED: Invalid or missing bearer token. Set FOUNDRY_CI_API_KEY.");
    process.exit(1);
  }

  if (res.status === 405) {
    print(RED, "[foundry-ci-gate] DEPRECATED: Server rejected GET — this script uses POST correctly. Check server version.");
    process.exit(1);
  }

  let data;
  try {
    data = await res.json();
  } catch {
    print(RED, `[foundry-ci-gate] PARSE ERROR: Server returned non-JSON (status ${res.status}).`);
    process.exit(1);
  }

  if (!data.ok) {
    print(RED, `[foundry-ci-gate] SERVER ERROR: ${data.error ?? "unknown"}`);
    process.exit(1);
  }

  // ── Print gate result ──────────────────────────────────────────────────────

  const { block, criticalUnresolved, productHealth, message } = data;

  console.log();
  if (block) {
    print(RED + BOLD, "  ✗  CI GATE BLOCKED");
  } else {
    print(GREEN + BOLD, "  ✓  CI GATE CLEAR");
  }

  console.log();
  print(DIM, "  Message:", message ?? "(no message)");
  console.log();

  // Run health
  print(DIM, `  Unresolved CRITICAL/HIGH runs: ${criticalUnresolved ?? "—"}`);

  // Product health breakdown
  if (productHealth) {
    const { red, amber, green, grey, releaseBlockers } = productHealth;
    print(DIM, `  Product surfaces — GREEN: ${green}  AMBER: ${amber}  RED: ${red}  GREY: ${grey}`);
    if (releaseBlockers > 0) {
      print(RED, `  Release blockers: ${releaseBlockers} RED product surface(s)`);
    }
  }

  console.log();

  if (block) {
    print(RED, "  Resolve the issues above before deploying.");
    console.log();
    process.exit(1);
  }

  process.exit(0);
}

run().catch((err) => {
  console.error("[foundry-ci-gate] Unexpected error:", err);
  process.exit(1);
});
