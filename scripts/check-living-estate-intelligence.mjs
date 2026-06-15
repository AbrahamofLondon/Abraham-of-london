#!/usr/bin/env node

/**
 * scripts/check-living-estate-intelligence.mjs
 *
 * Living Estate Intelligence Checker
 * -----------------------------------
 * Evaluates product estate records as structured objects using field-owned
 * identity extraction — never by substring occurrence in relationship fields.
 *
 * Authority hierarchy:
 *   Lifecycle authority > Commercial resolver > Registry admin focus > MDX frontmatter
 *
 * Safety:
 *   - no network access
 *   - no source mutation
 *   - no deployment
 *   - writes only:
 *       reports/living-estate-intelligence-report.json
 *       reports/living-estate-intelligence-report.md
 *       reports/living-estate-intelligence-memory.json
 *
 * Usage:
 *   node scripts/check-living-estate-intelligence.mjs
 *
 * Exit:
 *   0 = no blocking contradiction
 *   1 = blocker detected
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  parseGmiLifecycleRecords,
  parseGmiRegistryRecords,
  parseCatalogRecords,
  parseFrontmatter,
  findRecordByIdentity,
} from "./lib/structured-record-parser.mjs";

// ─── Runtime ─────────────────────────────────────────────────────────────────

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

const REPORT_JSON = "reports/living-estate-intelligence-report.json";
const REPORT_MD = "reports/living-estate-intelligence-report.md";
const MEMORY_FILE = "reports/living-estate-intelligence-memory.json";

// ─── Console ─────────────────────────────────────────────────────────────────

const RESET = "\x1b[0m";
const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";
const BOLD = "\x1b[1m";

function paint(color, text) { return `${color}${text}${RESET}`; }
function log(color, ...args) { console.log(color, ...args, RESET); }
function heading(text) { console.log(`\n${text}\n${"\u2500".repeat(text.length)}`); }
function ok(msg) { console.log(`  ${GREEN}\u2713${RESET} ${msg}`); }
function warn(msg) { console.log(`  ${YELLOW}\u26a0${RESET} ${msg}`); }
function fail(msg) { console.log(`  ${RED}\u2717${RESET} ${msg}`); }

// ─── File helpers ────────────────────────────────────────────────────────────

function exists(rel) { return fs.existsSync(path.join(ROOT, rel)); }
function readText(rel) {
  try { return fs.readFileSync(path.join(ROOT, rel), "utf8"); } catch { return ""; }
}
function readJson(rel) {
  try { return JSON.parse(readText(rel)); } catch { return null; }
}
function writeJson(rel, data) {
  const abs = path.join(ROOT, rel);
  const dir = path.dirname(abs);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(abs, JSON.stringify(data, null, 2), "utf8");
}
function writeText(rel, content) {
  const abs = path.join(ROOT, rel);
  const dir = path.dirname(abs);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(abs, content, "utf8");
}

function normaliseCode(s) {
  return String(s || "").trim().toLowerCase().replace(/[-\s]+/g, "_");
}

// ─── Source-of-Truth Map ────────────────────────────────────────────────────

const SOURCE_OF_TRUTH_MAP = {
  publicationLifecycle: "lib/intelligence/market-intelligence-lifecycle.ts",
  gmiEditionMetadata: "lib/commercial/gmi/gmi-edition-registry.ts",
  commercialMetadata: "lib/commercial/catalog.ts",
  productAuthority: "data/ProductAuthorityContract.json",
  releaseReadiness: "reports/product-release-readiness-matrix.json",
  releaseGovernance: "reports/product-release-governance-matrix.json",
};

// ─── Lifecycle helpers ──────────────────────────────────────────────────────

function lifecycleIsDraft(value) {
  return ["DRAFT", "draft", "FORTHCOMING", "forthcoming", "RELEASE_CANDIDATE", "release_candidate", "production_release_candidate"].includes(String(value || ""));
}

function lifecycleIsActive(value) {
  return ["ACTIVE_UNTIL_SUPERSEDED", "ACTIVE", "PUBLISHED", "published", "active"].includes(String(value || ""));
}

function lifecycleIsPrePublication(value) {
  return lifecycleIsDraft(value) || ["SCHEDULED", "scheduled"].includes(String(value || ""));
}

// ─── Issue factory ───────────────────────────────────────────────────────────

let issueCounter = 1;

function makeIssue(input) {
  const id = `LEI-${String(issueCounter++).padStart(4, "0")}`;
  const severity = input.severity || "informational_note";
  const blocksDeployment =
    input.blocksDeployment === true ||
    ["fatal_build_blocker", "checkout_bypass", "commercial_safety_blocker"].includes(severity) ||
    (severity === "publication_lifecycle_conflict" && input.blocksPublication === true);

  return {
    id,
    title: input.title,
    description: input.description || "",
    severity,
    domain: input.domain || "general",
    blocksDeployment,
    requiresOwnerDecision: input.requiresOwnerDecision === true,
    governedTension: input.governedTension === true,
    sourceOfTruth: input.sourceOfTruth || null,
    observedSource: input.observedSource || null,
    expectedSource: input.expectedSource || null,
    affectedItems: input.affectedItems || [],
    evidence: input.evidence || [],
    recommendation: input.recommendation || "Review required.",
  };
}

// ─── Snapshot loader ─────────────────────────────────────────────────────────

function loadEstateSnapshot() {
  const snapshot = {
    lifecycleRecords: [],
    registryRecords: [],
    catalogEntries: {},
    contentDocuments: [],
    envFiles: [],
    products: [],
    reports: {},
  };

  // Parse lifecycle records using structured field-owned extraction
  const lifeContent = readText("lib/intelligence/market-intelligence-lifecycle.ts");
  if (lifeContent) {
    snapshot.lifecycleRecords = parseGmiLifecycleRecords(
      "lib/intelligence/market-intelligence-lifecycle.ts", lifeContent
    );
  }

  // Parse GMI registry records using structured field-owned extraction
  const regContent = readText("lib/commercial/gmi/gmi-edition-registry.ts");
  if (regContent) {
    snapshot.registryRecords = parseGmiRegistryRecords(
      "lib/commercial/gmi/gmi-edition-registry.ts", regContent
    );
  }

  // Parse CATALOG entries
  const catContent = readText("lib/commercial/catalog.ts");
  if (catContent) {
    const catRecords = parseCatalogRecords("lib/commercial/catalog.ts", catContent);
    for (const rec of catRecords) {
      const code = rec.fields.code || rec.fields.productCode;
      if (code) snapshot.catalogEntries[code] = rec.fields;
    }
  }

  // Walk content files for MDX frontmatter
  function walkDir(dir, list) {
    const abs = path.join(ROOT, dir);
    try {
      for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
        const rel = `${dir}/${entry.name}`;
        if (entry.isDirectory()) { walkDir(rel, list); } else { list.push(rel); }
      }
    } catch { /* skip */ }
  }

  if (exists("content")) walkDir("content", snapshot.contentDocuments);
  // Convert to parsed documents
  snapshot.contentDocuments = snapshot.contentDocuments.map((file) => {
    const text = readText(file);
    const parsed = parseFrontmatter(text);
    return { file, frontmatter: parsed.frontmatter, body: parsed.body };
  });

  // Env files
  try {
    for (const f of fs.readdirSync(ROOT)) {
      if (f.startsWith(".env")) snapshot.envFiles.push(f);
    }
  } catch { /* skip */ }

  // Load matrices
  const readiness = readJson("reports/product-release-readiness-matrix.json") || {};
  const governance = readJson("reports/product-release-governance-matrix.json") || {};
  const authority = readJson("data/ProductAuthorityContract.json") || {};

  // Build product list
  const allCodes = Array.from(new Set([...Object.keys(readiness), ...Object.keys(governance)]));
  for (const code of allCodes) {
    const r = readiness[code] || {};
    const g = governance[code] || {};
    const a = authority[code] || {};
    snapshot.products.push({
      productCode: code,
      authority: { state: a.currentAuthorityState || null },
      readiness: {
        readinessStatus: r.readinessStatus || null,
        releaseReadyNow: r.releaseReadyNow === true,
        checkoutSafe: r.checkoutSafe,
        commercialSafe: r.commercialSafe,
        releaseLane: r.releaseLane || null,
        releaseMode: r.releaseMode || null,
      },
      governance: {
        checkoutAllowed: g.checkoutAllowed,
        releaseLane: g.releaseLane || null,
        releaseMode: g.releaseMode || null,
      },
    });
  }

  // Load existing reports
  for (const reportFile of ["reports/blog-post-route-audit.json", "reports/public-content-route-audit.json"]) {
    const data = readJson(reportFile);
    if (data) snapshot.reports[reportFile] = data;
  }

  return snapshot;
}

