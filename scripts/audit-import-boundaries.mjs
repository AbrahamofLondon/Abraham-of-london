#!/usr/bin/env node
/**
 * scripts/audit-import-boundaries.mjs
 *
 * Client/server import boundary auditor.
 *
 * Fails on:
 *   1. pages/** files with runtime imports of server-only modules
 *      (directly or through their static import graph)
 *   2. components/** files importing lib/prisma, lib/db, lib/server, lib/mail,
 *      fs, or @react-email
 *   3. App Router page.tsx client components importing broad barrels known to
 *      include server exports
 *   4. app/actions/** top-level imports of server-heavy modules
 *   5. Test files (*.test.*, *.spec.*) under pages/ or app/
 *   6. Production pages importing from __tests__ or *.test.*
 */

import { existsSync, readFileSync, readdirSync, statSync } from "fs";
import { dirname, extname, join, relative, resolve } from "path";

const ROOT = new URL("..", import.meta.url).pathname.replace(/\/$/, "");

function walk(dir, extensions = [".ts", ".tsx"]) {
  const results = [];
  if (!existsSync(dir)) return results;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      results.push(...walk(full, extensions));
    } else if (extensions.includes(extname(full))) {
      results.push(full);
    }
  }
  return results;
}

function readLines(filePath) {
  try {
    return readFileSync(filePath, "utf8").split("\n");
  } catch {
    return [];
  }
}

function isTestFile(filePath) {
  return (
    filePath.includes(".test.") ||
    filePath.includes(".spec.") ||
    filePath.includes("__tests__")
  );
}

function isTopLevelRuntimeImport(line) {
  return /^import\s+(?!type\s)/.test(line.trim());
}

function hasServerOnlyDirective(filePath) {
  return readLines(filePath).some(
    (line) => line.includes('import "server-only"') || line.includes("import 'server-only'"),
  );
}

