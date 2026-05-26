#!/usr/bin/env node
/**
 * Fails when an App Router page directly uses useSearchParams.
 *
 * Pages must delegate query-string logic to a "use client" child component and
 * render that child inside Suspense from the server page.
 */

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { globSync } from "glob";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export function collectAppRouterSearchParamsViolations(root = ROOT) {
  const pageFiles = globSync("app/**/page.{ts,tsx}", {
    cwd: root,
    ignore: ["node_modules/**", ".next/**", ".contentlayer/**"],
  });

  const violations = [];

  for (const file of pageFiles) {
    const fullPath = path.join(root, file);
    if (!existsSync(fullPath)) continue;

    const source = readFileSync(fullPath, "utf8");
    const normalized = file.replace(/\\/g, "/");
    const importsSearchParams =
      /from\s+["']next\/navigation["'];?/.test(source) &&
      /\buseSearchParams\b/.test(source);
    const callsSearchParams = /\buseSearchParams\s*\(/.test(source);

    if (importsSearchParams || callsSearchParams) {
      violations.push(
        `${normalized}: move useSearchParams into a sibling "use client" component rendered inside Suspense`,
      );
    }
  }

  return violations;
}

export function runAppRouterSearchParamsCheck(root = ROOT) {
  const violations = collectAppRouterSearchParamsViolations(root);
  if (violations.length > 0) {
    console.error(`\n❌ [APP_ROUTER_SEARCHPARAMS] Found ${violations.length} violation(s):\n`);
    for (const violation of violations) console.error(`  - ${violation}`);
    return 1;
  }

  console.log("✅ [APP_ROUTER_SEARCHPARAMS] No App Router page directly uses useSearchParams.");
  return 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exit(runAppRouterSearchParamsCheck());
}