// ─── Detector: GMI Publication Lifecycle ─────────────────────────────────────

function detectGmiLifecycleContradictions(snapshot) {
  const issues = [];

  for (const reg of snapshot.registryRecords) {
    const identity = reg.identity[0]; // e.g. "GMI-Q1-2026" or "gmi_q1_2026"
    const life = findRecordByIdentity(snapshot.lifecycleRecords, identity);

    if (!life) {
      // Registry record without lifecycle — informational
      issues.push(makeIssue({
        title: `GMI ${identity}: registry entry has no matching lifecycle record`,
        description: `Registry has ${identity} but lifecycle authority has no corresponding record.`,
        severity: "governed_tension",
        domain: "gmi_publication_lifecycle",
        governedTension: true,
        sourceOfTruth: SOURCE_OF_TRUTH_MAP.publicationLifecycle,
        observedSource: SOURCE_OF_TRUTH_MAP.gmiEditionMetadata,
        affectedItems: [identity],
        evidence: [`registry.status=${reg.fields.status}`, "no lifecycle record"],
        recommendation: "Add lifecycle record or remove orphaned registry entry.",
      }));
      continue;
    }

    const regStatus = String(reg.fields.status || "");
    const lifeState = String(life.fields.lifecycleState || "");
    const regCurrent = reg.fields.current === true;
    const isDraft = lifecycleIsDraft(lifeState);
    const isActive = lifecycleIsActive(lifeState);

    // --- Rule 1: Registry current flag on a draft lifecycle ---
    // This is an admin-preparation focus flag. Not a blocker if lifecycle
    // truth remains protected (public/commercial surfaces use lifecycle).
    if (regCurrent && isDraft) {
      issues.push(makeIssue({
        title: `GMI ${identity}: registry current flag is admin focus while lifecycle is draft`,
        description: `Registry marks ${identity} as current (admin focus) but lifecycle says ${lifeState}. Safe only if public surfaces derive from lifecycle.`,
        severity: "governed_tension",
        domain: "gmi_publication_lifecycle",
        governedTension: true,
        sourceOfTruth: SOURCE_OF_TRUTH_MAP.publicationLifecycle,
        observedSource: SOURCE_OF_TRUTH_MAP.gmiEditionMetadata,
        expectedSource: "Lifecycle controls publication state.",
        affectedItems: [identity],
        evidence: [`registry.current=true`, `lifecycle.lifecycleState=${lifeState}`],
        recommendation: "Keep registry current as admin focus only. Public surfaces must use lifecycle helpers.",
      }));
    }

    // --- Rule 2: Registry archived but lifecycle still active ---
    const isArchived = regStatus.includes("archiv");
    if (isArchived && isActive && !life.fields.supersededBy) {
      issues.push(makeIssue({
        title: `GMI ${identity}: registry archive state conflicts with active lifecycle`,
        description: `Registry status is "${regStatus}" but lifecycle says ${lifeState} with no supersession.`,
        severity: "publication_lifecycle_conflict",
        domain: "gmi_publication_lifecycle",
        blocksPublication: true,
        sourceOfTruth: SOURCE_OF_TRUTH_MAP.publicationLifecycle,
        observedSource: SOURCE_OF_TRUTH_MAP.gmiEditionMetadata,
        affectedItems: [identity],
        evidence: [`registry.status=${regStatus}`, `lifecycle.lifecycleState=${lifeState}`, `lifecycle.supersededBy=${life.fields.supersededBy || "null"}`],
        recommendation: "Reconcile registry archive state with lifecycle supersession.",
      }));
    }

    // --- Rule 3: Registry purchasable while lifecycle is draft ---
    if (reg.fields.purchasable === true && isDraft) {
      issues.push(makeIssue({
        title: `GMI ${identity}: purchasable while lifecycle is draft`,
        description: `Registry marks ${identity} as purchasable but lifecycle says ${lifeState}. Draft editions cannot be public checkout products.`,
        severity: "commercial_safety_blocker",
        domain: "gmi_publication_lifecycle",
        sourceOfTruth: SOURCE_OF_TRUTH_MAP.publicationLifecycle,
        observedSource: SOURCE_OF_TRUTH_MAP.gmiEditionMetadata,
        affectedItems: [identity],
        evidence: [`registry.purchasable=true`, `lifecycle.lifecycleState=${lifeState}`],
        recommendation: "Set purchasable false until lifecycle permits publication.",
      }));
    }
  }

  // --- Check content document frontmatter against lifecycle ---
  for (const doc of snapshot.contentDocuments) {
    const fm = doc.frontmatter || {};
    const docId = fm.docId || fm.id || fm.documentId || fm.productCode;
    if (!docId) continue;

    // Only check GMI documents
    if (!/^GMI/i.test(String(docId))) continue;

    const lifecycleState = fm.lifecycleState || fm.status || fm.publicationStatus;
    if (!lifecycleState) continue;

    const life = findRecordByIdentity(snapshot.lifecycleRecords, String(docId));
    if (!life) continue;

    const lifeState = String(life.fields.lifecycleState || "");

    // Compare frontmatter state to lifecycle authority
    if (String(lifecycleState).toUpperCase() !== lifeState.toUpperCase()) {
      // Determine if both are pre-publication states (admin-preparation mismatch)
      const fmIsPrePub = lifecycleIsPrePublication(String(lifecycleState));
      const lifeIsPrePub = lifecycleIsPrePublication(lifeState);
      const isAdminPrepMismatch = fmIsPrePub && lifeIsPrePub;

      issues.push(makeIssue({
        title: `${doc.file} frontmatter lifecycle differs from lifecycle authority`,
        description: `frontmatter=${lifecycleState}, lifecycle=${lifeState}`,
        severity: isAdminPrepMismatch ? "governed_tension" : "publication_lifecycle_conflict",
        domain: "publication_truth",
        governedTension: isAdminPrepMismatch ? true : undefined,
        blocksPublication: isAdminPrepMismatch ? false : true,
        sourceOfTruth: SOURCE_OF_TRUTH_MAP.publicationLifecycle,
        evidence: [`${doc.file}: lifecycle=${lifecycleState}`, `${life.sourceFile}: lifecycle=${lifeState}`],
        affectedItems: [doc.file, String(docId)],
        recommendation: isAdminPrepMismatch
          ? "Admin-preparation state mismatch. Align frontmatter to lifecycle enum for consistency, but this does not block publication."
          : "Synchronise frontmatter or remove duplicate lifecycle truth from content.",
      }));
    }
  }

  return issues;
}

