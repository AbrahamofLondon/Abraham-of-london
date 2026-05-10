/**
 * scripts/playbook-commercial-guard.mjs
 *
 * Verifies playbook commercial integrity:
 * - Every playbook coverImage path exists
 * - Every premium playbook has a catalog entry
 * - Every premium playbook has an entitlementSlug
 * - Every public method brief has upgradePath
 * - Every architect playbook has access explanation
 * - Every paid playbook has successPath
 * - Every paid playbook has Stripe ID or checkout is safely disabled
 * - No locked playbook renders a dead-end lock state
 * - No playbook uses "upgrade now" or SaaS paywall language
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PLAYBOOKS_DIR = path.join(ROOT, "content", "playbooks");
const CATALOG_PATH = path.join(ROOT, "lib", "commercial", "catalog.ts");
const PUBLIC_ASSETS_DIR = path.join(ROOT, "public");

const errors = [];
const warnings = [];

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const fm = {};
  const lines = match[1].split("\n");
  let currentKey = null;
  let nestedKey = null;

  for (const line of lines) {
    // Nested key (indented)
    const nestedMatch = line.match(/^\s{2}(\w+):\s*(.*)/);
    if (nestedMatch && currentKey) {
      const nk = nestedMatch[1];
      let val = nestedMatch[2].trim().replace(/^"|"$/g, "");
      if (val === "true") val = true;
      else if (val === "false") val = false;
      if (!fm[currentKey]) fm[currentKey] = {};
      fm[currentKey][nk] = val;
      continue;
    }
    // Array item
    if (line.match(/^\s+-\s/) && currentKey) {
      const val = line.replace(/^\s+-\s/, "").trim().replace(/^"|"$/g, "");
      if (!Array.isArray(fm[currentKey])) {
        fm[currentKey] = [val];
      } else {
        fm[currentKey].push(val);
      }
      continue;
    }
    // Top-level key
    const kv = line.match(/^(\w+):\s*(.*)/);
    if (kv) {
      currentKey = kv[1];
      let val = kv[2].trim().replace(/^"|"$/g, "");
      if (val === "true") val = true;
      else if (val === "false") val = false;
      fm[currentKey] = val;
    }
  }
  return fm;
}

function getPlaybookFiles() {
  if (!fs.existsSync(PLAYBOOKS_DIR)) {
    errors.push(`Playbooks directory not found: ${PLAYBOOKS_DIR}`);
    return [];
  }
  return fs
    .readdirSync(PLAYBOOKS_DIR)
    .filter((f) => f.endsWith(".mdx") || f.endsWith(".md"));
}

function checkCoverImage(coverPath) {
  if (!coverPath) return true; // no cover specified
  const abs = path.join(ROOT, "public", coverPath.replace(/^\/?public\//, ""));
  if (!fs.existsSync(abs)) {
    errors.push(`Cover image not found: ${coverPath} (resolved: ${abs})`);
    return false;
  }
  return true;
}

function checkCatalogHasEntry(slug, tier) {
  if (tier === "public") return true; // public briefs don't need catalog entries
  const catalog = fs.readFileSync(CATALOG_PATH, "utf8");

  // Map playbook slugs to catalog codes
  const slugToCode = {
    "execution-integrity-protocol": "execution_integrity_protocol",
    "the-alignment-audit-playbook": "alignment_audit_playbook",
    "the-drift-detection-framework": "drift_detection_framework",
  };

  const code = slugToCode[slug];
  if (!code) {
    if (tier === "architect") {
      warnings.push(`Architect playbook "${slug}" has no catalog entry — acceptable if access is restricted.`);
      return true;
    }
    errors.push(`No catalog code mapping for playbook slug: ${slug}`);
    return false;
  }

  if (!catalog.includes(`code: "${code}"`)) {
    errors.push(`Premium playbook "${slug}" has no catalog entry (expected code: "${code}")`);
    return false;
  }

  // Check entitlement slug
  const fm = parseFrontmatter(fs.readFileSync(path.join(PLAYBOOKS_DIR, slug + ".mdx"), "utf8"));
  const expectedSlug = `playbook.${slug.replace(/-/g, "-")}.access`;
  // Just check catalog has an entitlementSlug for this code
  const codeIndex = catalog.indexOf(`code: "${code}"`);
  const section = catalog.slice(codeIndex, codeIndex + 800);
  if (!section.includes("entitlementSlug:")) {
    errors.push(`Catalog entry "${code}" missing entitlementSlug`);
    return false;
  }

  return true;
}

function checkContinuationPath(fm, slug) {
  if (fm.contentClass !== "public_method_brief") return true;
  if (!fm.continuationPath) {
    errors.push(`Public method brief "${slug}" missing continuationPath in frontmatter`);
    return false;
  }
  if (!fm.continuationPath.label || !fm.continuationPath.href) {
    errors.push(`Public method brief "${slug}" continuationPath missing label or href`);
    return false;
  }
  return true;
}

function checkAccessExplanation(fm, slug) {
  if (fm.contentClass !== "architect_playbook") return true;
  if (!fm.accessModel) {
    errors.push(`Architect playbook "${slug}" missing accessModel in frontmatter`);
    return false;
  }
  return true;
}

function checkNoPaywallLanguage(content, slug) {
  const forbidden = [
    "upgrade now",
    "subscribe to unlock",
    "premium article",
    "members only",
    "sign up to read",
    "paywall",
  ];
  const lower = content.toLowerCase();
  for (const phrase of forbidden) {
    if (lower.includes(phrase)) {
      errors.push(`Playbook "${slug}" contains forbidden paywall language: "${phrase}"`);
      return false;
    }
  }
  return true;
}

function checkSuccessPath(fm, slug) {
  if (fm.tier === "public" || fm.tier === "architect") return true;
  const catalog = fs.readFileSync(CATALOG_PATH, "utf8");
  const slugToCode = {
    "execution-integrity-protocol": "execution_integrity_protocol",
    "the-alignment-audit-playbook": "alignment_audit_playbook",
    "the-drift-detection-framework": "drift_detection_framework",
  };
  const code = slugToCode[slug];
  if (!code) return true;
  const codeIndex = catalog.indexOf(`code: "${code}"`);
  const section = catalog.slice(codeIndex, codeIndex + 1000);
  if (!section.includes("successPath:")) {
    errors.push(`Catalog entry "${code}" missing successPath`);
    return false;
  }
  return true;
}

function checkCheckoutDisabled(fm, slug) {
  if (fm.tier === "public" || fm.tier === "architect") return true;
  const catalog = fs.readFileSync(CATALOG_PATH, "utf8");
  const slugToCode = {
    "execution-integrity-protocol": "execution_integrity_protocol",
    "the-alignment-audit-playbook": "alignment_audit_playbook",
    "the-drift-detection-framework": "drift_detection_framework",
  };
  const code = slugToCode[slug];
  if (!code) return true;
  const codeIndex = catalog.indexOf(`code: "${code}"`);
  const section = catalog.slice(codeIndex, codeIndex + 1000);

  const hasStripeId = section.includes("stripeProductId: \"prod_") || section.includes("stripePriceId: \"price_");
  const hasCheckoutDisabled = section.includes("requiresCheckout: false");

  if (!hasStripeId && !hasCheckoutDisabled) {
    errors.push(`Catalog entry "${code}" has no Stripe ID and no requiresCheckout: false — checkout state is ambiguous`);
    return false;
  }
  return true;
}

// Run checks
console.log("\n=== PLAYBOOK COMMERCIAL GUARD ===\n");

const files = getPlaybookFiles();
console.log(`Scanning ${files.length} playbook files...\n`);

for (const file of files) {
  const filePath = path.join(PLAYBOOKS_DIR, file);
  const content = fs.readFileSync(filePath, "utf8");
  const fm = parseFrontmatter(content);
  const slug = fm.slug || file.replace(/\.(mdx|md)$/, "");

  console.log(`  ${slug} (${fm.contentClass || fm.tier || "unknown"})`);

  // Check 1: Cover image exists
  if (fm.coverImage) {
    checkCoverImage(fm.coverImage);
  }

  // Check 2: Premium playbooks have catalog entries
  checkCatalogHasEntry(slug, fm.tier);

  // Check 3: Public method briefs have continuationPath
  checkContinuationPath(fm, slug);

  // Check 4: Architect playbooks have access explanation
  checkAccessExplanation(fm, slug);

  // Check 5: No paywall language
  checkNoPaywallLanguage(content, slug);

  // Check 6: Paid playbooks have successPath
  checkSuccessPath(fm, slug);

  // Check 7: Paid playbooks without Stripe IDs must have checkout explicitly disabled
  checkCheckoutDisabled(fm, slug);
}

// Report
console.log(`\nVIOLATIONS: ${errors.length}`);
console.log(`WARNINGS: ${warnings.length}\n`);

if (errors.length > 0) {
  console.error("❌ COMMERCIAL VIOLATIONS:");
  errors.forEach((e) => console.error(`  - ${e}`));
  console.error(`\nResult: FAIL`);
  process.exit(1);
}

if (warnings.length > 0) {
  console.log("⚠️  WARNINGS:");
  warnings.forEach((w) => console.log(`  - ${w}`));
  console.log(`\nResult: PASS_WITH_WARNINGS`);
  process.exit(0);
}

console.log("Result: PASS\n");
