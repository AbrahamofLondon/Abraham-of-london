#!/usr/bin/env node
/**
 * _audit_admin_shell.mjs — Admin Shell Coverage Audit
 *
 * Identifies pages router admin pages NOT using AdminLayout.
 * Provides analysis and recommended action for each.
 *
 * Run: node _audit_admin_shell.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname);

function walkDir(dirPath) {
  const files = [];
  if (!fs.existsSync(dirPath)) return files;
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      if (!entry.name.startsWith(".") && entry.name !== "node_modules") files.push(...walkDir(full));
    } else if (entry.name.endsWith(".tsx")) {
      files.push(full);
    }
  }
  return files;
}

// Load navigation registry
const navPath = path.join(ROOT, "lib/admin/admin-navigation.ts");
const navContent = fs.readFileSync(navPath, "utf-8");
const activeNavHrefs = [];
const navItemRegex = /href:\s*"([^"]+)"/g;
let match;
while ((match = navItemRegex.exec(navContent)) !== null) {
  activeNavHrefs.push(match[1]);
}

// Scan pages router admin files
const pagesAdminFiles = walkDir(path.join(ROOT, "pages/admin"));

console.log("═══════════════════════════════════════════════");
console.log("  ADMIN SHELL COVERAGE AUDIT");
console.log("═══════════════════════════════════════════════\n");

const uncovered = [];

for (const file of pagesAdminFiles) {
  const rel = path.relative(ROOT, file);
  const parts = rel.replace(/\\/g, "/").split("/");
  
  // Determine if this is a page entry point
  const isTopLevelPage = parts.length === 3 && parts[2].endsWith(".tsx");
  const isSubIndex = parts.length === 4 && parts[3] === "index.tsx";
  const isOutboundPage = parts.length === 4 && parts[2] === "outbound" && parts[3].endsWith(".tsx");
  const isIntelligencePage = parts.length === 4 && parts[2] === "intelligence" && parts[3].endsWith(".tsx");
  
  if (!isTopLevelPage && !isSubIndex && !isOutboundPage && !isIntelligencePage) continue;
  
  const content = fs.readFileSync(file, "utf-8");
  const hasAdminLayout = content.includes("AdminLayout");
  const hasAppAdminShell = content.includes("AppAdminShell");
  const hasRequireAdmin = content.includes("requireAdminPage");
  const hasPublicLayout = content.includes('from "@/components/Layout"') || content.includes("from '@/components/Layout'");
  const isRedirect = content.includes("redirect:") && content.includes("destination:");
  const hasOwnShell = content.includes("function Shell") || content.includes("const Shell");
  
  let route = "/" + rel.replace(/\\/g, "/").replace(/^pages\/admin\//, "admin/").replace(/\.tsx$/, "").replace(/\/index$/, "");
  const inNav = activeNavHrefs.includes(route);
  
  const covered = hasAdminLayout || hasAppAdminShell;
  
  if (covered) {
    console.log(`  ✓ ${rel.padEnd(60)} ${route}`);
  } else {
    console.log(`  ✗ ${rel.padEnd(60)} ${route}`);
    uncovered.push({ file: rel, route, inNav, hasRequireAdmin, hasPublicLayout, isRedirect, hasOwnShell, content });
  }
}

console.log("\n\n═══════════════════════════════════════════════");
console.log("  UNCOVERED PAGES — ANALYSIS");
console.log("═══════════════════════════════════════════════\n");

for (const u of uncovered) {
  console.log(`FILE: ${u.file}`);
  console.log(`Route: ${u.route}`);
  console.log(`In navigation: ${u.inNav}`);
  console.log(`requireAdmin: ${u.hasRequireAdmin}`);
  console.log(`public Layout: ${u.hasPublicLayout}`);
  console.log(`Is redirect: ${u.isRedirect}`);
  console.log(`Has own Shell: ${u.hasOwnShell}`);
  
  // Determine classification
  if (u.isRedirect) {
    console.log(`Classification: LEGACY REDIRECT`);
    console.log(`Recommended action: Document as intentionally excluded — legacy redirect to ${u.route === "/admin/access-revoke" ? "/admin/access-keys" : "unknown"}. No shell needed.`);
  } else if (u.route === "/admin/login") {
    console.log(`Classification: AUTH PAGE (pre-auth)`);
    console.log(`Recommended action: Document as intentionally excluded — login page is pre-auth, cannot use AdminLayout (which requires auth). Uses its own minimal shell.`);
  } else if (u.hasOwnShell) {
    console.log(`Classification: CUSTOM SHELL (intentional)`);
    console.log(`Recommended action: Document as intentionally excluded — has its own security-isolated shell.`);
  } else {
    console.log(`Classification: NEEDS WRAPPING`);
    console.log(`Recommended action: Wrap with AdminLayout.`);
  }
  console.log("");
}

// Summary
console.log("═══════════════════════════════════════════════");
console.log("  SUMMARY");
console.log("═══════════════════════════════════════════════\n");

const totalPages = pagesAdminFiles.filter(f => {
  const rel = path.relative(ROOT, f);
  const parts = rel.replace(/\\/g, "/").split("/");
  return (parts.length === 3 && parts[2].endsWith(".tsx")) ||
         (parts.length === 4 && (parts[3] === "index.tsx" || parts[2] === "outbound" || parts[2] === "intelligence"));
}).length;

console.log(`  Total admin page files: ${totalPages}`);
console.log(`  Covered by AdminLayout: ${totalPages - uncovered.length}`);
console.log(`  Uncovered: ${uncovered.length}`);
console.log(`  Coverage: ${Math.round(((totalPages - uncovered.length) / totalPages) * 100)}%\n`);

for (const u of uncovered) {
  if (u.isRedirect) {
    console.log(`  ✅ ${u.route} — LEGACY REDIRECT (intentionally excluded)`);
  } else if (u.route === "/admin/login") {
    console.log(`  ✅ ${u.route} — AUTH PAGE (intentionally excluded, pre-auth)`);
  } else if (u.hasOwnShell) {
    console.log(`  ✅ ${u.route} — CUSTOM SHELL (intentionally excluded, security-isolated)`);
  } else {
    console.log(`  ❌ ${u.route} — NEEDS WRAPPING`);
  }
}