// ─── Detector: Build / Environment ───────────────────────────────────────────

const URL_ENV_KEYS = ["NEXTAUTH_URL", "SITE_URL", "NEXT_PUBLIC_SITE_URL", "VERCEL_URL"];

function detectBuildEnvironmentContradictions(snapshot) {
  const issues = [];

  for (const envFile of snapshot.envFiles) {
    const text = readText(envFile);
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;

      const key = trimmed.slice(0, eqIdx).trim();
      let value = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");

      if (!URL_ENV_KEYS.includes(key)) continue;

      if (value === "") {
        issues.push(makeIssue({
          title: `${key} is empty in ${envFile}`,
          description: "Empty URL env values can cause invalid URL failures during Next.js build.",
          severity: "fatal_build_blocker",
          domain: "build_truth",
          evidence: [`${envFile}: ${key}=""`],
          affectedItems: [envFile, key],
          recommendation: "Remove empty value or set valid URL. Do not commit secrets.",
        }));
      }

      if (value && key !== "VERCEL_URL" && key.includes("URL") && !/^https?:\/\//i.test(value)) {
        issues.push(makeIssue({
          title: `${key} is not absolute in ${envFile}`,
          description: "URL env values should be valid absolute URLs unless explicitly handled.",
          severity: "fatal_build_blocker",
          domain: "build_truth",
          evidence: [`${envFile}: ${key}=${value.substring(0, 40)}`],
          affectedItems: [envFile, key],
          recommendation: "Set absolute URL or harden resolver.",
        }));
      }
    }
  }

  return issues;
}

