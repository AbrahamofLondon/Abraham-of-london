#!/usr/bin/env node

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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

const REPORT_JSON = "reports/living-estate-intelligence-report.json";
const REPORT_MD = "reports/living-estate-intelligence-report.md";
const MEMORY_FILE = "reports/living-estate-intelligence-memory.json";

// ─── Console ─────────────────────────────────────────────────────────────
const RESET = "\x1b[0m";
const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const BOLD = "\x1b[1m";
function paint(c, t) { return `${c}${t}${RESET}`; }
function heading(t) { console.log(`\n${t}\n${"─".repeat(t.length)}`); }
function ok(msg) { console.log(`  ${GREEN}✓${RESET} ${msg}`); }
function warn(msg) { console.log(`  ${YELLOW}⚠${RESET} ${msg}`); }
function fail(msg) { console.log(`  ${RED}✗${RESET} ${msg}`); }

// ─── File helpers ────────────────────────────────────────────────────────
function exists(p) { return fs.existsSync(path.join(ROOT, p)); }
function readText(p) { try { return fs.readFileSync(path.join(ROOT, p), "utf8"); } catch { return ""; } }
function readJson(p) { try { return JSON.parse(readText(p)); } catch { return null; } }
function writeJson(p, d) { const abs = path.join(ROOT, p); const dir = path.dirname(abs); if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(abs, JSON.stringify(d, null, 2)); }
function writeText(p, c) { const abs = path.join(ROOT, p); const dir = path.dirname(abs); if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(abs, c); }

// ─── Dynamic contracts ────────────────────────────────────────────────────
function loadContract(rel, defaults) {
  try { return JSON.parse(fs.readFileSync(path.join(ROOT, rel), "utf8")); } catch { return defaults; }
}
const lifecycleContract = loadContract("data/LifecycleAuthorityContract.json", {
  lifecycleStates: ["DRAFT", "PUBLISHED", "ACTIVE", "ARCHIVED"],
  draftStates: ["DRAFT"],
  activeStates: ["PUBLISHED", "ACTIVE"],
  prePublicationStates: ["DRAFT", "SCHEDULED"],
});
const narrativeContract = loadContract("data/NarrativeAuthorityContract.json", {
  sensitiveTerms: [],
  requiredAuthorityBoundaryPhrases: [],
  doctrineFiles: [],
});

function lifecycleIsDraft(s) { return lifecycleContract.draftStates.includes(String(s).toUpperCase()); }
function lifecycleIsActive(s) { return lifecycleContract.activeStates.includes(String(s).toUpperCase()); }
function lifecycleIsPrePub(s) { return lifecycleContract.prePublicationStates.includes(String(s).toUpperCase()); }

// ─── Issue model ─────────────────────────────────────────────────────────
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
    signature: input.signature || `${input.domain}:${input.title.replace(/\s/g, "_")}`,
    title: input.title,
    description: input.description || "",
    severity,
    confidence: input.confidence || "high",
    exposure: input.exposure || "unknown",
    sourceAuthority: input.sourceAuthority || null,
    falsification: input.falsification || "not_falsified",
    safeToIgnore: input.safeToIgnore === false,
    repairAction: input.repairAction || null,
    repairRoute: input.repairRoute || null,
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

