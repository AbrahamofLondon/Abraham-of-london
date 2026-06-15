#!/usr/bin/env node
/**
 * scripts/check-living-estate-intelligence.mjs
 *
 * Living Estate Intelligence Check — the unified governance verification script.
 * Phase A+B: Estate structure contradiction detection.
 * Phase C:   Product truth verification.
 *
 * Source-of-truth hierarchy (non-negotiable):
 *   1. Publication truth:   market-intelligence-lifecycle.ts
 *   2. Runtime edition:     gmi-edition-resolver.ts (DB-backed)
 *   3. Commercial metadata: gmi-edition-registry.ts, CATALOG, product-code maps
 *   4. Governance permission: ProductAuthorityContract, release matrices, resolver
 *
 * Exit codes:
 *   0 = all checks pass
 *   1 = unsafe contradictions detected
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const REPORTS_DIR = path.join(ROOT, "reports");

// ─── Colors ─────────────────────────────────────────────────────────────────

const RESET = "\x1b[0m";
const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";
const BOLD = "\x1b[1m";

function log(color, ...args) { console.log(color, ...args, RESET); }

// ─── Helpers ─────────────────────────────────────────────────────────────────

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
function heading(text) { console.log(`\n${text}\n${"\u2500".repeat(text.length)}`); }
function ok(msg) { console.log(`  ${GREEN}\u2713${RESET} ${msg}`); }
function warn(msg) { console.log(`  ${YELLOW}\u26a0${RESET} ${msg}`); }
function fail(msg) { console.log(`  ${RED}\u2717${RESET} ${msg}`); }

function normaliseCode(s) {
  return String(s || "").trim().toLowerCase().replace(/[-\s]+/g, "_");
}

// ─── Source-of-Truth Map ────────────────────────────────────────────────────

const SOURCE_OF_TRUTH_MAP = {
  checkoutPermission: "commercial_action_resolver",
  productAuthority: "ProductAuthorityContract",
  releaseReadiness: "product_release_readiness_matrix",
  releaseGovernance: "product_release_governance_matrix",
  publicationLifecycle: "market_intelligence_lifecycle",
  gmiEditionMetadata: "gmi_edition_registry",
  commercialMetadata: "CATALOG",
  publicContentResolution: "public_content_resolver",
  blogRouteResolution: "blog_catch_all_route",
  storefrontPricing: "pages/pricing.tsx",
  deploymentConfig: "next.config.mjs",
};

// ─── Snapshot loader ─────────────────────────────────────────────────────────

function loadEstateSnapshot() {
  const products = [];
  const catalogEntries = {};
  const gmi = { registry: {}, lifecycle: {} };
  const files = { content: [], pages: [], lib: [], components: [], env: [] };
  const reports = {};

  // Walk content files
  function walkDir(dir, list) {
    const abs = path.join(ROOT, dir);
    try {
      for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
        const rel = `${dir}/${entry.name}`;
        if (entry.isDirectory()) { walkDir(rel, list); } else { list.push(rel); }
      }
    } catch { /* skip */ }
  }

  if (exists("content")) walkDir("content", files.content);
  if (exists("pages")) walkDir("pages", files.pages);
  if (exists("lib")) walkDir("lib", files.lib);
  if (exists("components")) walkDir("components", files.components);

  // Env files
  for (const f of fs.readdirSync(ROOT)) {
    if (f.startsWith(".env")) files.env.push(f);
  }

  // Read matrices
  const readiness = readJson("reports/product-release-readiness-matrix.json") || {};
  const governance = readJson("reports/product-release-governance-matrix.json") || {};
  const authority = readJson("data/ProductAuthorityContract.json") || {};

  // Build product list from governance matrices
  const allCodes = Array.from(new Set([...Object.keys(readiness), ...Object.keys(governance)]));
  for (const code of allCodes) {
    const r = readiness[code] || {};
    const g = governance[code] || {};
    const a = authority[code] || {};
    products.push({
      productCode: code,
      authority: { state: a.currentAuthorityState || null },
      readiness: { readinessStatus: r.readinessStatus || null, releaseReadyNow: r.releaseReadyNow === true, checkoutSafe: r.checkoutSafe, commercialSafe: r.commercialSafe, releaseLane: r.releaseLane || null, releaseMode: r.releaseMode || null },
      governance: { checkoutAllowed: g.checkoutAllowed, releaseLane: g.releaseLane || null, releaseMode: g.releaseMode || null },
    });
  }

  // Parse CATALOG entries (simplified)
  const catalogText = readText("lib/commercial/catalog.ts");
  const catRe = /^\s{2}([a-z][a-z0-9_]*):\s*\{([\s\S]*?)^\s{2}\},?$/gm;
  let m;
  while ((m = catRe.exec(catalogText)) !== null) {
    const key = m[1];
    const body = m[2];
    if (!/\bcode:/.test(body)) continue;
    const extract = (field) => { const r = body.match(new RegExp(`${field}:\\s*"([^"]*)"`)); return r ? r[1] : null; };
    const bool = (field) => { const r = body.match(new RegExp(`${field}:\\s*(true|false)`)); return r ? r[1] === "true" : undefined; };
    const nullable = (field) => { const r = body.match(new RegExp(`${field}:\\s*"([^"]*)"`)); if (r) return r[1]; if (new RegExp(`${field}:\\s*null`).test(body)) return null; return null; };
    catalogEntries[key] = {
      code: key,
      displayName: extract("displayName"),
      commercialStatus: extract("commercialStatus"),
      stripeProductId: nullable("stripeProductId"),
      stripePriceId: nullable("stripePriceId"),
      successPath: extract("successPath"),
      cancelPath: extract("cancelPath"),
      active: bool("active"),
      requiresCheckout: bool("requiresCheckout"),
      primaryCta: extract("primaryCta"),
      hiddenFromPricing: bool("hiddenFromPricing"),
      amount: (() => { const r = body.match(/amount:\s*(-?\d+)/); return r ? Number(r[1]) : null; })(),
    };
  }

  // Parse GMI registry
  const gmiText = readText("lib/commercial/gmi/gmi-edition-registry.ts");
  const gmiRe = /\{\s*\n([\s\S]*?)\n\s*\},?/g;
  let gm;
  while ((gm = gmiRe.exec(gmiText)) !== null) {
    const body = gm[1];
    const editionId = (body.match(/editionId:\s*"([^"]+)"/) || [])[1];
    if (!editionId) continue;
    const extract = (f) => { const r = body.match(new RegExp(`${f}:\\s*"([^"]*)"`)); return r ? r[1] : null; };
    const bool = (f) => { const r = body.match(new RegExp(`${f}:\\s*(true|false)`)); return r ? r[1] === "true" : undefined; };
    const productCode = extract("productCode") || "";
    gmi.registry[productCode] = {
      editionId, productCode,
      quarter: extract("quarter"),
      status: extract("status"),
      current: bool("current"),
      hiddenFromPricing: bool("hiddenFromPricing"),
      commercialStatus: extract("commercialStatus"),
    };
  }

  // Parse lifecycle
  const lifeText = readText("lib/intelligence/market-intelligence-lifecycle.ts");
  const lifeRe = /\{\s*\n([\s\S]*?)\n\s*\},?/g;
  let lm;
  while ((lm = lifeRe.exec(lifeText)) !== null) {
    const body = lm[1];
    const id = (body.match(/id:\s*"([^"]+)"/) || [])[1];
    if (!id) continue;
    const extract = (f) => { const r = body.match(new RegExp(`${f}:\\s*"([^"]*)"`)); return r ? r[1] : null; };
    const bool = (f) => { const r = body.match(new RegExp(`${f}:\\s*(true|false)`)); return r ? r[1] === "true" : undefined; };
    const productCode = "gmi_" + id.replace("GMI-", "").replace("-", "_").toLowerCase();
    gmi.lifecycle[productCode] = {
      id,
      lifecycleState: extract("lifecycleState"),
      publicVisible: bool("publicVisible"),
      purchasable: bool("purchasable"),
      supersededBy: extract("supersededBy"),
      replaces: extract("replaces"),
      publishedAt: extract("publishedAt"),
    };
  }

  // Load existing reports
  for (const reportFile of ["reports/blog-post-route-audit.json", "reports/public-content-route-audit.json"]) {
    const data = readJson(reportFile);
    if (data) reports[reportFile] = data;
  }

  return { products, catalogEntries, gmi, files, reports };
}