// ─── Detector: Commercial Truth ──────────────────────────────────────────────

function detectCommercialContradictions(snapshot) {
  const issues = [];

  for (const product of snapshot.products) {
    const code = product.productCode;
    const cat = snapshot.catalogEntries[code];
    if (!cat) continue;

    const hasStripe = Boolean(cat.stripePriceId);
    const isBlocked = product.readiness?.readinessStatus === "blocked" || product.readiness?.releaseMode === "blocked";

    if (hasStripe && isBlocked) {
      issues.push(makeIssue({
        title: `${code} has Stripe metadata but checkout is denied`,
        description: "Stripe metadata exists but resolver action is blocked. Acceptable only if resolver and server checkout enforce the denial.",
        severity: "governed_tension",
        domain: "commercial_metadata",
        governedTension: true,
        affectedItems: [code],
        evidence: [`stripePriceId=${(cat.stripePriceId || "").substring(0, 10)}...`, `resolverAction=blocked`],
        recommendation: "Keep Stripe metadata, but ensure checkout permission remains resolver-controlled.",
      }));
    }
  }

  return issues;
}

// ─── Detector: Narrative Drift ───────────────────────────────────────────────

const SENSITIVE_TERMS = ["autonomous", "SaaS", "prediction engine", "tamper-proof", "guarantee", "guaranteed", "certified", "courtroom-grade"];

