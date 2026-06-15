#!/usr/bin/env node

/**
 * scripts/check-living-product-governance.mjs
 *
 * Living Product Governance — Market-Ready MVP
 * --------------------------------------------
 * A read-only governed self-awareness runner for the Abraham of London estate.
 *
 * Purpose:
 *   Verify whether the product behaves according to its own doctrine:
 *   - authority remains with the human/client/organisation
 *   - evidence is separated from assertion
 *   - continuity and memory are real, not decorative
 *   - publication/current/archive states follow lifecycle truth
 *   - checkout follows resolver truth, not Stripe metadata
 *   - living components are tied to real state, not theatre
 *   - public narrative does not overclaim implementation
 *   - contradictions are remembered, compared, classified, and reported
 *
 * Safety:
 *   - no network access
 *   - no source mutation
 *   - no deployment
 *   - no invented Stripe IDs, prices, publication state, owner approval, or consent
 *   - writes only:
 *       reports/living-product-truth-report.json
 *       reports/living-product-truth-report.md
 *       reports/living-product-memory.json
 *
 * Usage:
 *   node scripts/check-living-product-governance.mjs
 *   node scripts/check-living-product-governance.mjs --warn-only
 *   node scripts/check-living-product-governance.mjs --json
 *
 * Exit:
 *   0 = no blocking product-truth contradiction
 *   1 = blocker detected
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

// ─────────────────────────────────────────────────────────────────────────────
// Runtime
// ─────────────────────────────────────────────────────────────────────────────

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

const ARGS = new Set(process.argv.slice(2));
const WARN_ONLY = ARGS.has("--warn-only");
const JSON_MODE = ARGS.has("--json");
const NO_COLOR = Boolean(process.env.NO_COLOR) || JSON_MODE;

const REPORT_JSON = "reports/living-estate-intelligence-report.json";
const REPORT_MD = "reports/living-estate-intelligence-report.md";
const MEMORY_FILE = "reports/living-estate-intelligence-memory.json";

const ENGINE_VERSION = "living-product-governance-mvp-1.0.0";

// ─────────────────────────────────────────────────────────────────────────────
// Console
// ─────────────────────────────────────────────────────────────────────────────

const ANSI = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
};

function paint(code, text) {
  if (NO_COLOR) return text;
  return `${code}${text}${ANSI.reset}`;
}

function log(...args) {
  if (!JSON_MODE) console.log(...args);
}

function heading(text) {
  log("");
  log(paint(ANSI.cyan, paint(ANSI.bold, text)));
  log(paint(ANSI.gray, "─".repeat(Math.min(100, text.length + 8))));
}

function ok(text) {
  log(`${paint(ANSI.green, "✓")} ${text}`);
}

function warn(text) {
  log(`${paint(ANSI.yellow, "⚠")} ${text}`);
}

function fail(text) {
  log(`${paint(ANSI.red, "✗")} ${text}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Filesystem helpers
// ─────────────────────────────────────────────────────────────────────────────

function abs(relPath) {
  return path.join(ROOT, relPath);
}

function rel(absPath) {
  return path.relative(ROOT, absPath).replace(/\\/g, "/");
}

function exists(relPath) {
  return fs.existsSync(abs(relPath));
}

function readText(relPath, fallback = "") {
  try {
    const file = abs(relPath);
    if (!fs.existsSync(file)) return fallback;
    return fs.readFileSync(file, "utf8");
  } catch {
    return fallback;
  }
}

function readJson(relPath, fallback = null) {
  try {
    const text = readText(relPath, "");
    if (!text.trim()) return fallback;
    return JSON.parse(text);
  } catch {
    return fallback;
  }
}

function ensureDir(relPath) {
  const dir = abs(relPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function writeText(relPath, content) {
  ensureDir(path.dirname(relPath));
  fs.writeFileSync(abs(relPath), content, "utf8");
}

function writeJson(relPath, value) {
  writeText(relPath, JSON.stringify(value, null, 2));
}

function walkFiles(startRel, extensions = null) {
  const startAbs = abs(startRel);
  const out = [];

  function walk(currentAbs) {
    if (!fs.existsSync(currentAbs)) return;

    let entries = [];
    try {
      entries = fs.readdirSync(currentAbs, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const full = path.join(currentAbs, entry.name);
      const relative = rel(full);

      if (entry.isDirectory()) {
        if (
          entry.name === "node_modules" ||
          entry.name === ".next" ||
          entry.name === ".git" ||
          entry.name === ".contentlayer" ||
          entry.name === "coverage" ||
          entry.name === "out" ||
          entry.name === "dist"
        ) {
          continue;
        }
        walk(full);
        continue;
      }

      if (!entry.isFile()) continue;
      if (!extensions || extensions.includes(path.extname(entry.name))) {
        out.push(relative);
      }
    }
  }

  walk(startAbs);
  return out.sort();
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function lineNumberForIndex(text, index) {
  return text.slice(0, index).split(/\r?\n/).length;
}

function getLine(text, lineNumber) {
  return text.split(/\r?\n/)[lineNumber - 1] || "";
}

function findLines(file, pattern) {
  const text = readText(file, "");
  if (!text) return [];

  const regex =
    pattern instanceof RegExp
      ? pattern
      : new RegExp(escapeRegExp(String(pattern)), "i");

  return text
    .split(/\r?\n/)
    .map((line, index) => ({ file, line: index + 1, text: line.trim() }))
    .filter((item) => regex.test(item.text));
}

function normaliseCode(value) {
  return String(value || "")
    .trim()
    .replace(/-/g, "_")
    .replace(/\s+/g, "_")
    .toLowerCase();
}

function uniq(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

function firstDefined(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return undefined;
}

function hash(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex").slice(0, 16);
}

function fileHash(file) {
  return hash(readText(file, ""));
}

function mask(value) {
  if (value === undefined || value === null) return value;
  const text = String(value);
  if (!text) return text;
  if (text.length <= 8) return "***";
  return `${text.slice(0, 4)}…${text.slice(-4)}`;
}

function boolish(value) {
  if (value === true || value === false) return value;
  if (String(value).toLowerCase() === "true") return true;
  if (String(value).toLowerCase() === "false") return false;
  return undefined;
}

function parseDateSafe(value) {
  if (!value) return null;
  const d = new Date(String(value));
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function isLikelyDenialOrGuardrail(line) {
  const lower = String(line || "").toLowerCase();
  // Clarification questions about authority reinforce the boundary (they ask who has it, not claim it)
  const isAuthorityClarificationQuestion =
    lower.includes("who has") && lower.includes("authority");
  // Meta-doctrine references that define the boundary (e.g. expectedBehaviour, forbiddenTerms)
  const isDoctrineMetaReference =
    lower.includes("expectedbehaviour") ||
    lower.includes("forbiddenterms") ||
    lower.includes("forbiddenpatterns") ||
    lower.includes("no output claims") ||
    lower.includes("authority delta remains 0");
  return (
    isAuthorityClarificationQuestion ||
    isDoctrineMetaReference ||
    lower.includes("not ") ||
    lower.includes("never") ||
    lower.includes("without") ||
    lower.includes("avoid") ||
    lower.includes("blocked") ||
    lower.includes("blocks") ||
    lower.includes("prevent") ||
    lower.includes("firewall") ||
    lower.includes("guardrail") ||
    lower.includes("must not") ||
    lower.includes("cannot") ||
    lower.includes("no ")
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Source-of-truth architecture
// ─────────────────────────────────────────────────────────────────────────────

const SOURCE_OF_TRUTH_MAP = {
  productDoctrine: "lib/living-intelligence/product-doctrine-contract.ts or runner doctrine contract",
  productBehaviour: "code/route/component probes",
  evidencePosture: "lib/living-intelligence/evidence-posture-engine.ts or runner evidence classifier",
  memoryTruth: MEMORY_FILE,
  productAuthority: "data/ProductAuthorityContract.json",
  releaseReadiness: "reports/product-release-readiness-matrix.json",
  releaseGovernance: "reports/product-release-governance-matrix.json",
  checkoutPermission: "lib/commercial/commercial-action-resolver.ts + pricing-actions + server checkout",
  commercialMetadata: "lib/commercial/catalog.ts",
  publicationLifecycle: "lib/intelligence/market-intelligence-lifecycle.ts",
  gmiEditionMetadata: "lib/commercial/gmi/gmi-edition-registry.ts",
  publicContentResolution: "lib/content/public-content-resolver.ts",
  publicNarrative: "pages + content surfaces",
  livingComponents: "components/living/",
  deploymentConfig: "next.config.mjs + lib/site-url.ts + env files",
};

// ─────────────────────────────────────────────────────────────────────────────
// Product doctrine
// ─────────────────────────────────────────────────────────────────────────────

const DOCTRINE_CLAIMS = [
  {
    id: "authority-boundary",
    domain: "authority",
    claim: "The system does not grant authority, certify truth, or replace decision-makers.",
    requiredEvidenceAny: ["authority delta", "authority", "decision-maker", "client consent"],
    forbiddenPatterns: [
      /\bsystem\s+decides\b/i,
      /\bwe\s+decide\s+for\s+you\b/i,
      /\bfinal\s+authority\b/i,
      /\bcertified\s+truth\b/i,
      /\bguaranteed\s+approval\b/i,
      /\bpositiveAuthority\b/,
      /\bgrantAuthority\b/,
      /\bauthorityRestoration\b/,
    ],
    allowedInfrastructureHints: [
      "authority-gate",
      "authority-grant-firewall",
      "product-authority-contract",
      "product-release-governance",
      "product-release-readiness",
      "resolve-product-authority",
      "data-source-authority",
      "context-bound-validation",
      "product-doctrine-contract",
    ],
    verificationFiles: [
      "data/ProductAuthorityContract.json",
      "lib",
      "pages/professionals.tsx",
      "pages/system.tsx",
    ],
    severityIfViolated: "commercial_safety_blocker",
  },
  {
    id: "evidence-discipline",
    domain: "evidence",
    claim: "The system distinguishes evidence from assertion and carries confidence posture.",
    requiredEvidenceAll: ["evidence"],
    requiredEvidenceAny: ["confidence", "falsification", "unsupported", "evidence tier", "evidence posture"],
    verificationFiles: ["lib", "components", "pages/method.tsx", "pages/intelligence/gmi/index.tsx", "content"],
    severityIfViolated: "governance_contradiction",
  },
  {
    id: "continuity",
    domain: "memory",
    claim: "The system preserves unresolved contradictions and continuity across serious decisions.",
    requiredEvidenceAll: ["continuity"],
    requiredEvidenceAny: ["memory", "case state", "session", "unresolved", "return state"],
    verificationFiles: ["lib", "components/living", "pages/decision-centre.tsx"],
    severityIfViolated: "governance_contradiction",
  },
  {
    id: "contradiction-detection",
    domain: "contradiction",
    claim: "The system detects structural contradiction and does not hide conflict behind smooth output.",
    requiredEvidenceAll: ["contradiction"],
    requiredEvidenceAny: ["detector", "severity", "evidence", "domain", "drift"],
    verificationFiles: ["lib/living-intelligence", "scripts", "lib"],
    severityIfViolated: "governance_contradiction",
  },
  {
    id: "bounded-simulation",
    domain: "simulation",
    claim: "Strategic Twin is bounded simulation, not prediction certainty.",
    requiredEvidenceAll: ["simulation"],
    requiredEvidenceAny: ["bounded", "assumption", "confidence", "scenario"],
    forbiddenPatterns: [
      /\bprediction\s+certainty\b/i,
      /\bguaranteed\s+forecast\b/i,
      /\bpredicts\s+the\s+future\b/i,
    ],
    verificationFiles: ["lib", "pages/method.tsx", "pages/system.tsx"],
    severityIfViolated: "narrative_drift",
  },
  {
    id: "professional-boundary",
    domain: "professional",
    claim: "Professional access structures advisor-mediated evidence without transferring client authority.",
    requiredEvidenceAll: ["advisor"],
    requiredEvidenceAny: ["client consent", "advisor-mediated", "cross-client", "authority"],
    verificationFiles: ["pages/professionals.tsx", "lib/professional-console", "components"],
    severityIfViolated: "commercial_safety_blocker",
  },
  {
    id: "retainer-oversight-boundary",
    domain: "oversight",
    claim: "Retainer oversight is gated, evidence-dependent, and not self-serve checkout.",
    requiredEvidenceAny: ["contracted", "review-gated", "not self-serve", "human review", "gated"],
    forbiddenPatterns: [
      /\bself[-\s]?serve\s+retainer\b/i,
      /\bbuy\s+retainer\b/i,
      /\bactivate\s+oversight\s+now\b/i,
    ],
    verificationFiles: ["pages/oversight/index.tsx", "pages/oversight.tsx", "lib", "pages/pricing.tsx"],
    severityIfViolated: "commercial_safety_blocker",
  },
  {
    id: "publication-discipline",
    domain: "publication",
    claim: "Current, forthcoming, and archive states derive from lifecycle authority.",
    requiredEvidenceAny: ["lifecycle", "current", "archive", "forthcoming", "superseded"],
    verificationFiles: [
      "lib/intelligence/market-intelligence-lifecycle.ts",
      "lib/commercial/gmi/gmi-edition-registry.ts",
      "pages/intelligence/gmi/index.tsx",
      "content",
    ],
    severityIfViolated: "publication_lifecycle_conflict",
  },
  {
    id: "commercial-governance",
    domain: "commercial",
    claim: "Checkout permission comes from resolver truth; Stripe metadata is not permission.",
    requiredEvidenceAny: ["resolveCommercialAction", "resolvePricingAction", "checkoutSafe", "stripe"],
    verificationFiles: [
      "components/commercial/CheckoutButton.tsx",
      "pages/api/billing/checkout.ts",
      "lib/commercial",
      "pages/pricing.tsx",
    ],
    severityIfViolated: "checkout_bypass",
  },
  {
    id: "living-intelligence",
    domain: "living",
    claim: "Living components represent real state, not decorative theatre.",
    requiredEvidenceAny: ["viewModel", "evidence", "memory", "contradiction", "recommendation", "finding", "stage", "outcome"],
    verificationFiles: ["components/living", "lib/living-intelligence"],
    severityIfViolated: "governance_contradiction",
  },
];

const BLOCKING_SEVERITIES = new Set([
  "fatal_build_blocker",
  "checkout_bypass",
  "commercial_safety_blocker",
  "restricted_public_exposure",
]);

const WARNING_SEVERITIES = new Set([
  "publication_lifecycle_conflict",
  "source_of_truth_conflict",
  "governance_contradiction",
  "content_route_failure",
  "storefront_gap",
  "narrative_drift",
  "test_drift",
]);

const KNOWN_BLOCKED_PRODUCTS = ["boardroom_brief", "executive_reporting"];
const FLAGSHIP_PRODUCTS = ["strategy_room", "professional", "inner_circle"];
const RELEASE_READY_PRODUCTS = [
  "gmi_quarterly",
  "reporting_monthly",
  "reporting_custom",
  "fast_diagnostic",
  "enterprise_assessment",
];

const URL_ENV_KEYS = [
  "NEXTAUTH_URL",
  "AUTH_URL",
  "SITE_URL",
  "NEXT_PUBLIC_SITE_URL",
  "BASE_URL",
  "APP_URL",
  "VERCEL_URL",
];

const SENSITIVE_NARRATIVE_TERMS = [
  "AI tool",
  "SaaS",
  "sovereign finality",
  "courtroom-grade",
  "autonomous",
  "guarantee",
  "guaranteed",
  "certified",
  "predicts",
  "prediction engine",
  "tamper-proof",
  "fully automated governance",
  "replace consultants",
  "replace advisors",
  "replace boards",
];

const TARGET_PUBLIC_SURFACES = [
  "pages/professionals.tsx",
  "pages/system.tsx",
  "pages/method.tsx",
  "pages/enterprise.tsx",
  "pages/oversight.tsx",
  "pages/oversight/index.tsx",
  "pages/decision-centre.tsx",
  "pages/products.tsx",
  "pages/pricing.tsx",
  "pages/intelligence/gmi/index.tsx",
];

const LIVING_COMPONENTS = [
  "components/living/DecisionAdvantageSummary.tsx",
  "components/living/EvidenceStrengthMeter.tsx",
  "components/living/GovernedActionPanel.tsx",
  "components/living/HumanReviewPrompt.tsx",
  "components/living/IntelligenceGainPanel.tsx",
  "components/living/LivingLayerShell.tsx",
  "components/living/LivingSpineProgress.tsx",
  "components/living/NextLayerUnlockedPanel.tsx",
  "components/living/OutcomeMemoryPreview.tsx",
  "components/living/WhatChangedPanel.tsx",
  "components/living/WhatTheSystemHeard.tsx",
];

// ─────────────────────────────────────────────────────────────────────────────
// Issue model
// ─────────────────────────────────────────────────────────────────────────────

let issueCounter = 1;

function makeIssue(input) {
  const severity = input.severity || "informational_note";
  const evidence = input.evidence || [];
  const affectedItems = uniq(input.affectedItems || []);
  const blocksDeployment =
    input.blocksDeployment === true ||
    BLOCKING_SEVERITIES.has(severity) ||
    (severity === "publication_lifecycle_conflict" && input.blocksPublication === true);

  const signature = hash([
    input.title || "",
    severity,
    input.domain || "",
    input.doctrineClaimId || "",
    affectedItems.join("|"),
    input.sourceOfTruth || "",
  ].join("::"));

  const posture = input.evidencePosture || classifyEvidencePosture({
    evidence,
    severity,
    inferred: input.inferred,
    contradictory: input.contradictory,
  });

  return {
    id: `LPG-${String(issueCounter++).padStart(4, "0")}`,
    signature,
    title: input.title,
    description: input.description || "",
    severity,
    domain: input.domain || "general",
    doctrineClaimId: input.doctrineClaimId || null,
    evidencePosture: posture,
    confidence: input.confidence || confidenceFromPosture(posture),
    blocksDeployment,
    requiresOwnerDecision: input.requiresOwnerDecision === true,
    governedTension: input.governedTension === true,
    acceptedRisk: input.acceptedRisk === true,
    sourceOfTruth: input.sourceOfTruth || null,
    observedSource: input.observedSource || null,
    expectedSource: input.expectedSource || null,
    affectedItems,
    evidence,
    falsification: input.falsification || "Inspect the named files, correct the contradiction, and rerun this checker.",
    recommendation: input.recommendation || "Review and reconcile product truth.",
    refusedToInfer: input.refusedToInfer || [],
  };
}

function classifyEvidencePosture({ evidence = [], severity = "", inferred = false, contradictory = false }) {
  if (contradictory) return "contradictory";
  if (inferred) return evidence.length ? "weakly_indicated" : "inferred";
  if (evidence.length >= 2) return "verified";
  if (evidence.length === 1) return "strongly_indicated";
  if (severity.includes("conflict") || severity.includes("blocker")) return "needs_human_review";
  return "unverified";
}

function confidenceFromPosture(posture) {
  switch (posture) {
    case "verified":
      return "high";
    case "strongly_indicated":
      return "medium";
    case "weakly_indicated":
    case "inferred":
      return "low";
    case "contradictory":
    case "needs_human_review":
      return "review_required";
    default:
      return "unverified";
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// JS/TS object parsing helpers
// ─────────────────────────────────────────────────────────────────────────────

function findMatchingBrace(text, openIndex) {
  let depth = 0;
  let quote = null;
  let escaped = false;

  for (let i = openIndex; i < text.length; i += 1) {
    const ch = text[i];

    if (quote) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (ch === "\\") {
        escaped = true;
        continue;
      }
      if (ch === quote) quote = null;
      continue;
    }

    if (ch === '"' || ch === "'" || ch === "`") {
      quote = ch;
      continue;
    }

    if (ch === "{") depth += 1;
    if (ch === "}") {
      depth -= 1;
      if (depth === 0) return i;
    }
  }

  return -1;
}

function extractString(block, key) {
  const patterns = [
    new RegExp(`${key}\\s*:\\s*"([^"]*)"`, "m"),
    new RegExp(`${key}\\s*:\\s*'([^']*)'`, "m"),
    new RegExp(`${key}\\s*:\\s*\`([^\`]*)\``, "m"),
  ];

  for (const pattern of patterns) {
    const match = block.match(pattern);
    if (match) return match[1];
  }

  return undefined;
}

function extractBoolean(block, key) {
  const match = block.match(new RegExp(`${key}\\s*:\\s*(true|false)`, "m"));
  if (!match) return undefined;
  return match[1] === "true";
}

function extractNumber(block, key) {
  const match = block.match(new RegExp(`${key}\\s*:\\s*(-?\\d+(?:\\.\\d+)?)`, "m"));
  if (!match) return undefined;
  return Number(match[1]);
}

function findObjectBlockContaining(text, needle) {
  // Prefer matching the needle in an `id:` field context to avoid false matches
  // when the needle appears as a reference in another record (e.g. `replaces`, `nextExpected`).
  let index = text.indexOf(`id: "${needle}"`);
  if (index === -1) index = text.indexOf(`id: '${needle}'`);
  if (index === -1) index = text.indexOf(`id: \\\`${needle}\\\``);
  // Fallback: search for the bare needle
  if (index === -1) index = text.indexOf(needle);
  if (index === -1) return "";

  let open = text.lastIndexOf("{", index);

  while (open >= 0) {
    const close = findMatchingBrace(text, open);
    if (close !== -1 && close >= index) {
      return text.slice(open, close + 1);
    }
    open = text.lastIndexOf("{", open - 1);
  }

  return "";
}

function parseFrontmatter(text) {
  if (!text.startsWith("---")) return { frontmatter: {}, body: text };

  const end = text.indexOf("\n---", 3);
  if (end === -1) return { frontmatter: {}, body: text };

  const raw = text.slice(3, end).trim();
  const body = text.slice(end + 4);
  const frontmatter = {};

  for (const rawLine of raw.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const idx = line.indexOf(":");
    if (idx === -1) continue;

    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    value = value.replace(/^["']|["']$/g, "");

    if (value === "true") frontmatter[key] = true;
    else if (value === "false") frontmatter[key] = false;
    else if (/^-?\d+(\.\d+)?$/.test(value)) frontmatter[key] = Number(value);
    else frontmatter[key] = value;
  }

  return { frontmatter, body };
}

function collectProductLikeRecords(json, source) {
  const records = [];

  function visit(node, pointer = []) {
    if (Array.isArray(node)) {
      node.forEach((child, index) => visit(child, pointer.concat(String(index))));
      return;
    }

    if (!node || typeof node !== "object") return;

    const key = pointer[pointer.length - 1];
    const productCode = firstDefined(
      node.productCode,
      node.code,
      node.id,
      node.slug,
      key
    );

    const signalFields = [
      "readinessStatus",
      "releaseReadyNow",
      "releaseLane",
      "releaseMode",
      "checkoutSafe",
      "commercialSafe",
      "checkoutAllowed",
      "commercialClaimAllowed",
      "currentAuthorityState",
      "authorityState",
      "state",
      "commercialStatus",
      "stripeProductId",
      "stripePriceId",
    ];

    if (productCode && signalFields.some((field) => node[field] !== undefined)) {
      records.push({
        source,
        pointer: pointer.join("."),
        productCode: normaliseCode(productCode),
        rawProductCode: String(productCode),
        raw: node,
      });
    }

    for (const [childKey, child] of Object.entries(node)) {
      visit(child, pointer.concat(childKey));
    }
  }

  visit(json, []);
  return records;
}

function indexByProductCode(records) {
  const map = new Map();
  for (const record of records) {
    if (!record.productCode) continue;
    if (!map.has(record.productCode)) map.set(record.productCode, []);
    map.get(record.productCode).push(record);
  }
  return map;
}

function parseCatalog() {
  const file = "lib/commercial/catalog.ts";
  const text = readText(file, "");
  const entries = new Map();

  const regex = /([A-Za-z0-9_]+)\s*:\s*\{/g;
  let match;

  while ((match = regex.exec(text))) {
    const key = match[1];
    const open = text.indexOf("{", match.index);
    const close = findMatchingBrace(text, open);
    if (open === -1 || close === -1) continue;

    const block = text.slice(open, close + 1);

    const hasSignals =
      block.includes("displayName") ||
      block.includes("commercialStatus") ||
      block.includes("stripePriceId") ||
      block.includes("successPath") ||
      block.includes("requiresCheckout");

    if (!hasSignals) continue;

    const code = normaliseCode(firstDefined(extractString(block, "code"), key));

    entries.set(code, {
      productCode: code,
      key,
      source: file,
      displayName: extractString(block, "displayName"),
      commercialStatus: extractString(block, "commercialStatus"),
      stripeProductId: extractString(block, "stripeProductId"),
      stripePriceId: extractString(block, "stripePriceId"),
      successPath: extractString(block, "successPath"),
      cancelPath: extractString(block, "cancelPath"),
      primaryCta: extractString(block, "primaryCta"),
      amount: extractNumber(block, "amount"),
      active: extractBoolean(block, "active"),
      requiresCheckout: extractBoolean(block, "requiresCheckout"),
      requiresContract: extractBoolean(block, "requiresContract"),
      hiddenFromPricing: extractBoolean(block, "hiddenFromPricing"),
      rawBlock: block,
    });
  }

  return entries;
}

function parseGmiRegistry() {
  const file = "lib/commercial/gmi/gmi-edition-registry.ts";
  const text = readText(file, "");
  const editions = new Map();

  const targets = [
    { code: "gmi_q1_2026", needles: ["gmi_q1_2026", "GMI-Q1-2026", "Q1 2026"] },
    { code: "gmi_q2_2026", needles: ["gmi_q2_2026", "GMI-Q2-2026", "Q2 2026"] },
    { code: "gmi_q3_2026", needles: ["gmi_q3_2026", "GMI-Q3-2026", "Q3 2026"] },
  ];

  for (const target of targets) {
    let block = "";
    for (const needle of target.needles) {
      block = findObjectBlockContaining(text, needle);
      if (block) break;
    }

    if (!block) continue;

    editions.set(target.code, {
      source: file,
      productCode: target.code,
      editionId: firstDefined(extractString(block, "editionId"), extractString(block, "id")),
      productCodeRaw: extractString(block, "productCode"),
      quarter: firstDefined(extractString(block, "quarter"), extractString(block, "edition")),
      status: firstDefined(extractString(block, "status"), extractString(block, "commercialStatus")),
      commercialStatus: extractString(block, "commercialStatus"),
      current: extractBoolean(block, "current"),
      hiddenFromPricing: extractBoolean(block, "hiddenFromPricing"),
      publicVisible: extractBoolean(block, "publicVisible"),
      purchasable: extractBoolean(block, "purchasable"),
      publicationTarget: extractString(block, "publicationTarget"),
      publicationDate: extractString(block, "publicationDate"),
      rawBlock: block,
    });
  }

  return editions;
}

function parseMarketIntelligenceLifecycle() {
  const file = "lib/intelligence/market-intelligence-lifecycle.ts";
  const text = readText(file, "");
  const editions = new Map();

  const targets = [
    { code: "gmi_q1_2026", needles: ["GMI-Q1-2026", "gmi_q1_2026", "Q1 2026"] },
    { code: "gmi_q2_2026", needles: ["GMI-Q2-2026", "gmi_q2_2026", "Q2 2026"] },
    { code: "gmi_q3_2026", needles: ["GMI-Q3-2026", "gmi_q3_2026", "Q3 2026"] },
  ];

  for (const target of targets) {
    let block = "";
    for (const needle of target.needles) {
      block = findObjectBlockContaining(text, needle);
      if (block) break;
    }

    if (!block) continue;

    editions.set(target.code, {
      source: file,
      productCode: target.code,
      id: firstDefined(extractString(block, "id"), extractString(block, "documentId")),
      title: extractString(block, "title"),
      lifecycleState: extractString(block, "lifecycleState"),
      publicVisible: extractBoolean(block, "publicVisible"),
      purchasable: extractBoolean(block, "purchasable"),
      supersededBy: extractString(block, "supersededBy"),
      replaces: extractString(block, "replaces"),
      publicationTarget: extractString(block, "publicationTarget"),
      publicationDate: firstDefined(extractString(block, "publicationDate"), extractString(block, "publishedAt")),
      rawBlock: block,
    });
  }

  return editions;
}

function routeCandidates(routePath) {
  const route = String(routePath || "")
    .split("?")[0]
    .replace(/^\/+|\/+$/g, "");

  if (!route) return ["pages/index.tsx", "app/page.tsx"];

  return [
    `pages/${route}.tsx`,
    `pages/${route}.ts`,
    `pages/${route}/index.tsx`,
    `pages/${route}/index.ts`,
    `app/${route}/page.tsx`,
    `app/${route}/page.ts`,
  ];
}

function routeExists(routePath) {
  return routeCandidates(routePath).some(exists);
}

// ─────────────────────────────────────────────────────────────────────────────
// Snapshot
// ─────────────────────────────────────────────────────────────────────────────

function loadSnapshot() {
  const files = {
    pages: exists("pages") ? walkFiles("pages", [".ts", ".tsx"]) : [],
    app: exists("app") ? walkFiles("app", [".ts", ".tsx"]) : [],
    lib: exists("lib") ? walkFiles("lib", [".ts", ".tsx", ".js", ".mjs"]) : [],
    components: exists("components") ? walkFiles("components", [".ts", ".tsx"]) : [],
    content: exists("content") ? walkFiles("content", [".md", ".mdx"]) : [],
    scripts: exists("scripts") ? walkFiles("scripts", [".js", ".mjs", ".ts"]) : [],
    env: fs.existsSync(ROOT)
      ? fs.readdirSync(ROOT).filter((name) => name.startsWith(".env")).sort()
      : [],
  };

  const productAuthorityJson = readJson("data/ProductAuthorityContract.json", {});
  const readinessJson = readJson("reports/product-release-readiness-matrix.json", {});
  const governanceJson = readJson("reports/product-release-governance-matrix.json", {});

  const authorityRecords = collectProductLikeRecords(productAuthorityJson, "data/ProductAuthorityContract.json");
  const readinessRecords = collectProductLikeRecords(readinessJson, "reports/product-release-readiness-matrix.json");
  const governanceRecords = collectProductLikeRecords(governanceJson, "reports/product-release-governance-matrix.json");

  const authorityByCode = indexByProductCode(authorityRecords);
  const readinessByCode = indexByProductCode(readinessRecords);
  const governanceByCode = indexByProductCode(governanceRecords);

  const catalog = parseCatalog();
  const registry = parseGmiRegistry();
  const lifecycle = parseMarketIntelligenceLifecycle();

  const allProductCodes = uniq([
    ...Array.from(authorityByCode.keys()),
    ...Array.from(readinessByCode.keys()),
    ...Array.from(governanceByCode.keys()),
    ...Array.from(catalog.keys()),
    ...KNOWN_BLOCKED_PRODUCTS,
    ...FLAGSHIP_PRODUCTS,
    ...RELEASE_READY_PRODUCTS,
    "gmi_q1_2026",
    "gmi_q2_2026",
    "gmi_q3_2026",
    "market_intelligence_q1",
    "market_intelligence_q2",
    "market_intelligence_q3",
  ]).sort();

  const products = allProductCodes.map((code) => {
    const authority = authorityByCode.get(code)?.[0]?.raw || {};
    const readiness = readinessByCode.get(code)?.[0]?.raw || {};
    const governance = governanceByCode.get(code)?.[0]?.raw || {};
    const catalogEntry = catalog.get(code) || null;

    return {
      productCode: code,
      authority,
      readiness,
      governance,
      catalog: catalogEntry,
      sources: {
        authority: authorityByCode.get(code)?.map((r) => r.source) || [],
        readiness: readinessByCode.get(code)?.map((r) => r.source) || [],
        governance: governanceByCode.get(code)?.map((r) => r.source) || [],
        catalog: catalogEntry ? [catalogEntry.source] : [],
      },
    };
  });

  const contentDocuments = files.content.map((file) => {
    const text = readText(file, "");
    const parsed = parseFrontmatter(text);
    return {
      file,
      text,
      frontmatter: parsed.frontmatter,
      body: parsed.body,
    };
  });

  const memory = readJson(MEMORY_FILE, {
    version: 2,
    engineVersion: ENGINE_VERSION,
    updatedAt: null,
    findings: {},
    fileHashes: {},
  });

  return {
    generatedAt: new Date().toISOString(),
    sourceOfTruthMap: SOURCE_OF_TRUTH_MAP,
    files,
    products,
    catalog: Object.fromEntries(catalog),
    registry,
    lifecycle,
    gmi: {
      registry: Object.fromEntries(registry),
      lifecycle: Object.fromEntries(lifecycle),
    },
    contentDocuments,
    reports: {
      publicContentRouteAudit: readJson("reports/public-content-route-audit.json", null),
      blogPostRouteAudit: readJson("reports/blog-post-route-audit.json", null),
      livingEstate: readJson("reports/living-estate-intelligence-report.json", null),
    },
    memory,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Commercial action mirror
// ─────────────────────────────────────────────────────────────────────────────

function productField(product, key) {
  return firstDefined(
    product.readiness?.[key],
    product.governance?.[key],
    product.authority?.[key],
    product.catalog?.[key]
  );
}

function resolveCommercialActionMirror(product) {
  const code = product.productCode;
  const catalog = product.catalog || {};

  const readinessStatus = String(productField(product, "readinessStatus") || "");
  const releaseLane = String(productField(product, "releaseLane") || "");
  const releaseMode = String(productField(product, "releaseMode") || "");
  const authorityState = String(firstDefined(
    product.authority?.currentAuthorityState,
    product.authority?.authorityState,
    product.authority?.state,
    ""
  ));
  const commercialStatus = String(firstDefined(catalog.commercialStatus, productField(product, "commercialStatus"), ""));

  const checkoutSafe = boolish(productField(product, "checkoutSafe"));
  const commercialSafe = boolish(productField(product, "commercialSafe"));
  const checkoutAllowed = boolish(productField(product, "checkoutAllowed"));

  const hasStripeProduct = Boolean(catalog.stripeProductId);
  const hasStripePrice = Boolean(catalog.stripePriceId);
  const hasStripe = hasStripeProduct && hasStripePrice;

  const active = catalog.active !== false;
  const amount = typeof catalog.amount === "number" ? catalog.amount : null;
  const requiresCheckout = catalog.requiresCheckout === true;
  const requiresContract = catalog.requiresContract === true;

  const reasons = [];

  function result(action, purchasable, reason) {
    if (reason) reasons.push(reason);
    return {
      productCode: code,
      action,
      purchasable,
      checkoutAllowed: action === "checkout" && purchasable,
      reasons: uniq(reasons),
      readinessStatus,
      releaseLane,
      releaseMode,
      authorityState,
      commercialStatus,
      checkoutSafe,
      commercialSafe,
      checkoutAllowed,
      hasStripe,
      amount,
      active,
    };
  }

  const blocked =
    readinessStatus === "blocked" ||
    releaseLane.includes("blocked") ||
    releaseMode === "blocked" ||
    authorityState.includes("blocked_until") ||
    KNOWN_BLOCKED_PRODUCTS.includes(code);

  if (blocked) return result("blocked", false, "blocked_by_governance");

  const internalOnly =
    releaseMode === "internal_only" ||
    releaseLane === "internal_only" ||
    authorityState === "internal_only" ||
    commercialStatus === "internal_only";

  if (internalOnly) return result("blocked", false, "internal_only");

  if (checkoutSafe === false) return result("blocked", false, "checkoutSafe_false");
  if (commercialSafe === false) return result("review_gated", false, "commercialSafe_false");

  if (!active || commercialStatus === "inactive" || commercialStatus === "retired" || commercialStatus === "archived") {
    return result("archive_reference_only", false, "inactive_or_archive");
  }

  if (commercialStatus === "contracted" || requiresContract) {
    return result("contact_sales", false, "contracted");
  }

  if (
    commercialStatus === "manual_billing" ||
    commercialStatus === "manual_fulfilment" ||
    releaseMode === "manual_fulfilment_only"
  ) {
    return result("manual_fulfilment", false, "manual_fulfilment");
  }

  if (commercialStatus === "free_controlled" || amount === 0) {
    return result("view_free_surface", false, "free_controlled");
  }

  if (requiresCheckout || commercialStatus === "paid") {
    if (!hasStripe) return result("unavailable", false, "missing_stripe_metadata");
    if (amount !== null && amount <= 0) return result("unavailable", false, "invalid_amount");
    return result("checkout", true, "checkout_safe");
  }

  if (!catalog.successPath) return result("unavailable", false, "missing_route_or_catalog");

  return result("request_access", false, "default_non_checkout");
}

// ─────────────────────────────────────────────────────────────────────────────
// Detectors
// ─────────────────────────────────────────────────────────────────────────────

function filesForHints(snapshot, hints) {
  const all = uniq([
    ...snapshot.files.pages,
    ...snapshot.files.app,
    ...snapshot.files.lib,
    ...snapshot.files.components,
    ...snapshot.files.content,
    ...snapshot.files.scripts,
  ]);

  if (!hints || hints.length === 0) return all;

  return all.filter((file) =>
    hints.some((hint) => file === hint || file.startsWith(`${hint}/`) || file.includes(hint))
  );
}

function detectDoctrineTruth(snapshot) {
  const issues = [];

  for (const claim of DOCTRINE_CLAIMS) {
    const files = filesForHints(snapshot, claim.verificationFiles);
    const combined = files.map((file) => `${file}\n${readText(file, "")}`).join("\n\n");
    const lowerCombined = combined.toLowerCase();

    const evidence = [];
    const violations = [];

    for (const term of claim.requiredEvidenceAll || []) {
      if (!lowerCombined.includes(term.toLowerCase())) {
        violations.push(`Required evidence term missing across evidence set: "${term}"`);
      } else {
        evidence.push(`Found required term "${term}"`);
      }
    }

    const anyTerms = claim.requiredEvidenceAny || [];
    if (anyTerms.length > 0) {
      const found = anyTerms.filter((term) => lowerCombined.includes(term.toLowerCase()));
      if (found.length === 0) {
        violations.push(`None of the expected evidence terms were found: ${anyTerms.join(", ")}`);
      } else {
        evidence.push(`Found expected term(s): ${found.join(", ")}`);
      }
    }

    for (const file of files) {
      const text = readText(file, "");
      if (!text) continue;

      for (const pattern of claim.forbiddenPatterns || []) {
        const regex = new RegExp(pattern.source, pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`);
        let match;
        while ((match = regex.exec(text))) {
          const line = lineNumberForIndex(text, match.index);
          const lineText = getLine(text, line);

          const infrastructureAllowed = claim.allowedInfrastructureHints?.some((hint) =>
            file.toLowerCase().includes(hint.toLowerCase())
          );

          if (infrastructureAllowed || isLikelyDenialOrGuardrail(lineText)) {
            evidence.push(`Allowed guardrail use: ${file}:${line}`);
            continue;
          }

          violations.push(`${file}:${line} ${lineText.trim()}`);
        }
      }
    }

    if (violations.length > 0) {
      issues.push(makeIssue({
        title: `Doctrine claim not sufficiently satisfied: ${claim.id}`,
        description: claim.claim,
        severity: claim.severityIfViolated,
        domain: `doctrine:${claim.domain}`,
        doctrineClaimId: claim.id,
        evidence: violations.slice(0, 12),
        affectedItems: violations.slice(0, 12).map((item) => item.split(" ")[0]),
        recommendation: `Reconcile implementation/copy with doctrine claim "${claim.id}".`,
        falsification: "Provide clear implementation evidence or remove the violating language.",
        inferred: false,
      }));
    } else {
      snapshot.doctrinePostures.push({
        claimId: claim.id,
        domain: claim.domain,
        posture: evidence.length > 0 ? "verified" : "weakly_indicated",
        evidence: evidence.slice(0, 8),
      });
    }
  }

  return issues;
}

function detectCommercialTruth(snapshot) {
  const issues = [];

  for (const product of snapshot.products) {
    const code = product.productCode;
    const catalog = product.catalog;
    const action = resolveCommercialActionMirror(product);

    const readinessStatus = String(productField(product, "readinessStatus") || "");
    const releaseLane = String(productField(product, "releaseLane") || "");
    const releaseMode = String(productField(product, "releaseMode") || "");
    const checkoutSafe = boolish(productField(product, "checkoutSafe"));
    const commercialSafe = boolish(productField(product, "commercialSafe"));

    const blocked =
      readinessStatus === "blocked" ||
      releaseLane.includes("blocked") ||
      releaseMode === "blocked" ||
      KNOWN_BLOCKED_PRODUCTS.includes(code);

    const internalOnly =
      releaseMode === "internal_only" ||
      releaseLane === "internal_only" ||
      String(firstDefined(product.authority?.currentAuthorityState, product.authority?.state, "")).includes("internal_only");

    const releaseReady =
      readinessStatus === "release_ready_now" ||
      product.readiness?.releaseReadyNow === true ||
      RELEASE_READY_PRODUCTS.includes(code);

    if (blocked && action.action === "checkout") {
      issues.push(makeIssue({
        title: `${code} resolves to checkout while blocked`,
        description: "Blocked products must never resolve to checkout.",
        severity: "checkout_bypass",
        domain: "commercial_truth",
        evidence: [`action=${action.action}`, `readinessStatus=${readinessStatus}`],
        affectedItems: [code],
        recommendation: "Fix resolver cascade and server checkout guard.",
      }));
    }

    if (internalOnly && action.action === "checkout") {
      issues.push(makeIssue({
        title: `${code} resolves to checkout while internal-only`,
        description: "Internal-only products must not expose public checkout.",
        severity: "checkout_bypass",
        domain: "commercial_truth",
        evidence: [`action=${action.action}`, `releaseMode=${releaseMode}`, `releaseLane=${releaseLane}`],
        affectedItems: [code],
        recommendation: "Block checkout or add explicit owner-approved intake allowlist.",
      }));
    }

    if ((checkoutSafe === false || commercialSafe === false) && action.action === "checkout") {
      issues.push(makeIssue({
        title: `${code} resolves to checkout despite unsafe flags`,
        description: `checkoutSafe=${checkoutSafe}, commercialSafe=${commercialSafe}.`,
        severity: "commercial_safety_blocker",
        domain: "commercial_truth",
        evidence: [`action=${action.action}`],
        affectedItems: [code],
        recommendation: "Safety flags must precede paid/Stripe metadata in resolver logic.",
      }));
    }

    if (catalog?.stripeProductId && catalog?.stripePriceId && action.action !== "checkout") {
      issues.push(makeIssue({
        title: `${code} has Stripe metadata but checkout is denied`,
        description: "This is safe only while resolver and server checkout enforce denial.",
        severity: "governed_tension",
        domain: "commercial_truth",
        governedTension: true,
        evidence: [
          `stripeProductId=${mask(catalog.stripeProductId)}`,
          `stripePriceId=${mask(catalog.stripePriceId)}`,
          `action=${action.action}`,
        ],
        affectedItems: [code],
        recommendation: "Track as governed tension. Stripe metadata is infrastructure, not permission.",
      }));
    }

    if (releaseReady && !catalog) {
      issues.push(makeIssue({
        title: `${code} is release-ready but missing commercial metadata`,
        description: "Release-ready products should have catalog/product-family metadata or explicit non-storefront status.",
        severity: "storefront_gap",
        domain: "commercial_truth",
        requiresOwnerDecision: true,
        evidence: [`readinessStatus=${readinessStatus}`],
        affectedItems: [code],
        recommendation: "Add catalog/product mapping or document intentionally non-storefront status.",
      }));
    }

    if (catalog?.successPath && catalog.successPath.startsWith("/") && !routeExists(catalog.successPath)) {
      issues.push(makeIssue({
        title: `${code} successPath does not resolve`,
        description: `successPath=${catalog.successPath}`,
        severity: "content_route_failure",
        domain: "route_truth",
        evidence: routeCandidates(catalog.successPath).map((candidate) => `missing: ${candidate}`),
        affectedItems: [code, catalog.successPath],
        recommendation: "Create route or correct successPath.",
      }));
    }
  }

  return issues;
}

function detectCheckoutTruth(snapshot) {
  const issues = [];
  const checkoutButton = "components/commercial/CheckoutButton.tsx";

  if (exists(checkoutButton)) {
    const text = readText(checkoutButton);
    if (!text.includes("resolveCommercialAction") && !text.includes("resolvePricingAction")) {
      issues.push(makeIssue({
        title: "CheckoutButton is not visibly resolver-gated",
        description: "CheckoutButton must not initiate checkout without resolver permission.",
        severity: "checkout_bypass",
        domain: "checkout_truth",
        evidence: [`${checkoutButton} lacks resolver marker`],
        affectedItems: [checkoutButton],
        recommendation: "Gate CheckoutButton with commercial resolver output.",
      }));
    }
  }

  const checkoutRoutes = [
    "pages/api/billing/checkout.ts",
    "app/api/billing/checkout/route.ts",
  ].filter(exists);

  for (const file of checkoutRoutes) {
    const text = readText(file);
    if (!text.includes("resolveCommercialAction") && !text.includes("resolvePricingAction")) {
      issues.push(makeIssue({
        title: `${file} does not visibly enforce resolver permission`,
        description: "Server-side checkout route must block non-purchasable products.",
        severity: "checkout_bypass",
        domain: "checkout_truth",
        evidence: [`${file} lacks resolver marker`],
        affectedItems: [file],
        recommendation: "Call resolver before Stripe session creation.",
      }));
    }
  }

  const runtimeFiles = uniq([
    ...snapshot.files.pages,
    ...snapshot.files.app,
    ...snapshot.files.components,
    ...snapshot.files.lib,
  ]);

  for (const file of runtimeFiles) {
    const text = readText(file);
    if (!text.includes("stripe.checkout.sessions.create")) continue;

    const resolverVisible = text.includes("resolveCommercialAction") || text.includes("resolvePricingAction");
    const nonCatalogFlow =
      text.toLowerCase().includes("event") ||
      text.toLowerCase().includes("report") ||
      text.toLowerCase().includes("custom") ||
      text.toLowerCase().includes("request");

    if (!resolverVisible && !nonCatalogFlow) {
      issues.push(makeIssue({
        title: "Raw Stripe checkout session may bypass resolver",
        description: `${file} creates a Stripe checkout session without visible resolver guard.`,
        severity: "checkout_bypass",
        domain: "checkout_truth",
        evidence: [`${file} contains stripe.checkout.sessions.create`],
        affectedItems: [file],
        recommendation: "Govern all product-code checkout through resolver.",
      }));
    } else if (!resolverVisible && nonCatalogFlow) {
      issues.push(makeIssue({
        title: "Non-catalog Stripe checkout flow detected",
        description: `${file} appears to create Stripe checkout outside catalog product flow.`,
        severity: "informational_note",
        domain: "checkout_truth",
        evidence: [`${file} contains stripe.checkout.sessions.create`],
        affectedItems: [file],
        recommendation: "Confirm this flow cannot accept governed product codes.",
      }));
    }
  }

  return issues;
}

function lifecycleIsDraft(value) {
  return ["DRAFT", "draft", "FORTHCOMING", "forthcoming", "RELEASE_CANDIDATE", "release_candidate"].includes(String(value || ""));
}

function lifecycleIsActive(value) {
  return ["ACTIVE_UNTIL_SUPERSEDED", "ACTIVE", "PUBLISHED", "published", "active"].includes(String(value || ""));
}

function detectPublicationTruth(snapshot) {
  const issues = [];

  for (const [code, reg] of snapshot.registry.entries()) {
    const life = snapshot.lifecycle.get(code);
    if (!life) continue;

    if (reg.current === true && lifecycleIsDraft(life.lifecycleState)) {
      issues.push(makeIssue({
        title: `${code} registry current flag is admin focus while lifecycle is draft`,
        description: "This is safe only if public/commercial current issue derives from lifecycle, not registry current.",
        severity: "governed_tension",
        domain: "publication_truth",
        governedTension: true,
        sourceOfTruth: SOURCE_OF_TRUTH_MAP.publicationLifecycle,
        observedSource: SOURCE_OF_TRUTH_MAP.gmiEditionMetadata,
        expectedSource: "Lifecycle controls publication state.",
        evidence: [
          `registry.current=${reg.current}`,
          `registry.status=${reg.status}`,
          `lifecycle.lifecycleState=${life.lifecycleState}`,
        ],
        affectedItems: [code, life.id || code],
        recommendation: "Keep registry current as admin focus only. Public surfaces must use lifecycle helpers.",
      }));
    }

    const registryArchived = String(reg.status || reg.commercialStatus || "").toLowerCase().includes("archiv");
    if (registryArchived && lifecycleIsActive(life.lifecycleState) && !life.supersededBy) {
      issues.push(makeIssue({
        title: `${code} registry archive state conflicts with active lifecycle`,
        description: "An issue cannot be archive until lifecycle marks it superseded.",
        severity: "publication_lifecycle_conflict",
        domain: "publication_truth",
        blocksPublication: true,
        sourceOfTruth: SOURCE_OF_TRUTH_MAP.publicationLifecycle,
        observedSource: SOURCE_OF_TRUTH_MAP.gmiEditionMetadata,
        evidence: [
          `registry.status=${reg.status}`,
          `lifecycle.lifecycleState=${life.lifecycleState}`,
          `lifecycle.supersededBy=${life.supersededBy || "null"}`,
        ],
        affectedItems: [code, life.id || code],
        recommendation: "Reconcile registry archive state with lifecycle supersession.",
      }));
    }

    if (reg.purchasable === true && lifecycleIsDraft(life.lifecycleState)) {
      issues.push(makeIssue({
        title: `${code} is purchasable while lifecycle is draft`,
        description: "Draft/forthcoming editions cannot be public current checkout products.",
        severity: "commercial_safety_blocker",
        domain: "publication_truth",
        sourceOfTruth: SOURCE_OF_TRUTH_MAP.publicationLifecycle,
        observedSource: SOURCE_OF_TRUTH_MAP.gmiEditionMetadata,
        evidence: [`registry.purchasable=true`, `lifecycle.lifecycleState=${life.lifecycleState}`],
        affectedItems: [code, life.id || code],
        recommendation: "Set purchasable false until lifecycle permits publication.",
      }));
    }
  }

  for (const doc of snapshot.contentDocuments) {
    const fm = doc.frontmatter || {};
    const id = firstDefined(fm.docId, fm.id, fm.productCode);
    const lifecycleState = firstDefined(fm.lifecycleState, fm.status, fm.publicationStatus);
    const publicationTarget = firstDefined(fm.publicationTarget, fm.publicationDate, fm.publishedAt);

    const claimsPublished =
      String(lifecycleState || "").toLowerCase().includes("published") ||
      fm.draft === false;

    const publicationDate = parseDateSafe(publicationTarget);
    if (publicationDate && publicationDate > new Date() && claimsPublished) {
      issues.push(makeIssue({
        title: `${doc.file} appears published before publication date`,
        description: `publicationTarget=${publicationTarget}, today=${todayIsoDate()}`,
        severity: "publication_lifecycle_conflict",
        domain: "publication_truth",
        blocksPublication: true,
        evidence: [`publicationTarget=${publicationTarget}`, `draft=${fm.draft}`],
        affectedItems: [doc.file],
        recommendation: "Keep as draft/forthcoming until publication gate passes.",
      }));
    }

    if (id && /^GMI/i.test(String(id))) {
      const code = normaliseCode(String(id).replace(/^GMI[-_]/i, "gmi_"));
      const life = snapshot.lifecycle.get(code);

      if (life && lifecycleState && String(lifecycleState).toUpperCase() !== String(life.lifecycleState).toUpperCase()) {
        // Determine if the frontmatter state is a pre-publication state
        const fmIsPrePublication = /DRAFT|RELEASE_CANDIDATE|FORTHCOMING|SCHEDULED|production_release_candidate/i.test(String(lifecycleState));
        const lifecycleIsPrePublication = lifecycleIsDraft(life.lifecycleState);
        // If both are pre-publication states, this is an admin-preparation mismatch → governed tension
        const isAdminPrepMismatch = fmIsPrePublication && lifecycleIsPrePublication;

        issues.push(makeIssue({
          title: `${doc.file} frontmatter lifecycle differs from lifecycle authority`,
          description: `frontmatter=${lifecycleState}, lifecycle=${life.lifecycleState}`,
          severity: isAdminPrepMismatch ? "governed_tension" : "publication_lifecycle_conflict",
          domain: "publication_truth",
          governedTension: isAdminPrepMismatch ? true : undefined,
          blocksPublication: isAdminPrepMismatch ? false : true,
          sourceOfTruth: SOURCE_OF_TRUTH_MAP.publicationLifecycle,
          evidence: [`${doc.file}: lifecycle=${lifecycleState}`, `${life.source}: lifecycle=${life.lifecycleState}`],
          affectedItems: [doc.file, code],
          recommendation: isAdminPrepMismatch
            ? "Admin-preparation state mismatch. Align frontmatter to lifecycle enum for consistency, but this does not block publication."
            : "Synchronise frontmatter or remove duplicate lifecycle truth from content.",
        }));
      }

      const hasReviewMarker = /prior[-\s]?quarter|previous quarter|call review|review ledger|material calls/i.test(doc.body || "");
      if (claimsPublished && !hasReviewMarker) {
        issues.push(makeIssue({
          title: `${doc.file} lacks visible prior-call review marker`,
          description: "Quarterly intelligence should compound through verification, not only publication.",
          severity: "governance_contradiction",
          domain: "publication_truth",
          evidence: ["No prior-quarter/call-review marker found"],
          affectedItems: [doc.file],
          recommendation: "Add or link material-call review before treating as verified intelligence.",
          falsification: "Add clear prior-quarter review or mark as non-quarterly/non-GMI.",
        }));
      }
    }
  }

  return issues;
}

function detectNarrativeTruth(snapshot) {
  const issues = [];
  const targetFiles = uniq([
    ...TARGET_PUBLIC_SURFACES.filter(exists),
    ...snapshot.files.content,
  ]);

  for (const file of targetFiles) {
    const text = readText(file, "");
    if (!text) continue;

    const lines = text.split(/\r?\n/);

    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];
      const lower = line.toLowerCase();

      for (const term of SENSITIVE_NARRATIVE_TERMS) {
        if (!lower.includes(term.toLowerCase())) continue;

        const allowed = isLikelyDenialOrGuardrail(line) || lower.includes("unlike") || lower.includes("instead of");

        issues.push(makeIssue({
          title: `Narrative term "${term}" found`,
          description: `${file}:${index + 1} — ${line.trim().slice(0, 180)}`,
          severity: allowed ? "informational_note" : "narrative_drift",
          domain: "narrative_truth",
          evidence: [`${file}:${index + 1}`],
          affectedItems: [file],
          recommendation: allowed
            ? "Allowed if clearly used as denial/contrast. Keep under review."
            : "Rewrite to restrained governed-intelligence language.",
        }));
      }
    }
  }

  const professionals = readText("pages/professionals.tsx", "");
  if (professionals) {
    for (const term of ["client consent", "advisor-mediated", "authority", "controlled access"]) {
      if (!professionals.toLowerCase().includes(term.toLowerCase())) {
        issues.push(makeIssue({
          title: `/professionals missing professional-boundary term: ${term}`,
          description: "Professional page must clearly describe advisor boundary and consent.",
          severity: "narrative_drift",
          domain: "narrative_truth",
          doctrineClaimId: "professional-boundary",
          evidence: [`missing term "${term}"`],
          affectedItems: ["pages/professionals.tsx"],
          recommendation: `Add language covering ${term}.`,
        }));
      }
    }
  }

  const oversight = exists("pages/oversight/index.tsx")
    ? readText("pages/oversight/index.tsx", "")
    : readText("pages/oversight.tsx", "");

  if (oversight) {
    const lower = oversight.toLowerCase();
    const mentionsOversight = lower.includes("oversight") || lower.includes("retainer");
    const gated =
      lower.includes("not self-serve") ||
      lower.includes("contracted") ||
      lower.includes("review-gated") ||
      lower.includes("gated") ||
      lower.includes("human review");

    if (mentionsOversight && !gated) {
      issues.push(makeIssue({
        title: "Oversight page may imply ungated access",
        description: "Oversight/retainer copy should make gated, contracted, human-reviewed access explicit.",
        severity: "narrative_drift",
        domain: "narrative_truth",
        doctrineClaimId: "retainer-oversight-boundary",
        evidence: ["oversight page lacks clear gated marker"],
        affectedItems: ["pages/oversight/index.tsx"],
        recommendation: "Add contracted/review-gated/not-self-serve language.",
      }));
    }
  }

  return issues;
}

function detectBehaviourTruth(snapshot) {
  const issues = [];
  const probes = [];

  function addProbe(id, title, status, evidence = [], recommendation = "") {
    probes.push({ id, title, status, evidence, recommendation });
  }

  const diagnosticFiles = uniq([
    ...snapshot.files.pages.filter((file) => /diagnostic|assessment|signal|decision-pressure|results?/i.test(file)),
    ...snapshot.files.app.filter((file) => /diagnostic|assessment|signal|decision-pressure|results?/i.test(file)),
    ...snapshot.files.lib.filter((file) => /diagnostic|assessment|signal|decision-pressure|results?/i.test(file)),
  ]);

  const diagnosticText = diagnosticFiles.map((file) => `${file}\n${readText(file)}`).join("\n\n");

  if (/answer|input|response|formData|submission/i.test(diagnosticText) && /score|derive|calculate|extract|evaluate/i.test(diagnosticText)) {
    addProbe("diagnostic-derived-output", "Diagnostic outputs appear derived from input", "verified_real", [
      "input/response markers and derive/score/evaluate markers found",
    ]);
  } else {
    issues.push(makeIssue({
      title: "Diagnostic derivation is weakly evidenced",
      description: "The runner did not find strong evidence that diagnostic outputs derive from submitted input.",
      severity: "governance_contradiction",
      domain: "behaviour_truth",
      doctrineClaimId: "contradiction-detection",
      inferred: true,
      evidence: [`diagnosticFiles=${diagnosticFiles.length}`],
      affectedItems: diagnosticFiles.slice(0, 10),
      recommendation: "Expose explicit engine derivation from user input.",
    }));
  }

  if (/evidenceTier|evidence tier|EvidenceStrength|confidence|falsification/i.test(diagnosticText)) {
    addProbe("diagnostic-evidence-posture", "Diagnostics expose evidence/confidence posture", "verified_real", [
      "evidence/confidence/falsification markers found",
    ]);
  } else {
    issues.push(makeIssue({
      title: "Diagnostic evidence posture is weakly evidenced",
      description: "Diagnostics should surface evidence tier/confidence/falsification where relevant.",
      severity: "governance_contradiction",
      domain: "behaviour_truth",
      doctrineClaimId: "evidence-discipline",
      inferred: true,
      affectedItems: diagnosticFiles.slice(0, 10),
      recommendation: "Connect diagnostics to evidence posture output.",
    }));
  }

  if (/contradiction|tension|misalignment|drift/i.test(diagnosticText)) {
    addProbe("diagnostic-contradiction-extraction", "Diagnostics appear to extract contradiction/tension", "verified_real", [
      "contradiction/tension/misalignment markers found",
    ]);
  } else {
    issues.push(makeIssue({
      title: "Diagnostic contradiction extraction is weakly evidenced",
      description: "The product claims contradiction detection but diagnostic surfaces do not clearly show it.",
      severity: "governance_contradiction",
      domain: "behaviour_truth",
      doctrineClaimId: "contradiction-detection",
      inferred: true,
      affectedItems: diagnosticFiles.slice(0, 10),
      recommendation: "Expose explicit contradiction extraction or pattern naming.",
    }));
  }

  if (/memory|continuity|save.*case|case.*state|session/i.test(diagnosticText)) {
    addProbe("diagnostic-memory-continuity", "Diagnostics appear connected to memory/continuity", "strongly_indicated", [
      "memory/continuity/session markers found",
    ]);
  } else {
    issues.push(makeIssue({
      title: "Diagnostic continuity write is weakly evidenced",
      description: "Serious diagnostic outputs should preserve unresolved contradictions where permission allows.",
      severity: "governance_contradiction",
      domain: "behaviour_truth",
      doctrineClaimId: "continuity",
      inferred: true,
      affectedItems: diagnosticFiles.slice(0, 10),
      recommendation: "Connect diagnostic outputs to case continuity/memory where permitted.",
    }));
  }

  const decisionCentreText = readText("pages/decision-centre.tsx", "") + "\n" + readText("lib/product/decision-centre-contract.ts", "");
  if (decisionCentreText) {
    if (/case|continuity|memory|unresolved|decision/i.test(decisionCentreText)) {
      addProbe("decision-centre-case-memory", "Decision Centre carries case/continuity concepts", "verified_real", [
        "case/continuity/memory markers found",
      ]);
    } else {
      issues.push(makeIssue({
        title: "Decision Centre may be generic rather than living case console",
        description: "Decision Centre should not collapse into a generic dashboard.",
        severity: "governance_contradiction",
        domain: "behaviour_truth",
        doctrineClaimId: "continuity",
        affectedItems: ["pages/decision-centre.tsx"],
        recommendation: "Ensure case state, unresolved items, or memory are visible in Decision Centre.",
      }));
    }
  }

  const strategyFiles = snapshot.files.lib
    .concat(snapshot.files.components, snapshot.files.pages)
    .filter((file) => /strategy-room|StrategyRoom|strategy_room/i.test(file));

  const strategyText = strategyFiles.map((file) => `${file}\n${readText(file)}`).join("\n\n");

  if (strategyFiles.length > 0) {
    if (/blocker|checkpoint|execution|feedback|record|escalation/i.test(strategyText)) {
      addProbe("strategy-room-execution-governance", "Strategy Room carries execution/blocker/checkpoint markers", "strongly_indicated", [
        `strategyFiles=${strategyFiles.length}`,
      ]);
    } else {
      issues.push(makeIssue({
        title: "Strategy Room execution governance is weakly evidenced",
        description: "Strategy Room should preserve blockers, checkpoints, execution records, or escalation state.",
        severity: "governance_contradiction",
        domain: "behaviour_truth",
        doctrineClaimId: "continuity",
        inferred: true,
        affectedItems: strategyFiles.slice(0, 10),
        recommendation: "Wire Strategy Room assets to execution/blocker/checkpoint state.",
      }));
    }
  }

  snapshot.behaviourProbes = probes;
  return issues;
}

function detectEvidenceTruth(snapshot) {
  const issues = [];
  const allText = uniq([
    ...snapshot.files.lib,
    ...snapshot.files.components,
    ...snapshot.files.pages,
    ...snapshot.files.content,
  ]).map((file) => `${file}\n${readText(file)}`).join("\n\n");

  const markers = {
    evidenceTier: /evidenceTier|evidence tier|EvidenceTier|evidence-stage|evidence strength/i.test(allText),
    confidence: /confidence|confidenceBand|confidence posture|Confidence/i.test(allText),
    falsification: /falsification|falsify|falsifiable/i.test(allText),
    missingEvidence: /missing evidence|unsupported|insufficient evidence|evidence unavailable/i.test(allText),
  };

  for (const [marker, present] of Object.entries(markers)) {
    if (!present) {
      issues.push(makeIssue({
        title: `Evidence truth marker missing: ${marker}`,
        description: "The product claims evidence discipline. This marker was not found strongly across the estate.",
        severity: "governance_contradiction",
        domain: "evidence_truth",
        doctrineClaimId: "evidence-discipline",
        inferred: true,
        evidence: [`marker=${marker}`],
        recommendation: `Add or expose ${marker} in relevant product outputs.`,
      }));
    }
  }

  snapshot.evidenceTruthMarkers = markers;
  return issues;
}

function detectLivingComponentTruth(snapshot) {
  const issues = [];
  const audits = [];

  for (const component of LIVING_COMPONENTS) {
    if (!exists(component)) {
      audits.push({
        component,
        status: "missing",
        safetyLevel: "future",
        evidence: ["file missing"],
      });

      issues.push(makeIssue({
        title: `Living component missing: ${component}`,
        description: "Expected living component is absent.",
        severity: "informational_note",
        domain: "living_component_truth",
        affectedItems: [component],
        recommendation: "Create only if still part of living architecture.",
      }));
      continue;
    }

    const text = readText(component);
    const acceptsProps =
      /interface\s+\w*Props|type\s+\w*Props|React\.FC<|function\s+\w+\s*\(\s*\{/.test(text);
    const stateMarkers =
      /viewModel|evidence|memory|contradiction|recommendation|finding|stage|outcome|delta|confidence|review/i.test(text);
    const demoMarkers =
      /demo|placeholder|mock|sample|hardcoded|TODO|coming soon/i.test(text);

    const name = path.basename(component, ".tsx");
    const usageFiles = snapshot.files.pages
      .concat(snapshot.files.components, snapshot.files.lib)
      .filter((file) => file !== component && readText(file).includes(name));

    let status = "needs_review";
    let safetyLevel = "future";

    if (acceptsProps && stateMarkers && usageFiles.length > 0 && !demoMarkers) {
      status = "wired_real";
      safetyLevel = "internal";
    } else if (acceptsProps && stateMarkers && usageFiles.length > 0) {
      status = "wired_inferred";
      safetyLevel = "internal";
    } else if (acceptsProps && stateMarkers) {
      status = "component_ready_unwired";
      safetyLevel = "future";
    } else {
      status = "decorative_or_static_risk";
      safetyLevel = "future";
    }

    audits.push({
      component,
      status,
      safetyLevel,
      acceptsProps,
      stateMarkers,
      demoMarkers,
      usageCount: usageFiles.length,
      usageFiles: usageFiles.slice(0, 10),
    });

    if (status === "decorative_or_static_risk") {
      issues.push(makeIssue({
        title: `Living component may be decorative/static: ${name}`,
        description: "Living components should represent real product state, not theatre.",
        severity: "governance_contradiction",
        domain: "living_component_truth",
        doctrineClaimId: "living-intelligence",
        inferred: true,
        evidence: [
          `acceptsProps=${acceptsProps}`,
          `stateMarkers=${stateMarkers}`,
          `usageCount=${usageFiles.length}`,
        ],
        affectedItems: [component],
        recommendation: "Wire to living engine output or mark explicitly future-only.",
      }));
    }
  }

  snapshot.livingComponentAudit = audits;
  return issues;
}

function detectBuildAndRouteTruth(snapshot) {
  const issues = [];

  for (const envFile of snapshot.files.env) {
    const lines = readText(envFile).split(/\r?\n/);

    for (const raw of lines) {
      const line = raw.trim();
      if (!line || line.startsWith("#") || !line.includes("=")) continue;

      const idx = line.indexOf("=");
      const key = line.slice(0, idx).trim();
      let value = line.slice(idx + 1).trim().replace(/^["']|["']$/g, "");

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
          evidence: [`${envFile}: ${key}=${mask(value)}`],
          affectedItems: [envFile, key],
          recommendation: "Set absolute URL or harden resolver.",
        }));
      }
    }
  }

  const requiredRoutes = [
    "/professionals",
    "/system",
    "/method",
    "/enterprise",
    "/oversight",
    "/decision-centre",
    "/products",
    "/pricing",
    "/intelligence/gmi",
  ];

  for (const route of requiredRoutes) {
    if (!routeExists(route)) {
      issues.push(makeIssue({
        title: `Required public route missing: ${route}`,
        description: "Core public product-truth route does not resolve.",
        severity: "content_route_failure",
        domain: "route_truth",
        evidence: routeCandidates(route).map((candidate) => `missing: ${candidate}`),
        affectedItems: [route],
        recommendation: "Create route or update product surface map.",
      }));
    }
  }

  const siteUrl = readText("lib/site-url.ts", "");
  if (siteUrl && !/new URL|try|catch|fallback|safe/i.test(siteUrl)) {
    issues.push(makeIssue({
      title: "site-url resolver may not validate malformed URLs",
      description: "URL resolver should fail safely on empty/malformed values.",
      severity: "informational_note",
      domain: "build_truth",
      evidence: ["No obvious validation/fallback marker found"],
      affectedItems: ["lib/site-url.ts"],
      recommendation: "Confirm malformed env values fall back safely.",
    }));
  }

  return issues;
}

function detectContentAccessTruth(snapshot) {
  const issues = [];

  for (const doc of snapshot.contentDocuments) {
    const text = doc.text.toLowerCase();
    const file = doc.file.toLowerCase();
    const fm = doc.frontmatter || {};

    const looksRestricted =
      file.includes("restricted") ||
      file.includes("internal") ||
      file.includes("private") ||
      text.includes("restricted distribution") ||
      text.includes("internal only") ||
      text.includes("members-only");

    const markedPublic =
      fm.public === true ||
      String(fm.access || "").toLowerCase() === "public" ||
      String(fm.visibility || "").toLowerCase() === "public";

    if (looksRestricted && markedPublic) {
      issues.push(makeIssue({
        title: `${doc.file} appears restricted but marked public`,
        description: "Restricted content must not be exposed by public route/content resolver.",
        severity: "restricted_public_exposure",
        domain: "content_access_truth",
        evidence: ["frontmatter public/access/visibility indicates public"],
        affectedItems: [doc.file],
        recommendation: "Fix frontmatter or route resolver access policy.",
      }));
    }
  }

  return issues;
}

// ─────────────────────────────────────────────────────────────────────────────
// Memory and learning
// ─────────────────────────────────────────────────────────────────────────────

function computeCriticalFileHashes() {
  const files = [
    "lib/commercial/catalog.ts",
    "lib/commercial/gmi/gmi-edition-registry.ts",
    "lib/intelligence/market-intelligence-lifecycle.ts",
    "lib/commercial/commercial-action-resolver.ts",
    "lib/commercial/pricing-actions.ts",
    "pages/api/billing/checkout.ts",
    "components/commercial/CheckoutButton.tsx",
    "pages/products.tsx",
    "pages/pricing.tsx",
    "data/ProductAuthorityContract.json",
    "reports/product-release-readiness-matrix.json",
    "reports/product-release-governance-matrix.json",
  ];

  const out = {};
  for (const file of files) {
    if (exists(file)) out[file] = fileHash(file);
  }
  return out;
}

function applyMemory(snapshot, issues) {
  const previous =
    snapshot.memory && typeof snapshot.memory === "object"
      ? snapshot.memory
      : { version: 2, findings: {}, fileHashes: {} };

  const previousFindings = previous.findings || {};
  const now = new Date().toISOString();
  const currentSignatures = new Set(issues.map((issue) => issue.signature));

  const findings = { ...previousFindings };
  const learningEvents = [];

  for (const issue of issues) {
    const old = findings[issue.signature];

    if (!old) {
      findings[issue.signature] = {
        signature: issue.signature,
        title: issue.title,
        firstSeen: now,
        lastSeen: now,
        recurrenceCount: 1,
        status: "new",
        previousSeverity: null,
        currentSeverity: issue.severity,
        affectedItems: issue.affectedItems,
        doctrineClaimId: issue.doctrineClaimId,
        evidence: issue.evidence,
        ownerDecision: null,
        acceptedRisk: issue.acceptedRisk || false,
      };

      learningEvents.push({ type: "new", signature: issue.signature, title: issue.title });
      continue;
    }

    const previousSeverity = old.currentSeverity;
    const worsened = severityRank(issue.severity) > severityRank(previousSeverity);
    const improved = severityRank(issue.severity) < severityRank(previousSeverity);

    findings[issue.signature] = {
      ...old,
      title: issue.title,
      lastSeen: now,
      recurrenceCount: Number(old.recurrenceCount || 0) + 1,
      status: worsened ? "worsened" : improved ? "improved" : "repeated",
      previousSeverity,
      currentSeverity: issue.severity,
      affectedItems: issue.affectedItems,
      doctrineClaimId: issue.doctrineClaimId,
      evidence: issue.evidence,
    };

    learningEvents.push({
      type: worsened ? "worsened" : improved ? "improved" : "repeated",
      signature: issue.signature,
      title: issue.title,
      recurrenceCount: Number(old.recurrenceCount || 0) + 1,
    });
  }

  for (const [signature, old] of Object.entries(previousFindings)) {
    if (!currentSignatures.has(signature) && old.status !== "resolved") {
      findings[signature] = {
        ...old,
        status: "resolved",
        resolvedAt: now,
      };

      learningEvents.push({
        type: "resolved",
        signature,
        title: old.title,
      });
    }
  }

  const currentHashes = computeCriticalFileHashes();
  const previousHashes = previous.fileHashes || {};

  for (const [file, currentHash] of Object.entries(currentHashes)) {
    if (previousHashes[file] && previousHashes[file] !== currentHash) {
      learningEvents.push({
        type: "critical_file_changed",
        file,
        previousHash: previousHashes[file],
        currentHash,
      });
    }
  }

  const nextMemory = {
    version: 2,
    engineVersion: ENGINE_VERSION,
    updatedAt: now,
    findings,
    fileHashes: currentHashes,
  };

  return { memory: nextMemory, learningEvents };
}

function severityRank(severity) {
  if (severity === "fatal_build_blocker") return 100;
  if (severity === "checkout_bypass") return 95;
  if (severity === "commercial_safety_blocker") return 90;
  if (severity === "restricted_public_exposure") return 90;
  if (severity === "publication_lifecycle_conflict") return 75;
  if (severity === "source_of_truth_conflict") return 70;
  if (severity === "governance_contradiction") return 60;
  if (severity === "content_route_failure") return 50;
  if (severity === "narrative_drift") return 40;
  if (severity === "storefront_gap") return 40;
  if (severity === "governed_tension") return 20;
  if (severity === "informational_note") return 10;
  return 0;
}

// ─────────────────────────────────────────────────────────────────────────────
// Guardrails, interventions, report
// ─────────────────────────────────────────────────────────────────────────────

function checkGuardrails(issues) {
  const violations = [];

  function add(rule, description, severity, affectedItems = []) {
    violations.push({ rule, description, severity, affectedItems });
  }

  const checkout = issues.filter((issue) => issue.severity === "checkout_bypass");
  if (checkout.length > 0) {
    add(
      "resolver_controls_checkout",
      "Product checkout bypass detected.",
      "critical",
      checkout.flatMap((issue) => issue.affectedItems)
    );
  }

  const authority = issues.filter((issue) => issue.doctrineClaimId === "authority-boundary" && issue.blocksDeployment);
  if (authority.length > 0) {
    add(
      "authority_delta_zero",
      "Potential authority transfer detected outside guardrail context.",
      "critical",
      authority.flatMap((issue) => issue.affectedItems)
    );
  }

  const publication = issues.filter((issue) => issue.domain === "publication_truth" && issue.blocksDeployment);
  if (publication.length > 0) {
    add(
      "publication_lifecycle_controls_publication_truth",
      "Publication state contradicts lifecycle authority.",
      "high",
      publication.flatMap((issue) => issue.affectedItems)
    );
  }

  const restricted = issues.filter((issue) => issue.severity === "restricted_public_exposure");
  if (restricted.length > 0) {
    add(
      "restricted_content_not_public",
      "Restricted content appears publicly exposed.",
      "critical",
      restricted.flatMap((issue) => issue.affectedItems)
    );
  }

  return violations;
}

function classifyIntervention(issue) {
  if (issue.severity === "fatal_build_blocker") {
    return {
      issueId: issue.id,
      type: "block_deployment",
      owner: "release_engineering",
      action: "Block deployment until build/environment truth is corrected.",
    };
  }

  if (issue.severity === "checkout_bypass") {
    return {
      issueId: issue.id,
      type: "block_checkout_and_deployment",
      owner: "commercial_engineering",
      action: "Remove bypass and force resolver/server checkout enforcement.",
    };
  }

  if (issue.severity === "commercial_safety_blocker") {
    return {
      issueId: issue.id,
      type: "commercial_hold",
      owner: "commercial_operations",
      action: "Hold commercial exposure until governance and surface agree.",
    };
  }

  if (issue.severity === "restricted_public_exposure") {
    return {
      issueId: issue.id,
      type: "block_publication",
      owner: "content_governance",
      action: "Remove restricted exposure before publication/deployment.",
    };
  }

  if (issue.severity === "publication_lifecycle_conflict") {
    return {
      issueId: issue.id,
      type: "publication_review",
      owner: "intelligence_operations",
      action: "Use lifecycle authority to determine current/forthcoming/archive state.",
    };
  }

  if (issue.requiresOwnerDecision) {
    return {
      issueId: issue.id,
      type: "owner_decision_required",
      owner: "owner",
      action: "Escalate for owner decision before public/commercial promotion.",
    };
  }

  if (issue.governedTension) {
    return {
      issueId: issue.id,
      type: "governed_tension",
      owner: "governance",
      action: "Track as safe tension while guardrails continue to hold.",
    };
  }

  return {
    issueId: issue.id,
    type: "monitor",
    owner: "product_engineering",
    action: "Track and repair in the relevant product truth pass.",
  };
}

function summarise(issues, guardrails, learningEvents, snapshot) {
  const bySeverity = {};
  const byDomain = {};
  const byPosture = {};

  for (const issue of issues) {
    bySeverity[issue.severity] = (bySeverity[issue.severity] || 0) + 1;
    byDomain[issue.domain] = (byDomain[issue.domain] || 0) + 1;
    byPosture[issue.evidencePosture] = (byPosture[issue.evidencePosture] || 0) + 1;
  }

  const blockers = issues.filter((issue) => issue.blocksDeployment);
  const owner = issues.filter((issue) => issue.requiresOwnerDecision);
  const tensions = issues.filter((issue) => issue.governedTension);

  return {
    totalIssues: issues.length,
    blockers: blockers.length,
    ownerDecisionsRequired: owner.length,
    governedTensions: tensions.length,
    guardrailViolations: guardrails.length,
    repeatedIssues: learningEvents.filter((event) => event.type === "repeated").length,
    resolvedIssues: learningEvents.filter((event) => event.type === "resolved").length,
    regressions: learningEvents.filter((event) => event.type === "worsened").length,
    criticalFileChanges: learningEvents.filter((event) => event.type === "critical_file_changed").length,
    doctrineClaimsChecked: DOCTRINE_CLAIMS.length,
    doctrinePostures: snapshot.doctrinePostures?.length || 0,
    behaviourProbes: snapshot.behaviourProbes?.length || 0,
    livingComponentsAudited: snapshot.livingComponentAudit?.length || 0,
    bySeverity,
    byDomain,
    byPosture,
    exitCode: blockers.length > 0 ? 1 : 0,
  };
}

function buildReport(snapshot, issues, memoryResult) {
  const guardrailViolations = checkGuardrails(issues);
  const interventions = issues.map(classifyIntervention);
  const recommendations = issues.map((issue) => ({
    issueId: issue.id,
    priority: issue.blocksDeployment ? "critical" : issue.requiresOwnerDecision ? "high" : issue.governedTension ? "low" : "medium",
    recommendation: issue.recommendation,
    affectedItems: issue.affectedItems,
  }));

  const summary = summarise(issues, guardrailViolations, memoryResult.learningEvents, snapshot);

  return {
    generatedAt: new Date().toISOString(),
    engineVersion: ENGINE_VERSION,
    sourceOfTruthMap: SOURCE_OF_TRUTH_MAP,
    summary,
    doctrineClaims: DOCTRINE_CLAIMS.map((claim) => ({
      id: claim.id,
      domain: claim.domain,
      claim: claim.claim,
    })),
    doctrinePostures: snapshot.doctrinePostures || [],
    behaviourProbes: snapshot.behaviourProbes || [],
    evidenceTruthMarkers: snapshot.evidenceTruthMarkers || {},
    livingComponentAudit: snapshot.livingComponentAudit || [],
    issues,
    guardrailViolations,
    interventions,
    recommendations,
    learningEvents: memoryResult.learningEvents,
    refusedToInfer: [
      "No Stripe IDs invented.",
      "No prices invented.",
      "No publication approval inferred from registry current/admin focus.",
      "No owner approval inferred.",
      "No user/client consent inferred.",
      "No legal/financial conclusion inferred.",
      "No product capability inferred without code/file evidence.",
    ],
    snapshotDigest: {
      products: snapshot.products.length,
      catalogEntries: Object.keys(snapshot.catalog).length,
      pages: snapshot.files.pages.length + snapshot.files.app.length,
      libFiles: snapshot.files.lib.length,
      components: snapshot.files.components.length,
      contentDocuments: snapshot.contentDocuments.length,
      gmiRegistryEditions: Object.keys(snapshot.gmi.registry).length,
      gmiLifecycleEditions: Object.keys(snapshot.gmi.lifecycle).length,
    },
  };
}

function composeMarkdown(report) {
  const lines = [];

  lines.push("# Living Product Governance Report");
  lines.push("");
  lines.push(`Generated: ${report.generatedAt}`);
  lines.push(`Engine: ${report.engineVersion}`);
  lines.push("");

  lines.push("## Summary");
  lines.push("");
  lines.push("| Metric | Count |");
  lines.push("|---|---:|");
  lines.push(`| Total issues | ${report.summary.totalIssues} |`);
  lines.push(`| Blockers | ${report.summary.blockers} |`);
  lines.push(`| Owner decisions required | ${report.summary.ownerDecisionsRequired} |`);
  lines.push(`| Governed tensions | ${report.summary.governedTensions} |`);
  lines.push(`| Guardrail violations | ${report.summary.guardrailViolations} |`);
  lines.push(`| Repeated issues | ${report.summary.repeatedIssues} |`);
  lines.push(`| Resolved issues | ${report.summary.resolvedIssues} |`);
  lines.push(`| Regressions | ${report.summary.regressions} |`);
  lines.push(`| Critical file changes | ${report.summary.criticalFileChanges} |`);
  lines.push(`| Doctrine claims checked | ${report.summary.doctrineClaimsChecked} |`);
  lines.push(`| Behaviour probes | ${report.summary.behaviourProbes} |`);
  lines.push(`| Living components audited | ${report.summary.livingComponentsAudited} |`);
  lines.push(`| Exit code | ${report.summary.exitCode} |`);
  lines.push("");

  lines.push("## Source-of-Truth Map");
  lines.push("");
  lines.push("| Question | Governing Source |");
  lines.push("|---|---|");
  for (const [key, value] of Object.entries(report.sourceOfTruthMap)) {
    lines.push(`| ${key} | \`${value}\` |`);
  }
  lines.push("");

  lines.push("## Doctrine Claims");
  lines.push("");
  lines.push("| ID | Domain | Claim |");
  lines.push("|---|---|---|");
  for (const claim of report.doctrineClaims) {
    lines.push(`| ${claim.id} | ${claim.domain} | ${claim.claim.replace(/\|/g, "/")} |`);
  }
  lines.push("");

  lines.push("## Doctrine Evidence Postures");
  lines.push("");
  if (!report.doctrinePostures.length) {
    lines.push("No doctrine posture confirmations recorded.");
  } else {
    lines.push("| Claim | Posture | Evidence |");
    lines.push("|---|---|---|");
    for (const item of report.doctrinePostures) {
      lines.push(`| ${item.claimId} | ${item.posture} | ${(item.evidence || []).join("; ").replace(/\|/g, "/")} |`);
    }
  }
  lines.push("");

  lines.push("## Behaviour Probes");
  lines.push("");
  if (!report.behaviourProbes.length) {
    lines.push("No behaviour probes recorded.");
  } else {
    lines.push("| Probe | Status | Evidence |");
    lines.push("|---|---|---|");
    for (const probe of report.behaviourProbes) {
      lines.push(`| ${probe.id} | ${probe.status} | ${(probe.evidence || []).join("; ").replace(/\|/g, "/")} |`);
    }
  }
  lines.push("");

  lines.push("## Living Component Audit");
  lines.push("");
  if (!report.livingComponentAudit.length) {
    lines.push("No living components audited.");
  } else {
    lines.push("| Component | Status | Safety | Usage |");
    lines.push("|---|---|---|---:|");
    for (const item of report.livingComponentAudit) {
      lines.push(`| \`${item.component}\` | ${item.status} | ${item.safetyLevel} | ${item.usageCount || 0} |`);
    }
  }
  lines.push("");

  lines.push("## Issues");
  lines.push("");
  if (!report.issues.length) {
    lines.push("No issues detected.");
  } else {
    for (const issue of report.issues) {
      lines.push(`### ${issue.id} — ${issue.title}`);
      lines.push("");
      lines.push(`- **Severity:** ${issue.severity}`);
      lines.push(`- **Domain:** ${issue.domain}`);
      if (issue.doctrineClaimId) lines.push(`- **Doctrine claim:** ${issue.doctrineClaimId}`);
      lines.push(`- **Evidence posture:** ${issue.evidencePosture}`);
      lines.push(`- **Confidence:** ${issue.confidence}`);
      lines.push(`- **Blocks deployment:** ${issue.blocksDeployment ? "YES" : "NO"}`);
      lines.push(`- **Owner decision required:** ${issue.requiresOwnerDecision ? "YES" : "NO"}`);
      if (issue.governedTension) lines.push("- **Governed tension:** YES");
      if (issue.sourceOfTruth) lines.push(`- **Source of truth:** \`${issue.sourceOfTruth}\``);
      if (issue.observedSource) lines.push(`- **Observed source:** \`${issue.observedSource}\``);
      if (issue.expectedSource) lines.push(`- **Expected source:** ${issue.expectedSource}`);
      lines.push(`- **Description:** ${issue.description}`);
      if (issue.evidence?.length) {
        lines.push("- **Evidence:**");
        for (const item of issue.evidence) lines.push(`  - ${item}`);
      }
      if (issue.affectedItems?.length) {
        lines.push(`- **Affected items:** ${issue.affectedItems.map((item) => `\`${item}\``).join(", ")}`);
      }
      lines.push(`- **Falsification:** ${issue.falsification}`);
      lines.push(`- **Recommendation:** ${issue.recommendation}`);
      lines.push("");
    }
  }

  lines.push("## Guardrail Violations");
  lines.push("");
  if (!report.guardrailViolations.length) {
    lines.push("No guardrail violations detected.");
  } else {
    for (const violation of report.guardrailViolations) {
      lines.push(`- **${violation.rule}** (${violation.severity}): ${violation.description}`);
    }
  }
  lines.push("");

  lines.push("## Learning Events");
  lines.push("");
  if (!report.learningEvents.length) {
    lines.push("No memory changes recorded.");
  } else {
    for (const event of report.learningEvents) {
      if (event.file) lines.push(`- **${event.type}:** ${event.file}`);
      else lines.push(`- **${event.type}:** ${event.title || event.signature}`);
    }
  }
  lines.push("");

  lines.push("## What The System Refused To Infer");
  lines.push("");
  for (const item of report.refusedToInfer) {
    lines.push(`- ${item}`);
  }
  lines.push("");

  lines.push("## Final Gate");
  lines.push("");
  if (report.summary.exitCode === 0) {
    lines.push("✅ Living product governance check passed.");
  } else {
    lines.push("❌ Living product governance check failed. Resolve blockers before deployment/promotion.");
  }
  lines.push("");

  return lines.join("\n");
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  issueCounter = 1;

  heading("Living Product Governance — Market-Ready MVP");

  const snapshot = loadSnapshot();
  snapshot.doctrinePostures = [];
  snapshot.behaviourProbes = [];
  snapshot.livingComponentAudit = [];

  ok(`Products inspected: ${snapshot.products.length}`);
  ok(`Catalog entries parsed: ${Object.keys(snapshot.catalog).length}`);
  ok(`Content documents inspected: ${snapshot.contentDocuments.length}`);
  ok(`Living components expected: ${LIVING_COMPONENTS.length}`);

  heading("Running product-truth detectors");

  const detectors = [
    ["Doctrine Truth", detectDoctrineTruth],
    ["Commercial Truth", detectCommercialTruth],
    ["Checkout Truth", detectCheckoutTruth],
    ["Publication Truth", detectPublicationTruth],
    ["Narrative Truth", detectNarrativeTruth],
    ["Behaviour Truth", detectBehaviourTruth],
    ["Evidence Truth", detectEvidenceTruth],
    ["Living Component Truth", detectLivingComponentTruth],
    ["Build / Route Truth", detectBuildAndRouteTruth],
    ["Content Access Truth", detectContentAccessTruth],
  ];

  const issues = [];

  for (const [label, detector] of detectors) {
    const before = issues.length;
    const found = detector(snapshot);
    issues.push(...found);
    const count = issues.length - before;
    if (count === 0) ok(`${label}: no issues`);
    else warn(`${label}: ${count} issue(s)`);
  }

  const memoryResult = applyMemory(snapshot, issues);
  const report = buildReport(snapshot, issues, memoryResult);

  writeJson(REPORT_JSON, report);
  writeText(REPORT_MD, composeMarkdown(report));
  writeJson(MEMORY_FILE, memoryResult.memory);

  heading("Results");
  log(`Total issues:              ${report.summary.totalIssues}`);
  log(`Blockers:                  ${report.summary.blockers}`);
  log(`Owner decisions required:  ${report.summary.ownerDecisionsRequired}`);
  log(`Governed tensions:         ${report.summary.governedTensions}`);
  log(`Guardrail violations:      ${report.summary.guardrailViolations}`);
  log(`Repeated issues:           ${report.summary.repeatedIssues}`);
  log(`Resolved issues:           ${report.summary.resolvedIssues}`);
  log(`Regressions:               ${report.summary.regressions}`);
  log(`Critical file changes:     ${report.summary.criticalFileChanges}`);
  log("");

  if (report.summary.blockers > 0) {
    fail("Blocking issues detected:");
    for (const issue of report.issues.filter((item) => item.blocksDeployment)) {
      log(`  - ${issue.id}: ${issue.title}`);
    }
    log("");
  }

  const ownerIssues = report.issues.filter((issue) => issue.requiresOwnerDecision);
  if (ownerIssues.length > 0) {
    warn("Owner decisions required:");
    for (const issue of ownerIssues) {
      log(`  - ${issue.id}: ${issue.title}`);
    }
    log("");
  }

  ok(`Wrote ${REPORT_JSON}`);
  ok(`Wrote ${REPORT_MD}`);
  ok(`Wrote ${MEMORY_FILE}`);

  if (JSON_MODE) {
    console.log(JSON.stringify(report, null, 2));
  }

  log("");
  log("=".repeat(100));

  if (WARN_ONLY) {
    warn("--warn-only supplied; exiting 0 despite blockers.");
    process.exit(0);
  }

  if (report.summary.exitCode === 0) {
    ok("LIVING PRODUCT GOVERNANCE CHECK PASSED");
    process.exit(0);
  }

  fail("LIVING PRODUCT GOVERNANCE CHECK FAILED");
  process.exit(1);
}

main().catch((error) => {
  console.error("");
  console.error("Fatal error in living product governance runner:");
  console.error(error);
  process.exit(1);
});