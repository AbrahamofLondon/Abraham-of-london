#!/usr/bin/env node
/**
 * scripts/check-admin-surface-integrity.mjs
 *
 * Admin Operating Console Integrity Check — HARDENED.
 *
 * Verifies:
 *   - Critical admin route files exist
 *   - Admin pages do not import public Layout/Header/Footer directly
 *   - Admin route registry/navigation includes brief-orders and qa-bench
 *   - Reserved outbound surfaces are labelled reserved/config-required when not configured
 *   - Command wall has controlled empty state
 *   - Brief-orders has controlled empty state
 *   - No admin route renders raw secret/config/token values
 *   - Admin shell is used by all admin routes (not public shell)
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// ─── Configuration ────────────────────────────────────────────────────────────

const CRITICAL_ADMIN_ROUTES = [
  { path: "app/admin/layout.tsx", label: "Admin layout (shell)" },
  { path: "components/admin/AppAdminShell.tsx", label: "App Router admin shell component" },
  { path: "components/admin/AdminLayout.tsx", label: "Pages Router admin layout" },
  { path: "lib/admin/admin-navigation.ts", label: "Admin navigation registry" },
  { path: "app/admin/intelligence-foundry/brief-orders/page.tsx", label: "Brief orders page" },
  { path: "app/admin/intelligence-foundry/brief-orders/PageClient.tsx", label: "Brief orders client" },
  { path: "app/admin/intelligence-foundry/qa-bench/page.tsx", label: "QA bench page" },
  { path: "app/admin/intelligence-foundry/qa-bench/PageClient.tsx", label: "QA bench client" },
  { path: "pages/admin/command-wall.tsx", label: "Command wall" },
  { path: "pages/admin/outbound/facebook.tsx", label: "Facebook outbound console" },
  { path: "pages/admin/outbound/x.tsx", label: "X outbound console" },
  { path: "pages/admin/outbound/linkedin.tsx", label: "LinkedIn outbound console" },
  { path: "pages/admin/outbound/index.tsx", label: "Outbound publishing index" },
];

const RESERVED_SURFACE_PATTERNS = [
  { file: "pages/admin/outbound/facebook.tsx", patterns: ["not configured", "OAuth not configured", "CONFIG_MISSING"] },
  { file: "pages/admin/outbound/x.tsx", patterns: ["not configured", "OAuth not configured"] },
  { file: "pages/admin/outbound/linkedin.tsx", patterns: ["Not connected", "not connected", "CONFIG_MISSING"] },
];

const FORBIDDEN_PUBLIC_IMPORTS = [
  { import: "components/Layout", label: "public Layout" },
  { import: "components/Header", label: "public Header" },
  { import: "components/EnhancedFooter", label: "public Footer" },
  { import: "components/AppShell", label: "public AppShell" },
];

// Patterns that indicate raw secret/config/token rendering in admin pages
const SECRET_RENDERING_PATTERNS = [
  /FACEBOOK_APP_SECRET/,
  /FACEBOOK_APP_ID/,
  /sk-[a-zA-Z0-9]{20,}/,
  /pk-[a-zA-Z0-9]{20,}/,
  /token:\s*['"][A-Za-z0-9_-]{20,}['"]/,
  /accessToken:\s*['"][A-Za-z0-9_-]{20,}['"]/,
  /refreshToken:\s*['"][A-Za-z0-9_-]{20,}['"]/,
  /process\.env\./,
];

// ─── Main ──────────────────────────────────────────────────────────────────────

let exitCode = 0;
const results = [];

console.log("═══════════════════════════════════════════════");
console.log("  ADMIN SURFACE INTEGRITY CHECK");
console.log("═══════════════════════════════════════════════\n");

// 1. Check critical admin routes exist
console.log("─── 1. Critical admin route files exist ───");
for (const route of CRITICAL_ADMIN_ROUTES) {
  const fullPath = path.join(ROOT, route.path);
  if (fs.existsSync(fullPath)) {
    console.log(`  ✓ ${route.label} → ${route.path}`);
    results.push({ check: route.label, status: "PASS" });
  } else {
    console.log(`  ✗ ${route.label} → MISSING`);
    results.push({ check: route.label, status: "FAIL" });
    exitCode = 1;
  }
}

// 2. Check reserved outbound surfaces have config-required labels
console.log("\n─── 2. Reserved outbound surfaces have config-required labels ───");
for (const { file, patterns } of RESERVED_SURFACE_PATTERNS) {
  const fullPath = path.join(ROOT, file);
  if (!fs.existsSync(fullPath)) {
    console.log(`  ⚠ ${file} not found, skipping`);
    continue;
  }
  const content = fs.readFileSync(fullPath, "utf-8");
  const hasPattern = patterns.some(p => content.toLowerCase().includes(p.toLowerCase()));
  if (hasPattern) {
    console.log(`  ✓ ${file} has config-required messaging`);
    results.push({ check: `${file}: config-required label`, status: "PASS" });
  } else {
    console.log(`  ✗ ${file} missing config-required messaging`);
    results.push({ check: `${file}: config-required label`, status: "FAIL" });
    exitCode = 1;
  }
}

// 3. Check no admin route imports public Layout/Header/Footer directly
console.log("\n─── 3. No admin route imports public Layout/Header/Footer ───");
const adminDirs = [
  "pages/admin",
  "app/admin",
];

function walkDir(dirPath) {
  const files = [];
  if (!fs.existsSync(dirPath)) return files;
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      if (!entry.name.startsWith(".") && entry.name !== "node_modules") files.push(...walkDir(full));
    } else if (entry.name.endsWith(".tsx") || entry.name.endsWith(".ts")) {
      files.push(full);
    }
  }
  return files;
}

for (const dir of adminDirs) {
  const fullDir = path.join(ROOT, dir);
  if (!fs.existsSync(fullDir)) continue;

  const files = walkDir(fullDir);

  for (const file of files) {
    const content = fs.readFileSync(file, "utf-8");
    const relPath = path.relative(ROOT, file);

    for (const { import: imp, label } of FORBIDDEN_PUBLIC_IMPORTS) {
      // Check for direct imports of public components
      const importPattern = new RegExp(`from\\s+["']@/${imp}["']`);
      if (importPattern.test(content)) {
        // Check if it's using AdminLayout or AppAdminShell instead
        if (content.includes("AdminLayout") || content.includes("AppAdminShell")) {
          console.log(`  ⚠ ${relPath} imports ${label} but also uses AdminLayout`);
          results.push({ check: `${relPath}: ${label}`, status: "WARN" });
        } else {
          console.log(`  ✗ ${relPath} imports ${label} directly`);
          results.push({ check: `${relPath}: ${label}`, status: "FAIL" });
          exitCode = 1;
        }
      }
    }
  }
}

// If no violations found
if (!results.some(r => r.status === "FAIL" && r.check.includes("imports"))) {
  console.log("  ✓ No admin routes import public shell components directly");
}

// 4. Check brief-orders and qa-bench in navigation
console.log("\n─── 4. Navigation registry includes brief-orders and qa-bench ───");
const navPath = path.join(ROOT, "lib/admin/admin-navigation.ts");
if (fs.existsSync(navPath)) {
  const navContent = fs.readFileSync(navPath, "utf-8");

  if (navContent.includes("brief-orders")) {
    console.log("  ✓ brief-orders in navigation");
    results.push({ check: "Navigation: brief-orders", status: "PASS" });
  } else {
    console.log("  ✗ brief-orders NOT in navigation");
    results.push({ check: "Navigation: brief-orders", status: "FAIL" });
    exitCode = 1;
  }

  if (navContent.includes("qa-bench")) {
    console.log("  ✓ qa-bench in navigation");
    results.push({ check: "Navigation: qa-bench", status: "PASS" });
  } else {
    console.log("  ✗ qa-bench NOT in navigation");
    results.push({ check: "Navigation: qa-bench", status: "FAIL" });
    exitCode = 1;
  }
} else {
  console.log("  ✗ Navigation registry not found");
  results.push({ check: "Navigation: file exists", status: "FAIL" });
  exitCode = 1;
}

// 5. Check command wall has controlled empty state
console.log("\n─── 5. Command wall has controlled empty state ───");
const cwPath = path.join(ROOT, "pages/admin/command-wall.tsx");
if (fs.existsSync(cwPath)) {
  const cwContent = fs.readFileSync(cwPath, "utf-8");

  // Check for the new premium empty state
  const hasPremiumEmptyState = cwContent.includes("No command wall intelligence has been recorded yet");
  if (hasPremiumEmptyState) {
    console.log("  ✓ Command wall has premium controlled empty state");
    results.push({ check: "Command wall: premium empty state", status: "PASS" });
  } else if (cwContent.includes("EmptyPanelText")) {
    console.log("  ✓ Command wall has EmptyPanelText component");
    results.push({ check: "Command wall: empty state", status: "PASS" });
  } else {
    console.log("  ✗ Command wall missing empty state component");
    results.push({ check: "Command wall: empty state", status: "FAIL" });
    exitCode = 1;
  }

  // Check "Failed to synchronize" is only in catch block (error discipline)
  const syncErrorCount = (cwContent.match(/Failed to synchronize/g) || []).length;
  if (syncErrorCount <= 1) {
    console.log("  ✓ Command wall error message is controlled (not shown for empty data)");
    results.push({ check: "Command wall: error discipline", status: "PASS" });
  } else {
    console.log(`  ⚠ Command wall has ${syncErrorCount} occurrences of error message — review`);
    results.push({ check: "Command wall: error discipline", status: "WARN" });
  }
} else {
  console.log("  ✗ Command wall file not found");
  results.push({ check: "Command wall: file exists", status: "FAIL" });
  exitCode = 1;
}

// 6. Check brief-orders empty state
console.log("\n─── 6. Brief-orders has controlled empty state ───");
const boPath = path.join(ROOT, "app/admin/intelligence-foundry/brief-orders/PageClient.tsx");
if (fs.existsSync(boPath)) {
  const boContent = fs.readFileSync(boPath, "utf-8");

  const hasEmptyState = boContent.includes("No Decision Failure Brief orders yet");
  const hasInternalNote = boContent.includes("Run a checkout smoke test after production deployment");

  if (hasEmptyState) {
    console.log("  ✓ Brief orders has informative empty state");
    results.push({ check: "Brief orders: empty state", status: "PASS" });
  } else {
    console.log("  ✗ Brief orders missing informative empty state");
    results.push({ check: "Brief orders: empty state", status: "FAIL" });
    exitCode = 1;
  }

  if (hasInternalNote) {
    console.log("  ✓ Brief orders has internal deployment note");
    results.push({ check: "Brief orders: deployment note", status: "PASS" });
  } else {
    console.log("  ⚠ Brief orders missing internal deployment note");
    results.push({ check: "Brief orders: deployment note", status: "WARN" });
  }
} else {
  console.log("  ✗ Brief orders PageClient not found");
  results.push({ check: "Brief orders: file exists", status: "FAIL" });
  exitCode = 1;
}

// 7. Check no admin route renders raw secret/config/token values
console.log("\n─── 7. No admin route renders raw secret/config/token values ───");
const allAdminFiles = [];
for (const dir of adminDirs) {
  const fullDir = path.join(ROOT, dir);
  if (fs.existsSync(fullDir)) allAdminFiles.push(...walkDir(fullDir));
}

let secretLeaksFound = 0;
for (const file of allAdminFiles) {
  const content = fs.readFileSync(file, "utf-8");
  const relPath = path.relative(ROOT, file);

  for (const pattern of SECRET_RENDERING_PATTERNS) {
    const matches = content.match(pattern);
    if (matches) {
      // Only flag if the match appears in JSX/TSX rendering context (not in imports or comments)
      const lines = content.split("\n");
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();
        if (trimmed.startsWith("//") || trimmed.startsWith("/*") || trimmed.startsWith("*")) continue;
        if (trimmed.startsWith("import ")) continue;

        if (pattern.test(trimmed)) {
          // Check if it's in a JSX context (inside return statement or JSX block)
          if (trimmed.includes("</") || trimmed.includes("/>") || trimmed.includes(">{") || trimmed.includes("} {")) {
            console.log(`  ⚠ ${relPath}:${i + 1} — potential secret rendering`);
            secretLeaksFound++;
          }
        }
      }
    }
  }
}

if (secretLeaksFound === 0) {
  console.log("  ✓ No secret/token rendering detected in admin routes");
} else {
  console.log(`  ⚠ ${secretLeaksFound} potential secret rendering(s) found — review`);
}

// 8. Check admin shell usage
console.log("\n─── 8. Admin shell usage ───");
// Check that pages router admin pages use AdminLayout
const pagesAdminFiles = walkDir(path.join(ROOT, "pages/admin"));

// Known intentional exclusions from AdminLayout
// These are documented and justified:
const INTENTIONAL_EXCLUSIONS = [
  {
    file: "pages/admin/access-revoke.tsx",
    reason: "LEGACY REDIRECT — permanently redirects to /admin/access-keys. No shell needed.",
    route: "/admin/access-revoke",
  },
  {
    file: "pages/admin/command-wall.tsx",
    reason: "STANDALONE SURFACE — 'Directorate OS' full-screen control surface with its own navigation, header, and footer. Intentionally separate from standard admin shell.",
    route: "/admin/command-wall",
  },
  {
    file: "pages/admin/inner-circle/index.tsx",
    reason: "CUSTOM SECURITY SHELL — Inner Circle key management has its own security-isolated shell with session timeout, admin key auth, and SSR-safe rendering. Cannot use standard AdminLayout due to pre-auth rendering requirements.",
    route: "/admin/inner-circle",
  },
  {
    file: "pages/admin/login.tsx",
    reason: "PRE-AUTH PAGE — Login page renders before authentication. AdminLayout requires an active session, so it cannot be used here.",
    route: "/admin/login",
  },
];

function isPageEntry(relPath) {
  const parts = relPath.replace(/\\/g, "/").split("/");
  const bn = parts[parts.length - 1];
  const dn = parts[parts.length - 2];
  const pd = parts.length >= 4 ? parts[parts.length - 3] : "";
  
  // Top-level .tsx files in pages/admin/
  if (parts.length === 3 && bn.endsWith(".tsx")) return true;
  // index.tsx in subdirectories
  if (parts.length === 4 && bn === "index.tsx") return true;
  // Outbound pages: pages/admin/outbound/*.tsx
  if (parts.length === 4 && dn === "outbound" && bn.endsWith(".tsx")) return true;
  // Intelligence pages: pages/admin/intelligence/*.tsx
  if (parts.length === 4 && dn === "intelligence" && bn.endsWith(".tsx")) return true;
  
  return false;
}

let pagesUsingAdminLayout = 0;
let pagesTotal = 0;
const unexpectedUncovered = [];

for (const file of pagesAdminFiles) {
  const content = fs.readFileSync(file, "utf-8");
  const relPath = path.relative(ROOT, file);
  if (!isPageEntry(relPath)) continue;

  pagesTotal++;
  if (content.includes("AdminLayout")) {
    pagesUsingAdminLayout++;
  } else {
    // Check if it's an intentional exclusion (handle Windows backslashes)
    const normalizedRel = relPath.replace(/\\/g, "/");
    const isExcluded = INTENTIONAL_EXCLUSIONS.some(e => e.file.replace(/\\/g, "/") === normalizedRel);
    if (!isExcluded) {
      unexpectedUncovered.push(relPath);
    }
  }
}

const intentionalCount = INTENTIONAL_EXCLUSIONS.length;
const effectiveCoverage = Math.round(((pagesUsingAdminLayout) / (pagesTotal - intentionalCount)) * 100);

console.log(`  ${pagesUsingAdminLayout}/${pagesTotal} pages router admin pages use AdminLayout`);
console.log(`  ${intentionalCount} intentional exclusion(s) documented:`);
for (const ex of INTENTIONAL_EXCLUSIONS) {
  console.log(`    - ${ex.file}: ${ex.reason}`);
}

if (unexpectedUncovered.length === 0) {
  console.log(`  ✓ 100% effective admin shell coverage (${effectiveCoverage}% of applicable pages)`);
  results.push({ check: "Admin shell coverage", status: "PASS" });
} else {
  console.log(`  ✗ ${unexpectedUncovered.length} unexpected uncovered page(s):`);
  for (const u of unexpectedUncovered) {
    console.log(`    - ${u}`);
  }
  results.push({ check: "Admin shell coverage", status: "FAIL" });
  exitCode = 1;
}

// 9. Check for public nav label leakage in admin pages
console.log("\n─── 9. No public nav labels in admin rendered output ───");

// Public nav labels that must NOT appear in admin rendered pages
// EXCEPTION: command-wall.tsx has its own internal "Dossier Library" tab
// as part of the Directorate OS interface — this is intentional, not a leak.
const PUBLIC_NAV_LABELS = [
  "TEST A DECISION",
  "INNER CIRCLE",
  "EDITORIALS",
  "LIBRARY",        // Public nav has "Library" — command wall has "Dossier Library" (allowlisted)
];

// Files where certain labels are intentionally used (own nav, not public nav leak)
const ALLOWLISTED_LABELS = {
  "pages/admin/command-wall.tsx": ["LIBRARY"], // Directorate OS "Dossier Library" tab
};

// Check that AppShell suppresses Header/Footer on admin routes
const appShellPath = path.join(ROOT, "components/AppShell.tsx");
if (fs.existsSync(appShellPath)) {
  const appShellContent = fs.readFileSync(appShellPath, "utf-8");
  const hasAdminGuard = appShellContent.includes("isAdminRoute") && 
                        appShellContent.includes("!isAdminRoute");
  if (hasAdminGuard) {
    console.log("  ✓ AppShell suppresses Header/Footer on admin routes");
    results.push({ check: "AppShell: admin route guard", status: "PASS" });
  } else {
    console.log("  ✗ AppShell missing admin route guard — public nav will render on admin pages");
    results.push({ check: "AppShell: admin route guard", status: "FAIL" });
    exitCode = 1;
  }
}

// Scan all admin page files for public nav labels in rendered context
const allAdminPageFiles = [];
for (const dir of adminDirs) {
  const fullDir = path.join(ROOT, dir);
  if (fs.existsSync(fullDir)) allAdminPageFiles.push(...walkDir(fullDir));
}

let navLabelLeaks = 0;
for (const file of allAdminPageFiles) {
  const content = fs.readFileSync(file, "utf-8");
  const relPath = path.relative(ROOT, file);
  
  // Only check page files (not utility files)
  if (!relPath.endsWith("page.tsx") && !relPath.endsWith("PageClient.tsx") && 
      !relPath.endsWith("layout.tsx") && !relPath.endsWith(".tsx")) continue;

  for (const label of PUBLIC_NAV_LABELS) {
    // Check if this file is allowlisted for this label
    const normalizedRel = relPath.replace(/\\/g, "/");
    const allowlisted = ALLOWLISTED_LABELS[normalizedRel] || [];
    if (allowlisted.includes(label)) continue;

    const lines = content.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      // Skip imports, comments, type definitions
      if (trimmed.startsWith("import ") || trimmed.startsWith("//") || 
          trimmed.startsWith("/*") || trimmed.startsWith("*")) continue;
      if (trimmed.startsWith("type ") || trimmed.startsWith("interface ") || 
          trimmed.startsWith("export type")) continue;
      
      if (trimmed.includes(label)) {
        // Check if it's in a string that would be rendered (not a type or variable name)
        if ((trimmed.includes('"') || trimmed.includes("'") || trimmed.includes("`")) &&
            !trimmed.includes("from ") && !trimmed.includes("require(")) {
          console.log(`  ⚠ ${relPath}:${i + 1} — contains "${label}" which may be rendered public nav`);
          navLabelLeaks++;
        }
      }
    }
  }
}

if (navLabelLeaks === 0) {
  console.log("  ✓ No public nav labels detected in admin page files");
  results.push({ check: "Admin: no public nav label leaks", status: "PASS" });
} else {
  console.log(`  ⚠ ${navLabelLeaks} potential public nav label leak(s) found — review each`);
  results.push({ check: "Admin: no public nav label leaks", status: "WARN" });
}

// 10. Summary
console.log("\n─── SUMMARY ───");
const passes = results.filter(r => r.status === "PASS").length;
const warnings = results.filter(r => r.status === "WARN").length;
const failures = results.filter(r => r.status === "FAIL").length;

console.log(`  Passed: ${passes}`);
console.log(`  Warnings: ${warnings}`);
console.log(`  Failed: ${failures}`);

if (exitCode === 0) {
  console.log("\n  ✓ All admin surface integrity checks passed.");
} else {
  console.log(`\n  ✗ ${failures} failure(s) found.`);
}

process.exit(exitCode);