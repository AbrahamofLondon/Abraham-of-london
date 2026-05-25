/**
 * Canary: No direct Prisma access in Foundry API routes or utility modules.
 *
 * Only the repository (research-run-repository.ts) may import prisma.server.
 * If a route imports prisma directly, it bypasses honesty enforcement, audit
 * events, and state machine checks.
 */

import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

const PROJECT_ROOT = path.resolve(__dirname, "../../..");

function readFile(p: string): string {
  return fs.readFileSync(p, "utf-8");
}

function findTsFiles(dir: string, results: string[] = []): string[] {
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      findTsFiles(full, results);
    } else if (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx")) {
      results.push(full);
    }
  }
  return results;
}

const APPROVED_PRISMA_CONSUMERS = new Set([
  path.join(PROJECT_ROOT, "lib", "research", "research-run-repository.ts"),
  path.join(PROJECT_ROOT, "lib", "research", "finding-repository.ts"),
  path.join(PROJECT_ROOT, "lib", "research", "action-brief-exporter.ts"),
]);

const FOUNDRY_ROUTE_DIR = path.join(PROJECT_ROOT, "app", "api", "admin", "intelligence-foundry");
const FOUNDRY_LIB_DIR = path.join(PROJECT_ROOT, "lib", "research");

describe("Canary: No direct Prisma in Foundry API routes", () => {
  it("no Foundry API route imports prisma directly", () => {
    const files = findTsFiles(FOUNDRY_ROUTE_DIR);
    const violations: string[] = [];

    for (const file of files) {
      if (APPROVED_PRISMA_CONSUMERS.has(file)) continue;
      const content = readFile(file);
      if (content.includes("from \"@/lib/prisma.server\"") || content.includes("from '@/lib/prisma.server'")) {
        violations.push(path.relative(PROJECT_ROOT, file));
      }
    }

    expect(violations, `These Foundry routes import prisma directly (use repository instead):\n${violations.join("\n")}`).toEqual([]);
  });

  it("no Foundry lib file imports prisma except approved consumers", () => {
    const files = findTsFiles(FOUNDRY_LIB_DIR);
    const violations: string[] = [];

    for (const file of files) {
      if (APPROVED_PRISMA_CONSUMERS.has(file)) continue;
      const content = readFile(file);
      if (content.includes("from \"@/lib/prisma.server\"") || content.includes("from '@/lib/prisma.server'")) {
        violations.push(path.relative(PROJECT_ROOT, file));
      }
    }

    expect(violations, `These Foundry lib files import prisma directly (only repository may):\n${violations.join("\n")}`).toEqual([]);
  });
});