const SERVER_PATTERNS = [
  /@\/lib\/prisma(?!\.d\.ts)/,
  /@\/lib\/db(?!\w)/,
  /@\/lib\/server\//,
  /@\/lib\/mail(?!\w)/,
  /@react-email\//,
  /^['"]server-only['"]/,
  /from ['"]server-only['"]/,
  /\bfs(?:\/promises)?['"]$/,
  /@\/lib\/alignment\/evidence-loader/,
  /@\/lib\/product\/financial-exposure-persistence/,
];

const ACTION_HEAVY_PATTERNS = [
  /@\/lib\/prisma/,
  /@\/lib\/db(?!\w)/,
  /@\/lib\/mail(?!\w)/,
  /@react-email\//,
  /@\/lib\/server\//,
  /@\/lib\/pdf\/registry/,
  /@neondatabase\/serverless/,
  /from ['"](?:child_process|path|fs|fs\/promises)['"]/,
];

function matchesServerPattern(line) {
  return SERVER_PATTERNS.some((pattern) => pattern.test(line));
}

function parseStaticRuntimeImports(filePath) {
  return readLines(filePath)
    .map((line) => line.trim())
    .filter((line) => isTopLevelRuntimeImport(line))
    .map((line) => {
      const match =
        line.match(/from\s+["']([^"']+)["']/) ??
        line.match(/^import\s+["']([^"']+)["']/);
      return match?.[1] ?? null;
    })
    .filter(Boolean);
}

function resolveLocalImport(fromFile, specifier) {
  if (!specifier.startsWith("@/") && !specifier.startsWith(".")) return null;
  const base = specifier.startsWith("@/")
    ? join(ROOT, specifier.slice(2))
    : resolve(dirname(fromFile), specifier);
  const candidates = [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    join(base, "index.ts"),
    join(base, "index.tsx"),
  ];
  return candidates.find((candidate) => existsSync(candidate)) ?? null;
}

function findServerOnlyReachability(entryFile) {
  const visited = new Set();
  const stack = [{ filePath: entryFile, chain: [entryFile] }];

  while (stack.length) {
    const current = stack.pop();
    if (!current || visited.has(current.filePath)) continue;
    visited.add(current.filePath);

    if (current.filePath !== entryFile && hasServerOnlyDirective(current.filePath)) {
      return current.chain;
    }

    for (const specifier of parseStaticRuntimeImports(current.filePath)) {
      const resolved = resolveLocalImport(current.filePath, specifier);
      if (resolved) {
        stack.push({
          filePath: resolved,
          chain: [...current.chain, resolved],
        });
      }
    }
  }

  return null;
}

const violations = [];

function fail(filePath, lineNo, message) {
  const rel = relative(ROOT, filePath).replace(/\\/g, "/");
  violations.push({ file: rel, line: lineNo, message });
}

const pagesFiles = walk(join(ROOT, "pages"));
const appFiles = walk(join(ROOT, "app"));

for (const filePath of [...pagesFiles, ...appFiles]) {
  if (isTestFile(filePath)) {
    fail(filePath, 0, "Test file found under pages/ or app/ — move to lib/** or __tests__/");
  }
}

const pageComponentFiles = pagesFiles.filter(
  (filePath) => !filePath.includes(`${join(ROOT, "pages", "api")}`) && !isTestFile(filePath),
);

for (const filePath of pageComponentFiles) {
  const lines = readLines(filePath);
  lines.forEach((line, index) => {
    if (isTopLevelRuntimeImport(line) && matchesServerPattern(line)) {
      fail(
        filePath,
        index + 1,
        `Pages Router component has top-level server import: ${line.trim().slice(0, 80)}`,
      );
    }
  });

  const chain = findServerOnlyReachability(filePath);
  if (chain) {
    fail(
      filePath,
      0,
      `Pages Router static graph reaches server-only module: ${chain
        .map((item) => relative(ROOT, item).replace(/\\/g, "/"))
        .join(" -> ")}`,
    );
  }
}

const componentFiles = walk(join(ROOT, "components")).filter((filePath) => !isTestFile(filePath));

for (const filePath of componentFiles) {
  const lines = readLines(filePath);
  lines.forEach((line, index) => {
    if (isTopLevelRuntimeImport(line) && matchesServerPattern(line)) {
      fail(
        filePath,
        index + 1,
        `Component imports server module: ${line.trim().slice(0, 80)}`,
      );
    }
  });
}

const knownServerBarrels = [
  "@/lib/integrations",
  "@/lib/db",
  "@/lib/prisma",
  "@/lib/mail",
  "@/lib/server/",
];

const appPageFiles = appFiles.filter((filePath) => filePath.endsWith("page.tsx") || filePath.endsWith("page.ts"));

for (const filePath of appPageFiles) {
  const lines = readLines(filePath);
  const isClientComponent = lines.slice(0, 3).some((line) => line.includes('"use client"'));
  if (!isClientComponent) continue;

  lines.forEach((line, index) => {
    if (!isTopLevelRuntimeImport(line)) return;
    if (knownServerBarrels.some((barrel) => line.includes(barrel))) {
      fail(
        filePath,
        index + 1,
        `"use client" page imports server barrel: ${line.trim().slice(0, 80)}`,
      );
    }
  });
}

const appActionFiles = walk(join(ROOT, "app", "actions")).filter((filePath) => !isTestFile(filePath));

for (const filePath of appActionFiles) {
  const lines = readLines(filePath);
  lines.forEach((line, index) => {
    if (!isTopLevelRuntimeImport(line)) return;
    if (ACTION_HEAVY_PATTERNS.some((pattern) => pattern.test(line))) {
      fail(
        filePath,
        index + 1,
        `Server action has top-level heavy import: ${line.trim().slice(0, 80)}`,
      );
    }
  });
}

const allProductionFiles = [...pagesFiles, ...appFiles, ...componentFiles].filter(
  (filePath) => !isTestFile(filePath),
);

for (const filePath of allProductionFiles) {
  const lines = readLines(filePath);
  lines.forEach((line, index) => {
    if (
      (isTopLevelRuntimeImport(line) || /await\s+import\(/.test(line)) &&
      (line.includes(".test.") || line.includes(".spec.") || line.includes("__tests__"))
    ) {
      fail(
        filePath,
        index + 1,
        `Production file imports test module: ${line.trim().slice(0, 80)}`,
      );
    }
  });
}

if (violations.length === 0) {
  console.log("✓ audit-import-boundaries: no violations found");
  process.exit(0);
}

console.error(`\n✗ audit-import-boundaries: ${violations.length} violation(s) found\n`);
for (const violation of violations) {
  const loc = violation.line > 0 ? `:${violation.line}` : "";
  console.error(`  ${violation.file}${loc}\n    → ${violation.message}\n`);
}
process.exit(1);