function detectNarrativeDrift(snapshot) {
  const issues = [];
  const targetFiles = [
    "pages/professionals.tsx", "pages/system.tsx", "pages/method.tsx",
    "pages/products.tsx", "pages/pricing.tsx", "pages/enterprise.tsx",
    "pages/oversight/index.tsx",
  ];

  for (const file of targetFiles) {
    if (!exists(file)) continue;
    const text = readText(file);
    const lines = text.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const lower = lines[i].toLowerCase();
      for (const term of SENSITIVE_TERMS) {
        if (lower.includes(term.toLowerCase())) {
          const allowed = lower.includes("not ") || lower.includes("is not") ||
                          lower.includes("not a") || lower.includes("unlike") ||
                          lower.includes("avoid");
          issues.push(makeIssue({
            title: `Narrative term "${term}" found in ${file}`,
            description: `Line ${i + 1}: ${lines[i].trim().substring(0, 100)}`,
            severity: allowed ? "informational_note" : "narrative_drift",
            domain: "public_narrative",
            affectedItems: [file],
            evidence: [`${file}:${i + 1}`],
            recommendation: allowed ? "Allowed as contrast/denial." : "Remove or rewrite.",
          }));
        }
      }
    }
  }

  return issues;
}

// ─── Classification ──────────────────────────────────────────────────────────

function classifyIssue(issue) {
  if (issue.blocksDeployment) {
    return { issueId: issue.id, type: "blocker", action: "Block deployment.", owner: "governance" };
  }
  if (issue.requiresOwnerDecision) {
    return { issueId: issue.id, type: "owner_decision_required", action: "Escalate for owner decision.", owner: "owner" };
  }
  if (issue.governedTension) {
    return { issueId: issue.id, type: "governed_tension", action: "Track as safe tension.", owner: "governance" };
  }
  return { issueId: issue.id, type: "monitor", action: "Track and resolve.", owner: "product_engineering" };
}

// ─── Report Composer ─────────────────────────────────────────────────────────

function composeMarkdownReport(report) {
  const { summary, issues, interventions, recommendations } = report;
  const lines = [];

  lines.push("# Living Estate Intelligence Report");
  lines.push("");
  lines.push(`Generated: ${report.generatedAt}`);
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  lines.push("| Metric | Count |");
  lines.push("|---|---:|");
  lines.push(`| Total issues | ${summary.totalIssues} |`);
  lines.push(`| Blocking issues | ${summary.blockingIssues} |`);
  lines.push(`| Owner decisions required | ${summary.ownerDecisionsRequired} |`);
  lines.push(`| Governed tensions | ${summary.governedTensions} |`);
  lines.push(`| Exit code | ${summary.exitCode} |`);
  lines.push("");
  lines.push("## Issues");
  lines.push("");

  for (const issue of issues) {
    lines.push(`### ${issue.id} — ${issue.title}`);
    lines.push("");
    lines.push(`- **Severity:** ${issue.severity}`);
    lines.push(`- **Domain:** ${issue.domain}`);
    lines.push(`- **Blocks deployment:** ${issue.blocksDeployment ? "YES" : "NO"}`);
    if (issue.governedTension) lines.push("- **Governed tension:** YES");
    lines.push(`- **Description:** ${issue.description}`);
    if (issue.evidence?.length) {
      lines.push("- **Evidence:**");
      for (const ev of issue.evidence) lines.push(`  - ${ev}`);
    }
    if (issue.affectedItems?.length) {
      lines.push(`- **Affected items:** ${issue.affectedItems.join(", ")}`);
    }
    lines.push(`- **Recommendation:** ${issue.recommendation}`);
    lines.push("");
  }

  lines.push("## Interventions");
  lines.push("");
  for (const inv of interventions) {
    lines.push(`- **${inv.issueId}** — ${inv.type}: ${inv.action} _(Owner: ${inv.owner})_`);
  }
  lines.push("");
  lines.push("## Recommendations");
  lines.push("");
  for (const rec of recommendations) {
    lines.push(`- **${rec.issueId}** (${rec.priority}): ${rec.recommendation}`);
  }
  lines.push("");
  lines.push("## Final Gate");
  lines.push("");
  if (summary.exitCode === 0) lines.push("✅ Living estate intelligence check passed.");
  else lines.push("❌ Living estate intelligence check failed.");
  lines.push("");

  return lines.join("\n");
}