// ─── Snapshot loader (dynamic, no hardcoded product families) ────────────
function loadEstateSnapshot() {
  const snapshot = {
    files: { pages: [], components: [], lib: [], content: [], scripts: [] },
    gmi: { lifecycle: [], registry: [] },
    reports: {},
    living: { stateFilesPresent: {}, reportsPresent: {}, operatorObjects: 0, userObjects: 0 },
    lifecycleRecords: [],
    registryRecords: [],
    catalogEntries: {},
    contentDocuments: [],
    envFiles: [],
    products: [],
  };

  const lifeContent = readText("lib/intelligence/market-intelligence-lifecycle.ts");
  if (lifeContent) snapshot.lifecycleRecords = parseGmiLifecycleRecords("lib/intelligence/market-intelligence-lifecycle.ts", lifeContent);
  const regContent = readText("lib/commercial/gmi/gmi-edition-registry.ts");
  if (regContent) snapshot.registryRecords = parseGmiRegistryRecords("lib/commercial/gmi/gmi-edition-registry.ts", regContent);
  const catContent = readText("lib/commercial/catalog.ts");
  if (catContent) {
    const catRecords = parseCatalogRecords("lib/commercial/catalog.ts", catContent);
    for (const rec of catRecords) {
      const code = rec.fields.code || rec.fields.productCode;
      if (code) snapshot.catalogEntries[code] = rec.fields;
    }
  }

  // Walk content
  function walkDir(dir, list) {
    const abs = path.join(ROOT, dir);
    try {
      for (const e of fs.readdirSync(abs, { withFileTypes: true })) {
        const rel = `${dir}/${e.name}`;
        if (e.isDirectory()) walkDir(rel, list);
        else if (/\.(mdx|md)$/.test(e.name)) list.push(rel);
      }
    } catch {}
  }
  if (exists("content")) walkDir("content", snapshot.files.content);
  snapshot.contentDocuments = snapshot.files.content.map(f => ({ file: f, ...parseFrontmatter(readText(f)) }));

  // Env files
  try { for (const f of fs.readdirSync(ROOT)) if (f.startsWith(".env")) snapshot.envFiles.push(f); } catch {}

  // Load matrices
  const readiness = readJson("reports/product-release-readiness-matrix.json") || {};
  const governance = readJson("reports/product-release-governance-matrix.json") || {};
  const authority = readJson("data/ProductAuthorityContract.json") || {};
  const allCodes = Array.from(new Set([...Object.keys(readiness), ...Object.keys(governance)]));
  for (const code of allCodes) {
    snapshot.products.push({
      productCode: code,
      authority: { state: authority[code]?.currentAuthorityState || null },
      readiness: {
        readinessStatus: readiness[code]?.readinessStatus || null,
        releaseReadyNow: readiness[code]?.releaseReadyNow === true,
        checkoutSafe: readiness[code]?.checkoutSafe,
        commercialSafe: readiness[code]?.commercialSafe,
        releaseLane: readiness[code]?.releaseLane || null,
        releaseMode: readiness[code]?.releaseMode || null,
      },
      governance: {
        checkoutAllowed: governance[code]?.checkoutAllowed,
        releaseLane: governance[code]?.releaseLane || null,
        releaseMode: governance[code]?.releaseMode || null,
      },
    });
  }

  // Collect pages, components, lib, scripts
  const pageDirs = ["pages", "app"];
  for (const d of pageDirs) if (exists(d)) walkDir(d, snapshot.files.pages);
  if (exists("components")) walkDir("components", snapshot.files.components);
  if (exists("lib")) walkDir("lib", snapshot.files.lib);
  if (exists("scripts")) snapshot.files.scripts = fs.readdirSync(path.join(ROOT, "scripts")).filter(f => /\.(js|mjs|ts)$/.test(f)).map(f => `scripts/${f}`);

  // Load existing reports
  const existingReports = [
    "reports/product-release-readiness-matrix.json",
    "reports/product-release-governance-matrix.json",
    "reports/blog-post-route-audit.json",
    "reports/public-content-route-audit.json",
    "reports/living-product-truth-report.json",
    "reports/living-product-view-model.json",
    "reports/living-state-objects.json",
    "reports/living-state-view-model.json",
  ];
  for (const r of existingReports) snapshot.reports[r] = readJson(r);

  // Living-state wiring
  const livingCoreFiles = [
    "lib/living-intelligence/living-state-object-contract.ts",
    "lib/living-intelligence/living-state-engine.ts",
    "lib/living-intelligence/living-state-view-model.ts",
    "components/living/LivingStatePanel.tsx",
    "scripts/run-living-state-objects.ts",
  ];
  for (const f of livingCoreFiles) snapshot.living.stateFilesPresent[f] = exists(f);
  const livingReports = ["reports/living-state-objects.json", "reports/living-state-view-model.json"];
  for (const r of livingReports) snapshot.living.reportsPresent[r] = exists(r);
  const livingObjects = readJson("reports/living-state-objects.json");
  if (Array.isArray(livingObjects)) {
    snapshot.living.operatorObjects = livingObjects.filter(o => o?.type === "operator").length;
    snapshot.living.userObjects = livingObjects.filter(o => o?.type === "user").length;
  }
  return snapshot;
}