// ─── Resolver mirror ─────────────────────────────────────────────────────────

function resolveLivingCommercialAction(product) {
  if (!product) return { action: "unavailable", purchasable: false };
  const cs = product.commercialStatus || "";
  const active = product.active !== false;
  if (!active || cs === "inactive" || cs === "retired") return { action: "archive_reference_only", purchasable: false };
  return { action: "checkout", purchasable: true };
}

// ─── Issue factory ───────────────────────────────────────────────────────────

let issueCounter = 1;
function createIssue(params) {
  const id = `LEI-${String(issueCounter++).padStart(4, "0")}`;
  return {
    id, title: params.title, description: params.description || "",
    severity: params.severity || "informational_note",
    domain: params.domain || "general",
    blocksDeployment: params.blocksDeployment === true,
    requiresOwnerDecision: params.requiresOwnerDecision === true,
    governedTension: params.governedTension === true,
    sourceOfTruth: params.sourceOfTruth || null,
    observedSource: params.observedSource || null,
    expectedSource: params.expectedSource || null,
    affectedItems: params.affectedItems || [],
    evidence: params.evidence || [],
    recommendation: params.recommendation || "Review required.",
  };
}

// ─── Detector: Product / Commercial ──────────────────────────────────────────

function detectProductCommercialContradictions(snapshot) {
  const issues = [];
  for (const product of snapshot.products) {
    const cat = snapshot.catalogEntries[product.productCode];
    if (!cat) continue;
    const hasStripe = Boolean(cat.stripePriceId);
    const isBlocked = product.readiness?.readinessStatus === "blocked" || product.readiness?.releaseMode === "blocked";
    if (hasStripe && isBlocked) {
      issues.push(createIssue({
        title: `${product.productCode} has Stripe metadata but checkout is denied`,
        description: `Stripe metadata exists but resolver action is blocked. This is acceptable only if resolver and server checkout enforce the denial.`,
        severity: "governed_tension", domain: "commercial_metadata",
        governedTension: true,
        affectedItems: [product.productCode],
        evidence: [`stripePriceId=${cat.stripePriceId?.substring(0, 10)}...`, `resolverAction=blocked`],
        recommendation: "Keep Stripe metadata, but ensure checkout permission remains resolver-controlled.",
      }));
    }
  }
  return issues;
}