// ─── Main ────────────────────────────────────────────────────────────────────

function main() {
  issueCounter = 1;

  heading("Living Estate Intelligence Check");
  const snapshot = loadEstateSnapshot();

  ok(`Products inspected: ${snapshot.products.length}`);
  ok(`Catalog entries parsed: ${Object.keys(snapshot.catalogEntries).length}`);
  ok(`Content documents inspected: ${snapshot.contentDocuments.length}`);
  ok(`Lifecycle records parsed: ${snapshot.lifecycleRecords.length}`);
  ok(`Registry records parsed: ${snapshot.registryRecords.length}`);

  heading("Running detectors");

  const detectorGroups = [
    ["GMI / Publication Lifecycle", detectGmiLifecycleContradictions],
    ["Commercial Truth", detectCommercialContradictions],
    ["Build / Environment", detectBuildEnvironmentContradictions],
    ["Narrative Drift", detectNarrativeDrift],
  ];

  const issues = [];
  for (const [label, detector] of detectorGroups) {
    const before = issues.length;
    const detected = detector(snapshot);
    issues.push(...detected);
    const count = issues.length - before;
    if (count === 0) ok(`${label}: no issues`);
    else warn(`${label}: ${count} issue(s)`);
  }

  const interventions = issues.map(classifyIssue);
  const recommendations = issues.map((issue) => ({
    issueId: issue.id,
    priority: issue.blocksDeployment ? "critical" : issue.requiresOwnerDecision ? "high" : issue.governedTension ? "low" : "medium",
    recommendation: issue.recommendation,
  }));

  const blockingIssues = issues.filter((i) => i.blocksDeployment);
  const ownerDecisions = issues.filter((i) => i.requiresOwnerDecision);
  const governedTensions = issues.filter((i) => i.governedTension);

  const summary = {
    totalIssues: issues.length,
    blockingIssues: blockingIssues.length,
    ownerDecisionsRequired: ownerDecisions.length,
    governedTensions: governedTensions.length,
    exitCode: blockingIssues.length > 0 ? 1 : 0,
  };

  const snapshotDigest = {
    productsInspected: snapshot.products.length,
    catalogEntries: Object.keys(snapshot.catalogEntries).length,
    contentDocuments: snapshot.contentDocuments.length,
    lifecycleRecords: snapshot.lifecycleRecords.length,
    registryRecords: snapshot.registryRecords.length,
  };

  const report = {
    generatedAt: new Date().toISOString(),
    sourceOfTruthMap: SOURCE_OF_TRUTH_MAP,
    snapshotDigest,
    summary,
    issues,
    interventions,
    recommendations,
  };

  writeJson(REPORT_JSON, report);
  writeText(REPORT_MD, composeMarkdownReport(report));

  heading("Results");
  console.log(`  Total issues:             ${summary.totalIssues}`);
  console.log(`  Blocking issues:          ${summary.blockingIssues}`);
  console.log(`  Owner decisions required: ${summary.ownerDecisionsRequired}`);
  console.log(`  Governed tensions:        ${summary.governedTensions}`);
  console.log("");

  if (blockingIssues.length > 0) {
    fail("Blocking issues detected:");
    for (const issue of blockingIssues) {
      console.log(`  - ${issue.id}: ${issue.title}`);
    }
    console.log("");
  }

  ok(`Wrote ${REPORT_JSON}`);
  ok(`Wrote ${REPORT_MD}`);
  console.log("");
  console.log("=".repeat(80));

  if (summary.exitCode === 0) {
    ok("LIVING ESTATE INTELLIGENCE CHECK PASSED");
    process.exit(0);
  } else {
    fail("LIVING ESTATE INTELLIGENCE CHECK FAILED");
    process.exit(1);
  }
}

main();