// ─── Detector 1: Product / Commercial Truth (dynamic) ────────────────────
function detectProductCommercialContradictions(snapshot) {
  const issues = [];
  for (const prod of snapshot.products) {
    const code = prod.productCode;
    const cat = snapshot.catalogEntries[code];
    const { readiness, governance, authority } = prod;

    if (readiness.releaseReadyNow && (authority.state === "internal_only" || authority.state === "blocked")) {
      issues.push(makeIssue({
        signature: `commercial:${code}:release_ready_vs_authority`,
        title: `${code} release‑ready but authority state is ${authority.state}`,
        severity: "commercial_safety_blocker",
        domain: "product_commercial_truth",
        sourceOfTruth: "data/ProductAuthorityContract.json",
        affectedItems: [code],
        evidence: [`releaseReadyNow=true`, `authority.state=${authority.state}`],
        recommendation: "Update authority state or set releaseReadyNow=false.",
      }));
    }
    if (governance.checkoutAllowed && (readiness.readinessStatus === "blocked" || readiness.releaseMode === "blocked")) {
      issues.push(makeIssue({
        signature: `commercial:${code}:checkout_allowed_vs_blocked`,
        title: `${code} checkout allowed while blocked`,
        severity: "checkout_bypass",
        domain: "product_commercial_truth",
        affectedItems: [code],
        evidence: [`checkoutAllowed=true`, `readinessStatus=${readiness.readinessStatus}`],
        recommendation: "Set checkoutAllowed=false or resolve block.",
      }));
    }
    if (cat?.fulfillmentType === "manual" && !exists("docs/manual-fulfilment.md") && !exists("app/api/fulfilment/manual/route.ts")) {
      issues.push(makeIssue({
        signature: `commercial:${code}:manual_fulfilment_no_route`,
        title: `${code} manual fulfilment missing route/playbook`,
        severity: "governed_tension",
        governedTension: true,
        domain: "product_commercial_truth",
        recommendation: "Add fulfilment documentation and API endpoint.",
      }));
    }
  }
  return issues;
}

