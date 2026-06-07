#!/usr/bin/env node
/**
 * scripts/check-next-route-conflicts.mjs
 *
 * Scans for conflicting App Router and Pages Router API routes.
 * Next.js 16 does not permit the same route to exist in both routers.
 *
 * Exit code 0 = no conflicts.
 * Exit code 1 = conflicts found (list printed).
 */

import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const PASS = "\u2713";
const FAIL = "\u2717";

// ── Collect Pages Router API routes ──────────────────────────────────────────

const pagesApi = new Set();

function walkPages(dir, prefix) {
  const full = join(ROOT, dir);
  if (!existsSync(full)) return;
  for (const entry of readdirSync(full, { withFileTypes: true })) {
    const childPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      walkPages(childPath, prefix + "/" + entry.name);
    } else if (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx")) {
      let routePath = prefix + "/" + entry.name.replace(/\.(ts|tsx)$/, "");
      routePath = routePath.replace(/\/index$/, "");
      pagesApi.add(routePath);
    }
  }
}

walkPages("pages/api", "");

// ── Collect App Router API routes ────────────────────────────────────────────

const appApi = new Set();

function walkApp(dir, prefix) {
  const full = join(ROOT, dir);
  if (!existsSync(full)) return;
  for (const entry of readdirSync(full, { withFileTypes: true })) {
    const childPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      walkApp(childPath, prefix + "/" + entry.name);
    } else if (entry.name === "route.ts" || entry.name === "route.tsx") {
      appApi.add(prefix);
    }
  }
}

walkApp("app/api", "");

// ── Find conflicts ───────────────────────────────────────────────────────────

const conflicts = [];
for (const route of pagesApi) {
  if (appApi.has(route)) {
    conflicts.push(route);
  }
}

// ── Report ───────────────────────────────────────────────────────────────────

console.log(`\nNext.js Route Conflict Check`);
console.log(`Pages Router API routes: ${pagesApi.size}`);
console.log(`App Router API routes:   ${appApi.size}`);
console.log();

if (conflicts.length === 0) {
  console.log(`  ${PASS} No route conflicts found.`);
  process.exit(0);
}

console.log(`  ${FAIL} ${conflicts.length} route conflict(s) found:\n`);
for (const route of conflicts) {
  console.log(`    Route: ${route}`);
  console.log(`      pages/api${route}.ts`);
  console.log(`      app/api${route}/route.ts`);
  console.log();
}

process.exit(1);