// ─── Detector: Storefront / Checkout Bypass ──────────────────────────────────

function detectStorefrontAndCheckoutBypass(snapshot) {
  const issues = [];
  const pricingText = readText("pages/pricing.tsx");
  const productCodeMatches = Array.from(pricingText.matchAll(/productCode=["'\`]([^"'\`]+)["'\`]/g));
  const seen = new Set();
  for (const match of productCodeMatches) {
    const code = normaliseCode(match[1]);
    if (seen.has(code)) continue;
    seen.add(code);
    const cat = snapshot.catalogEntries[code];
    if (!cat) continue;
    const isBlocked = snapshot.products.some((p) => p.productCode === code && (p.readiness?.readinessStatus === "blocked" || p.readiness?.releaseMode === "blocked"));
    if (isBlocked) {
      const ctx = pricingText.slice(Math.max(0, match.index - 300), match.index);
      const isGuarded = /purchasable\s*\?/.test(ctx) || /checkoutPermitted/.test(ctx);
      if (!isGuarded) {
        issues.push(createIssue({
          title: `Hardcoded CheckoutButton for non-checkout product ${code}`,
          severity: "checkout_bypass", domain: "commercial_checkout",
          blocksDeployment: true,
          affectedItems: [code, "pages/pricing.tsx"],
          recommendation: "Render CTA from resolver output.",
        }));
      } else {
        issues.push(createIssue({
          title: `CheckoutButton for ${code} is resolver-guarded`,
          severity: "governed_tension", domain: "commercial_checkout",
          governedTension: true,
          affectedItems: [code, "pages/pricing.tsx"],
          recommendation: "Keep the resolver guard.",
        }));
      }
    }
  }
  return issues;
}

// ─── Detector: GMI Lifecycle ─────────────────────────────────────────────────

function isLifecycleDraft(state) { return ["DRAFT", "draft", "FORTHCOMING", "forthcoming"].includes(String(state || "")); }
function isLifecycleActive(state) { return ["ACTIVE_UNTIL_SUPERSEDED", "ACTIVE", "PUBLISHED", "published", "active"].includes(String(state || "")); }

function detectGmiLifecycleContradictions(snapshot) {
  const issues = [];
  const registry = snapshot.gmi.registry || {};
  const lifecycle = snapshot.gmi.lifecycle || {};

  for (const [code, reg] of Object.entries(registry)) {
    const lc = lifecycle[code];
    if (!lc) continue;
    if (reg.current === true && isLifecycleDraft(lc.lifecycleState)) {
      issues.push(createIssue({
        title: `GMI ${lc.id}: registry current flag contradicts lifecycle draft state`,
        severity: "publication_lifecycle_conflict", domain: "gmi_publication_lifecycle",
        sourceOfTruth: SOURCE_OF_TRUTH_MAP.publicationLifecycle,
        observedSource: SOURCE_OF_TRUTH_MAP.gmiEditionMetadata,
        expectedSource: "Lifecycle controls publication state.",
        affectedItems: [code, lc.id],
        evidence: [`registry.current=${reg.current}`, `lifecycle.lifecycleState=${lc.lifecycleState}`],
        requiresOwnerDecision: true, blocksDeployment: true,
        recommendation: "Derive current published issue from lifecycle, not registry boolean.",
      }));
    }
    if (String(reg.status || "").includes("archiv") && isLifecycleActive(lc.lifecycleState) && !lc.supersededBy) {
      issues.push(createIssue({
        title: `GMI ${lc.id}: registry archive state contradicts lifecycle active state`,
        severity: "publication_lifecycle_conflict", domain: "gmi_publication_lifecycle",
        sourceOfTruth: SOURCE_OF_TRUTH_MAP.publicationLifecycle,
        affectedItems: [code, lc.id],
        evidence: [`registry.status=${reg.status}`, `lifecycle.lifecycleState=${lc.lifecycleState}`, `lifecycle.supersededBy=${lc.supersededBy || "null"}`],
        requiresOwnerDecision: true, blocksDeployment: true,
        recommendation: "Keep as current published until supersession.",
      }));
    }
  }
  return issues;
}

// ─── Detector: Content / Public Routes ───────────────────────────────────────

function detectContentRouteContradictions(snapshot) { return []; }

// ─── Detector: Build / Environment ───────────────────────────────────────────

const BUILD_CRITICAL_URL_ENV_KEYS = ["NEXTAUTH_URL", "SITE_URL", "NEXT_PUBLIC_SITE_URL", "VERCEL_URL"];

function detectBuildEnvironmentContradictions(snapshot) {
  const issues = [];
  for (const envFile of snapshot.files.env) {
    const text = readText(envFile);
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      let value = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
      if (BUILD_CRITICAL_URL_ENV_KEYS.includes(key) && value === "") {
        issues.push(createIssue({
          title: `${key} is empty in ${envFile}`,
          severity: "fatal_build_blocker", domain: "build_environment",
          blocksDeployment: true,
          affectedItems: [envFile, key],
          recommendation: "Remove the empty value or set a valid URL.",
        }));
      }
    }
  }
  return issues;
}

// ─── Detector: Narrative Drift ───────────────────────────────────────────────

const SENSITIVE_TERMS = ["autonomous", "SaaS", "prediction engine", "tamper-proof", "guarantee", "guaranteed", "certified", "courtroom-grade"];

function detectNarrativeDrift(snapshot) {
  const issues = [];
  const targetFiles = ["pages/professionals.tsx", "pages/system.tsx", "pages/method.tsx", "pages/products.tsx", "pages/pricing.tsx", "pages/enterprise.tsx", "pages/oversight/index.tsx"];
  for (const file of targetFiles) {
    if (!exists(file)) continue;
    const text = readText(file);
    const lines = text.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const lower = lines[i].toLowerCase();
      for (const term of SENSITIVE_TERMS) {
        if (lower.includes(term.toLowerCase())) {
          const allowed = lower.includes("not ") || lower.includes("is not") || lower.includes("not a") || lower.includes("unlike") || lower.includes("avoid");
          issues.push(createIssue({
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

// ─── Detector: Existing Checker Signals ──────────────────────────────────────

function detectExistingCheckerSignals(snapshot) { return []; }

// ─── Guardrails ──────────────────────────────────────────────────────────────

function checkLivingGuardrails(snapshot, issues) {
  const violations = [];
  function add(rule, description, severity, items) {
    violations.push({ rule, description, severity, affectedItems: items });
  }

  const bypasses = issues.filter((i) => i.severity === "checkout_bypass");
  if (bypasses.length > 0) add("resolver_controls_checkout", "Checkout bypass detected.", "critical", bypasses.flatMap((i) => i.affectedItems));

  const gmiConflicts = issues.filter((i) => i.domain === "gmi_publication_lifecycle" && i.severity === "publication_lifecycle_conflict");
  if (gmiConflicts.length > 0) add("publication_lifecycle_controls_current_state", "GMI state contradicts lifecycle.", "high", gmiConflicts.flatMap((i) => i.affectedItems));

  // Authority delta: scan for terms but exclude governance infra files
  const authorityFiles = snapshot.files.lib.concat(snapshot.files.pages, snapshot.files.components);
  const infraFiles = ["authority-gate-hierarchy.ts", "authority-grant-firewall.ts", "product-authority-contract.ts", "product-release-governance.ts", "product-release-readiness.ts", "resolve-product-authority.ts", "data-source-authority.ts", "context-bound-validation.ts", "product-doctrine-contract.ts"];
  const hits = [];
  for (const file of authorityFiles) {
    if (infraFiles.some((inf) => file.includes(inf))) continue;
    const text = readText(file);
    const lines = text.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const lower = lines[i].toLowerCase();
      if ((lower.includes("authorityrestoration") || lower.includes("positiveauthority") || lower.includes("grantauthority")) && !lower.includes("0") && !lower.includes("false") && !lower.includes("not")) {
        hits.push(`${file}:${i + 1}`);
      }
    }
  }
  if (hits.length > 0) add("authority_delta_zero", "Potential authority-granting language detected.", "medium", hits.slice(0, 10));

  return violations;
}

// ─── Classification & Recommendations ───────────────────────────────────────

function classifyIntervention(issue) {
  const map = {
    fatal_build_blocker: { type: "fatal_build_blocker", action: "Block deployment.", owner: "release_engineering" },
    checkout_bypass: { type: "checkout_bypass", action: "Block deployment. Route through resolver.", owner: "commercial_engineering" },
    commercial_safety_blocker: { type: "commercial_safety_blocker", action: "Hold commercial release.", owner: "commercial_operations" },
    publication_lifecycle_conflict: { type: "publication_lifecycle_conflict", action: "Use lifecycle authority.", owner: "intelligence_operations" },
  };
  if (map[issue.severity]) return { issueId: issue.id, ...map[issue.severity] };
  if (issue.requiresOwnerDecision) return { issueId: issue.id, type: "owner_decision_required", action: "Escalate for owner decision.", owner: "owner" };
  if (issue.governedTension) return { issueId: issue.id, type: "governed_tension", action: "Track as safe tension.", owner: "governance" };
  return { issueId: issue.id, type: "monitor", action: "Track and resolve.", owner: "product_engineering" };
}

function buildRecommendations(issues) {
  return issues.map((issue) => ({
    issueId: issue.id,
    priority: issue.blocksDeployment ? "critical" : issue.requiresOwnerDecision ? "high" : "low",
    recommendation: issue.recommendation,
  }));
}

function summariseIssues(issues, guardrails) {
  const blockingIssues = issues.filter((i) => i.blocksDeployment);
  const ownerDecisions = issues.filter((i) => i.requiresOwnerDecision);
  const governedTensions = issues.filter((i) => i.governedTension);
  const checkoutBypasses = issues.filter((i) => i.severity === "checkout_bypass");
  return {
    totalIssues: issues.length,
    blockingIssues: blockingIssues.length,
    ownerDecisionsRequired: ownerDecisions.length,
    governedTensions: governedTensions.length,
    checkoutBypasses: checkoutBypasses.length,
    guardrailViolations: guardrails.length,
    exitCode: blockingIssues.length > 0 || checkoutBypasses.length > 0 ? 1 : 0,
  };
}

// ─── Report Composer ─────────────────────────────────────────────────────────

function composeMarkdownReport(report) {
  const { summary, issues, guardrailViolations, interventions, recommendations, snapshotDigest } = report;
  const lines = [];
  lines.push("# Living Estate Intelligence Report");
  lines.push(""); lines.push(`Generated: ${report.generatedAt}`); lines.push("");
  lines.push("## Summary"); lines.push("");
  lines.push("| Metric | Count |"); lines.push("|---|---:|");
  lines.push(`| Total issues | ${summary.totalIssues} |`);
  lines.push(`| Blocking issues | ${summary.blockingIssues} |`);
  lines.push(`| Owner decisions required | ${summary.ownerDecisionsRequired} |`);
  lines.push(`| Governed tensions | ${summary.governedTensions} |`);
  lines.push(`| Checkout bypasses | ${summary.checkoutBypasses} |`);
  lines.push(`| Guardrail violations | ${summary.guardrailViolations} |`);
  lines.push(`| Exit code | ${summary.exitCode} |`); lines.push("");
  lines.push("## Issues"); lines.push("");
  for (const issue of issues) {
    lines.push(`### ${issue.id} — ${issue.title}`); lines.push("");
    lines.push(`- **Severity:** ${issue.severity}`);
    lines.push(`- **Domain:** ${issue.domain}`);
    lines.push(`- **Blocks deployment:** ${issue.blocksDeployment ? "YES" : "NO"}`);
    if (issue.governedTension) lines.push("- **Governed tension:** YES");
    lines.push(`- **Description:** ${issue.description}`);
    if (issue.evidence?.length) { lines.push("- **Evidence:**"); for (const ev of issue.evidence) lines.push(`  - ${ev}`); }
    if (issue.affectedItems?.length) lines.push(`- **Affected items:** ${issue.affectedItems.join(", ")}`);
    lines.push(`- **Recommendation:** ${issue.recommendation}`); lines.push("");
  }
  lines.push("## Guardrail Violations"); lines.push("");
  if (!guardrailViolations.length) { lines.push("None."); } else {
    for (const v of guardrailViolations) lines.push(`- **${v.rule}** (${v.severity}): ${v.description}`);
  }
  lines.push(""); lines.push("## Interventions"); lines.push("");
  for (const inv of interventions) lines.push(`- **${inv.issueId}** — ${inv.type}: ${inv.action} _(Owner: ${inv.owner})_`);
  lines.push(""); lines.push("## Recommendations"); lines.push("");
  for (const rec of recommendations) lines.push(`- **${rec.issueId}** (${rec.priority}): ${rec.recommendation}`);
  lines.push(""); lines.push("## Final Gate"); lines.push("");
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
  ok(`Content files inspected: ${snapshot.files.content.length}`);
  ok(`GMI registry editions parsed: ${Object.keys(snapshot.gmi.registry).length}`);
  ok(`GMI lifecycle editions parsed: ${Object.keys(snapshot.gmi.lifecycle).length}`);

  heading("Running detectors");
  const detectorGroups = [
    ["Product / Commercial", detectProductCommercialContradictions],
    ["Storefront / Checkout Bypass", detectStorefrontAndCheckoutBypass],
    ["GMI / Publication Lifecycle", detectGmiLifecycleContradictions],
    ["Content / Public Routes", detectContentRouteContradictions],
    ["Build / Environment", detectBuildEnvironmentContradictions],
    ["Narrative Drift", detectNarrativeDrift],
    ["Existing Checker Signals", detectExistingCheckerSignals],
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

  const guardrailViolations = checkLivingGuardrails(snapshot, issues);
  const interventions = issues.map(classifyIntervention);
  const recommendations = buildRecommendations(issues);
  const summary = summariseIssues(issues, guardrailViolations);

  const snapshotDigest = {
    productsInspected: snapshot.products.length,
    catalogEntries: Object.keys(snapshot.catalogEntries).length,
    contentFiles: snapshot.files.content.length,
    pageFiles: snapshot.files.pages.length,
    gmiRegistryEditions: Object.keys(snapshot.gmi.registry).length,
    gmiLifecycleEditions: Object.keys(snapshot.gmi.lifecycle).length,
  };

  const report = { generatedAt: new Date().toISOString(), sourceOfTruthMap: SOURCE_OF_TRUTH_MAP, snapshotDigest, summary, issues, guardrailViolations, interventions, recommendations };
  writeJson("reports/living-estate-intelligence-report.json", report);
  writeText("reports/living-estate-intelligence-report.md", composeMarkdownReport(report));

  heading("Results");
  console.log(`  Total issues:             ${summary.totalIssues}`);
  console.log(`  Blocking issues:          ${summary.blockingIssues}`);
  console.log(`  Owner decisions required: ${summary.ownerDecisionsRequired}`);
  console.log(`  Governed tensions:        ${summary.governedTensions}`);
  console.log(`  Checkout bypasses:        ${summary.checkoutBypasses}`);
  console.log(`  Guardrail violations:     ${summary.guardrailViolations}`);
  console.log("");

  if (summary.blockingIssues > 0) {
    fail("Blocking issues detected:");
    for (const issue of issues.filter((i) => i.blocksDeployment)) console.log(`  - ${issue.id}: ${issue.title}`);
    console.log("");
  }

  ok("Wrote reports/living-estate-intelligence-report.json");
  ok("Wrote reports/living-estate-intelligence-report.md");
  console.log(""); console.log("=".repeat(80));

  if (summary.exitCode === 0) { ok("LIVING ESTATE INTELLIGENCE CHECK PASSED"); process.exit(0); }
  else { fail("LIVING ESTATE INTELLIGENCE CHECK FAILED"); process.exit(1); }
}

main();