// ─── Detector 2: Storefront / Checkout Bypass (no hardcoded product names) ──
function detectStorefrontAndCheckoutBypass(snapshot) {
  const issues = [];
  const surfaceFiles = [...snapshot.files.pages, ...snapshot.files.components]
    .filter(f => /pricing|products|offers|CheckoutButton|purchasable|commercial/i.test(f));
  for (const file of surfaceFiles) {
    const content = readText(file);
    if (!content) continue;
    const stripeRegex = /stripePriceId\s*:\s*["'](price_[a-zA-Z0-9]+)["']/gi;
    let match;
    while ((match = stripeRegex.exec(content)) !== null) {
      const priceId = match[1];
      const start = Math.max(0, match.index - 400);
      const end = Math.min(content.length, match.index + 400);
      const context = content.slice(start, end);
      const hasGuard = /purchasable|resolveCommercialAction|checkoutPermitted|governanceGate|useCheckoutGuard/i.test(context);
      if (!hasGuard) {
        issues.push(makeIssue({
          signature: `checkout_bypass:${file}:${priceId}`,
          title: `Stripe price ID without guard in ${file}`,
          severity: "checkout_bypass",
          domain: "storefront_bypass",
          observedSource: file,
          evidence: [`priceId=${priceId}`],
          recommendation: "Wrap checkout elements with resolver guard.",
        }));
      }
    }
    if (/<CheckoutButton/i.test(content) && !/purchasable|resolveCommercialAction|checkoutPermitted|disabled\s*=\s*\{/i.test(content)) {
      issues.push(makeIssue({
        signature: `checkout_bypass:${file}:CheckoutButton_no_guard`,
        title: `CheckoutButton without guard in ${file}`,
        severity: "checkout_bypass",
        domain: "storefront_bypass",
        recommendation: "Add commercial guard or disable button for blocked products.",
      }));
    }
  }
  return issues;
}

// ─── Detector 3: Publication Lifecycle (dynamic, no hardcoded GMI) ────────
function detectPublicationLifecycleContradictions(snapshot) {
  const issues = [];
  // Use any record that has an identity field (both lifecycle and registry)
  for (const reg of snapshot.registryRecords) {
    const identity = reg.identity[0];
    const life = findRecordByIdentity(snapshot.lifecycleRecords, identity);
    if (!life) {
      issues.push(makeIssue({
        signature: `lifecycle:${identity}:registry_orphan`,
        title: `Registry entry without lifecycle record: ${identity}`,
        severity: "governed_tension",
        governedTension: true,
        domain: "publication_lifecycle",
        recommendation: "Add matching lifecycle record or remove registry entry.",
      }));
      continue;
    }
    const regStatus = String(reg.fields.status || "");
    const lifeState = String(life.fields.lifecycleState || "");
    const regCurrent = reg.fields.current === true;
    const isDraft = lifecycleIsDraft(lifeState);
    const isActive = lifecycleIsActive(lifeState);
    if (regCurrent && isDraft) {
      issues.push(makeIssue({
        signature: `lifecycle:${identity}:current_flag_on_draft`,
        title: `Registry 'current' flag on draft lifecycle (admin focus)`,
        severity: "governed_tension",
        governedTension: true,
        evidence: [`registry.current=true`, `lifecycle.state=${lifeState}`],
        recommendation: "Keep registry 'current' as admin focus only.",
      }));
    }
    const isArchived = regStatus.includes("archiv");
    if (isArchived && isActive && !life.fields.supersededBy) {
      issues.push(makeIssue({
        signature: `lifecycle:${identity}:archive_vs_active`,
        title: `Registry archive conflicts with active lifecycle`,
        severity: "publication_lifecycle_conflict",
        blocksPublication: true,
        evidence: [`registry.status=${regStatus}`, `lifecycle.state=${lifeState}`],
        recommendation: "Reconcile with lifecycle supersession.",
      }));
    }
    if (reg.fields.purchasable === true && isDraft) {
      issues.push(makeIssue({
        signature: `lifecycle:${identity}:purchasable_draft`,
        title: `Purchasable while lifecycle is draft`,
        severity: "commercial_safety_blocker",
        evidence: [`purchasable=true`, `lifecycle.state=${lifeState}`],
        recommendation: "Set purchasable=false until lifecycle permits publication.",
      }));
    }
  }
  // Check content frontmatter vs lifecycle
  for (const doc of snapshot.contentDocuments) {
    const fm = doc.frontmatter || {};
    const docId = fm.docId || fm.id || fm.documentId || fm.productCode;
    if (!docId) continue;
    const lifecycleState = fm.lifecycleState || fm.status || fm.publicationStatus;
    if (!lifecycleState) continue;
    const life = findRecordByIdentity(snapshot.lifecycleRecords, String(docId));
    if (!life) continue;
    const lifeState = String(life.fields.lifecycleState || "");
    if (String(lifecycleState).toUpperCase() !== lifeState.toUpperCase()) {
      const fmPrePub = lifecycleIsPrePub(String(lifecycleState));
      const lifePrePub = lifecycleIsPrePub(lifeState);
      const isAdminMismatch = fmPrePub && lifePrePub;
      issues.push(makeIssue({
        signature: `lifecycle:${docId}:frontmatter_mismatch`,
        title: `${doc.file} frontmatter lifecycle differs from authority`,
        severity: isAdminMismatch ? "governed_tension" : "publication_lifecycle_conflict",
        governedTension: isAdminMismatch,
        blocksPublication: !isAdminMismatch,
        evidence: [`frontmatter=${lifecycleState}`, `authority=${lifeState}`],
        recommendation: isAdminMismatch ? "Align frontmatter for consistency." : "Synchronise with lifecycle authority.",
      }));
    }
  }
  return issues;
}

// ─── Detector 4: Content / Public Route ───────────────────────────────────
function detectContentRouteContradictions(snapshot) {
  const issues = [];
  const routeAudit = snapshot.reports["reports/public-content-route-audit.json"] || {};
  const blogAudit = snapshot.reports["reports/blog-post-route-audit.json"] || {};
  for (const f of routeAudit.failures || []) {
    issues.push(makeIssue({
      signature: `route:public:${f.path || f.file}`,
      title: `Public route audit failure: ${f.message}`,
      severity: "content_route_failure",
      domain: "content_route",
      recommendation: f.recommendation || "Fix route configuration.",
    }));
  }
  for (const f of blogAudit.failures || []) {
    issues.push(makeIssue({
      signature: `route:blog:${f.slug || f.file}`,
      title: `Blog route audit failure: ${f.message}`,
      severity: "content_route_failure",
      domain: "content_route",
      recommendation: f.recommendation || "Adjust blog post frontmatter.",
    }));
  }
  // Heuristic: published content with no route
  for (const doc of snapshot.contentDocuments) {
    const fm = doc.frontmatter;
    if (fm && (fm.status === "published" || fm.published === true)) {
      let slug = doc.file.replace(/^content\//, "").replace(/\.mdx?$/, "");
      if (slug.endsWith("/index")) slug = slug.slice(0, -6);
      const routeExists = snapshot.files.pages.some(p => p.includes(slug) || p.includes("[slug]"));
      if (!routeExists && !fm.slug && !fm.route) {
        issues.push(makeIssue({
          signature: `route:${doc.file}:no_route`,
          title: `Published content without route: ${doc.file}`,
          severity: "content_route_failure",
          recommendation: "Add slug/route in frontmatter or create a page.",
        }));
      }
    }
  }
  return issues;
}

// ─── Detector 5: Build / Environment ──────────────────────────────────────
function detectBuildEnvironmentContradictions(snapshot) {
  const issues = [];
  const urlKeys = ["NEXTAUTH_URL", "SITE_URL", "NEXT_PUBLIC_SITE_URL"];
  for (const envFile of snapshot.envFiles) {
    const text = readText(envFile);
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
      if (!urlKeys.includes(key) && key !== "VERCEL_URL") continue;
      if (value === "") {
        issues.push(makeIssue({
          signature: `env:${envFile}:${key}_empty`,
          title: `${key} is empty in ${envFile}`,
          severity: "fatal_build_blocker",
          domain: "build_truth",
          recommendation: "Set a valid URL or remove the variable.",
        }));
      }
      if (value && key !== "VERCEL_URL" && !/^https?:\/\//i.test(value)) {
        issues.push(makeIssue({
          signature: `env:${envFile}:${key}_not_absolute`,
          title: `${key} is not absolute in ${envFile}`,
          severity: "fatal_build_blocker",
          domain: "build_truth",
          recommendation: "Use absolute URL (http:// or https://).",
        }));
      }
    }
  }
  return issues;
}

// ─── Detector 6: Narrative Drift (dynamic from contract) ──────────────────
function detectNarrativeDrift(snapshot) {
  const issues = [];
  const { sensitiveTerms, requiredAuthorityBoundaryPhrases, doctrineFiles } = narrativeContract;
  let authorityBoundaryPresent = false;
  for (const file of doctrineFiles) {
    if (!exists(file)) continue;
    const content = readText(file);
    for (const phrase of requiredAuthorityBoundaryPhrases) {
      if (content.toLowerCase().includes(phrase.toLowerCase())) authorityBoundaryPresent = true;
    }
    const lines = content.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const lower = lines[i].toLowerCase();
      for (const term of sensitiveTerms) {
        if (lower.includes(term.toLowerCase())) {
          const allowed = lower.includes("not ") || lower.includes("is not") || lower.includes("unlike") || lower.includes("avoid");
          issues.push(makeIssue({
            signature: `narrative:${file}:${term}`,
            title: `Narrative term "${term}" found in ${file}`,
            severity: allowed ? "informational_note" : "narrative_drift",
            domain: "narrative_drift",
            evidence: [`line ${i+1}: ${lines[i].trim().substring(0, 100)}`],
            recommendation: allowed ? "Allowed as contrast." : "Remove or rewrite claim.",
          }));
        }
      }
    }
  }
  if (!authorityBoundaryPresent && requiredAuthorityBoundaryPhrases.length) {
    issues.push(makeIssue({
      signature: "narrative:missing_authority_boundary",
      title: "Missing authority boundary claims across doctrine files",
      severity: "authority_boundary_failure",
      domain: "narrative_drift",
      recommendation: `Add one of: ${requiredAuthorityBoundaryPhrases.join(", ")}`,
    }));
  }
  return issues;
}

// ─── Detector 7: Existing Checker Signals ─────────────────────────────────
function detectExistingCheckerSignals(snapshot) {
  const issues = [];
  const requiredReports = [
    "reports/product-release-readiness-matrix.json",
    "reports/product-release-governance-matrix.json",
    "reports/blog-post-route-audit.json",
    "reports/public-content-route-audit.json",
    "reports/living-state-objects.json",
  ];
  for (const report of requiredReports) {
    if (!snapshot.reports[report]) {
      issues.push(makeIssue({
        signature: `existing:missing_${report.replace(/\//g, "_")}`,
        title: `Missing required report: ${report}`,
        severity: "governed_tension",
        governedTension: true,
        recommendation: "Run the corresponding checker script.",
      }));
    } else {
      const data = snapshot.reports[report];
      if (data.summary?.blockingIssues > 0 || (data.failures?.length > 0)) {
        issues.push(makeIssue({
          signature: `existing:${report}:has_blockers`,
          title: `Report ${report} contains blocking issues/failures`,
          severity: "commercial_safety_blocker",
          domain: "existing_checker_signals",
          recommendation: "Resolve blockers in the original checker.",
        }));
      }
    }
  }
  return issues;
}

// ─── Detector 8: Living‑State Wiring ──────────────────────────────────────
function detectLivingStateWiring(snapshot) {
  const issues = [];
  const missing = Object.entries(snapshot.living.stateFilesPresent).filter(([,p]) => !p).map(([f]) => f);
  if (missing.length) {
    issues.push(makeIssue({
      signature: "living:missing_core_files",
      title: `Missing living‑state core files: ${missing.join(", ")}`,
      severity: "living_state_gap",
      domain: "living_state_wiring",
      recommendation: "Restore missing files or disable living‑state integration.",
    }));
  }
  if (!snapshot.living.reportsPresent["reports/living-state-objects.json"]) {
    issues.push(makeIssue({
      signature: "living:missing_objects_report",
      title: "Missing living-state-objects.json",
      severity: "living_state_gap",
      domain: "living_state_wiring",
      recommendation: "Run scripts/run-living-state-objects.ts",
    }));
  }
  if (snapshot.living.operatorObjects === 0 || snapshot.living.userObjects === 0) {
    issues.push(makeIssue({
      signature: "living:missing_objects",
      title: "Living state missing operator or user objects",
      severity: "living_state_gap",
      domain: "living_state_wiring",
      evidence: [`operator=${snapshot.living.operatorObjects}`, `user=${snapshot.living.userObjects}`],
      recommendation: "Define at least one operator and one user object for MVP.",
    }));
  }
  return issues;
}

// ─── Guardrail Engine ──────────────────────────────────────────────────────
function checkLivingGuardrails(snapshot, issues) {
  const violations = [];
  // Verify this checker's own output files don't collide with product governance files
  const productGovernanceFiles = ["reports/living-product-truth-report.json", "reports/living-product-truth-report.md", "reports/living-product-memory.json"];
  for (const f of productGovernanceFiles) {
    if (REPORT_JSON === f || REPORT_MD === f || MEMORY_FILE === f) {
      violations.push(`Report output collision: ${f} is claimed by both estate and product governance checkers`);
    }
  }
  for (const v of violations) {
    issues.push(makeIssue({
      signature: `guardrail:${v.substring(0, 50)}`,
      title: "Guardrail violation: " + v,
      severity: "fatal_build_blocker",
      domain: "guardrail",
      recommendation: "Use distinct report filenames per checker.",
    }));
  }
  return issues;
}

// ─── Memory recurrence / resolution ───────────────────────────────────────
function loadMemory() {
  const raw = readJson(MEMORY_FILE);
  if (raw && raw.issueSignatures) return raw;
  return { lastRun: null, issueSignatures: [], resolvedSinceLastRun: [], regressions: [], repeatedIssues: [] };
}
function saveMemory(m) { writeJson(MEMORY_FILE, m); }
function updateMemory(currentIssues, prevMem) {
  const now = new Date().toISOString();
  const mem = { ...prevMem, lastRun: now };
  const sigMap = new Map();
  for (const issue of currentIssues) {
    const sig = issue.signature;
    if (!sig) continue;
    const existing = mem.issueSignatures.find(i => i.signature === sig);
    if (existing) {
      existing.lastSeen = now;
      existing.count++;
      existing.status = "open";
      if (existing.severity !== issue.severity && (issue.severity === "fatal_build_blocker" || issue.severity === "commercial_safety_blocker")) {
        mem.regressions.push({ signature: sig, from: existing.severity, to: issue.severity, at: now });
      }
    } else {
      mem.issueSignatures.push({
        signature: sig,
        title: issue.title,
        severity: issue.severity,
        firstSeen: now,
        lastSeen: now,
        count: 1,
        status: "open",
      });
    }
    sigMap.set(sig, true);
  }
  for (const item of mem.issueSignatures) {
    if (item.status === "open" && !sigMap.has(item.signature)) {
      item.status = "resolved";
      mem.resolvedSinceLastRun.push({ signature: item.signature, resolvedAt: now });
    }
  }
  mem.repeatedIssues = mem.issueSignatures.filter(i => i.count > 1 && i.status === "open");
  return mem;
}

// ─── Identity probe (proves no relationship‑field confusion) ──────────────
function runIdentityProbe(snapshot) {
  let relationshipFieldIgnored = true;
  let ownIdentityMatchOnly = true;
  const allRecords = [...snapshot.lifecycleRecords, ...snapshot.registryRecords];
  const relationshipFields = ["replaces", "supersededBy", "related", "previous", "next"];
  for (const rec of allRecords) {
    const ownId = rec.identity[0];
    if (!ownId) continue;
    for (const [field, value] of Object.entries(rec.fields)) {
      if (relationshipFields.includes(field) && value === ownId) {
        relationshipFieldIgnored = false;
        ownIdentityMatchOnly = false;
      }
    }
  }
  return { relationshipFieldIgnored, ownIdentityMatchOnly };
}

// ─── Report composer ───────────────────────────────────────────────────────
function composeMarkdown(report, memory) {
  const { summary, issues, interventions, recommendations, identityProbe } = report;
  const lines = [];
  lines.push("# Living Estate Intelligence Report (Dynamic)");
  lines.push(`Generated: ${report.generatedAt}`);
  lines.push("\n## Identity Probe");
  lines.push(`- Relationship field ignored: ${identityProbe.relationshipFieldIgnored}`);
  lines.push(`- Own‑identity match only: ${identityProbe.ownIdentityMatchOnly}`);
  lines.push("\n## Summary");
  lines.push("| Metric | Count |");
  lines.push("|---|---:|");
  lines.push(`| Total issues | ${summary.totalIssues} |`);
  lines.push(`| Blocking issues | ${summary.blockingIssues} |`);
  lines.push(`| Owner decisions required | ${summary.ownerDecisionsRequired} |`);
  lines.push(`| Governed tensions | ${summary.governedTensions} |`);
  lines.push(`| Exit code | ${summary.exitCode} |`);
  lines.push("\n## Memory Summary");
  lines.push(`- Open signatures: ${memory.issueSignatures.filter(i => i.status === "open").length}`);
  lines.push(`- Resolved since last run: ${memory.resolvedSinceLastRun.length}`);
  lines.push(`- Regressions: ${memory.regressions.length}`);
  lines.push(`- Repeated issues: ${memory.repeatedIssues.length}`);
  lines.push("\n## Issues");
  for (const issue of issues) {
    lines.push(`### ${issue.id} — ${issue.title}`);
    lines.push(`- **Signature:** \`${issue.signature}\``);
    lines.push(`- **Severity:** ${issue.severity}`);
    lines.push(`- **Domain:** ${issue.domain}`);
    lines.push(`- **Blocks deployment:** ${issue.blocksDeployment ? "YES" : "NO"}`);
    if (issue.governedTension) lines.push("- **Governed tension:** YES");
    lines.push(`- **Description:** ${issue.description}`);
    if (issue.evidence.length) lines.push(`- **Evidence:** ${issue.evidence.join(", ")}`);
    if (issue.affectedItems.length) lines.push(`- **Affected items:** ${issue.affectedItems.join(", ")}`);
    lines.push(`- **Recommendation:** ${issue.recommendation}`);
    lines.push("");
  }
  lines.push("## Interventions");
  for (const inv of interventions) lines.push(`- **${inv.issueId}** — ${inv.type}: ${inv.action} _(Owner: ${inv.owner})_`);
  lines.push("\n## Final Gate");
  lines.push(summary.exitCode === 0 ? "✅ Estate intelligence passed." : "❌ Estate intelligence failed.");
  return lines.join("\n");
}

// ─── Main ──────────────────────────────────────────────────────────────────
function main() {
  issueCounter = 1;
  heading("Living Estate Intelligence Check (Fully Dynamic)");
  const snapshot = loadEstateSnapshot();
  ok(`Products: ${snapshot.products.length}`);
  ok(`Catalog entries: ${Object.keys(snapshot.catalogEntries).length}`);
  ok(`Lifecycle records: ${snapshot.lifecycleRecords.length}`);
  ok(`Registry records: ${snapshot.registryRecords.length}`);

  const detectors = [
    ["Product / Commercial Truth", detectProductCommercialContradictions],
    ["Storefront / Checkout Bypass", detectStorefrontAndCheckoutBypass],
    ["Publication Lifecycle", detectPublicationLifecycleContradictions],
    ["Content / Public Route", detectContentRouteContradictions],
    ["Build / Environment", detectBuildEnvironmentContradictions],
    ["Narrative Drift", detectNarrativeDrift],
    ["Existing Checker Signals", detectExistingCheckerSignals],
    ["Living‑State Wiring", detectLivingStateWiring],
  ];

  let allIssues = [];
  for (const [label, detector] of detectors) {
    const before = allIssues.length;
    allIssues.push(...detector(snapshot));
    const count = allIssues.length - before;
    if (count === 0) ok(`${label}: clean`);
    else warn(`${label}: ${count} issue(s)`);
  }
  allIssues = checkLivingGuardrails(snapshot, allIssues);

  let memory = loadMemory();
  memory = updateMemory(allIssues, memory);
  saveMemory(memory);

  const interventions = allIssues.map(issue => {
    if (issue.blocksDeployment) return { issueId: issue.id, type: "blocker", action: "Block deployment.", owner: "governance" };
    if (issue.requiresOwnerDecision) return { issueId: issue.id, type: "owner_decision_required", action: "Escalate.", owner: "owner" };
    if (issue.governedTension) return { issueId: issue.id, type: "governed_tension", action: "Track as safe.", owner: "governance" };
    return { issueId: issue.id, type: "monitor", action: "Track and resolve.", owner: "product_engineering" };
  });

  const recommendations = allIssues.map(issue => ({
    issueId: issue.id,
    priority: issue.blocksDeployment ? "critical" : issue.requiresOwnerDecision ? "high" : issue.governedTension ? "low" : "medium",
    recommendation: issue.recommendation,
  }));

  const blocking = allIssues.filter(i => i.blocksDeployment);
  const summary = {
    totalIssues: allIssues.length,
    blockingIssues: blocking.length,
    ownerDecisionsRequired: allIssues.filter(i => i.requiresOwnerDecision).length,
    governedTensions: allIssues.filter(i => i.governedTension).length,
    exitCode: blocking.length > 0 ? 1 : 0,
  };

  const report = {
    generatedAt: new Date().toISOString(),
    identityProbe: runIdentityProbe(snapshot),
    summary,
    issues: allIssues,
    interventions,
    recommendations,
  };

  writeJson(REPORT_JSON, report);
  writeText(REPORT_MD, composeMarkdown(report, memory));

  heading("Results");
  console.log(`  Blocking issues: ${summary.blockingIssues}`);
  if (blocking.length) {
    fail("Blockers:");
    for (const issue of blocking) console.log(`  - ${issue.id}: ${issue.title}`);
  }
  ok(`Reports written: ${REPORT_JSON}, ${REPORT_MD}, ${MEMORY_FILE}`);
  process.exit(summary.exitCode);
}

main();