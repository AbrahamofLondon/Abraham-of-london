// lib/assets/pdf-identity.ts

export type PdfCategory =
  | "framework"
  | "worksheet"
  | "playbook"
  | "brief"
  | "report"
  | "toolkit"
  | "case_evidence";

export type PdfAuthority =
  | "canonical"
  | "generated"
  | "legacy"
  | "draft";

export type PdfAccess =
  | "public"
  | "inner_circle"
  | "restricted"
  | "paid";

export type PdfAssetIdentity = {
  slug: string;
  title: string;
  version?: string;
  category: PdfCategory;
  authority: PdfAuthority;
  access: PdfAccess;
  canonicalPath: string;
  pricingOverride?: AssetPricingOverride | null;
};

export type AssetPricingOverride = {
  slug: string;
  price: number;
  originalPrice?: number | null;
  currency?: string;
  rationale?: string;
};

export type PdfAssetIdentityResolved = PdfAssetIdentity & {
  description?: string;
  fileExists?: boolean;
  sourcePaths?: string[];
  aliases?: string[];
  previewImage?: string | null;
};

type CanonicalDecisionRecord = {
  slug: string;
  canonicalPath: string;
  decision: "canonical" | "alias" | "duplicate" | "conflict";
  reason?: string;
  resolved: boolean;
  sourcePaths: string[];
  aliasPaths?: string[];
  materialisationRequired?: boolean;
  confidence?: "high" | "medium" | "low";
};

type RegistryAssetRecord = {
  publicUrl: string;
  slugCandidate: string;
  folderClass: string;
  fileSizeBytes: number;
  sha256: string;
  canonicalityStatus: string;
  duplicateGroupId: string | null;
};

type CuratedPdfMetadata = Partial<
  Omit<PdfAssetIdentity, "slug" | "canonicalPath">
> & {
  title?: string;
  description?: string;
  previewImage?: string | null;
  pricingOverride?: AssetPricingOverride | null;
};

const CURATED_METADATA: Record<string, CuratedPdfMetadata> = {
  "decision-exposure-calculator": {
    title: "Decision Exposure Instrument",
    category: "worksheet",
    access: "paid",
    description:
      "Quantifies financial consequence and structural blockage created by unresolved decisions.",
    pricingOverride: {
      slug: "decision-exposure-calculator",
      price: 29,
      currency: "gbp",
      rationale: "Paid worksheet producing a specific decision directive.",
    },
  },
  "decision-exposure-instrument": {
    title: "Decision Exposure Instrument",
    category: "worksheet",
    access: "paid",
    description:
      "Quantifies the cost of being wrong before the market enforces it. Produces classification, consequence statement, and next action.",
    pricingOverride: {
      slug: "decision-exposure-instrument",
      price: 29,
      currency: "gbp",
      rationale: "Paid decision instrument producing exposure classification and next action.",
    },
  },
  "mandate-clarity-framework": {
    title: "Mandate Clarity Framework",
    category: "framework",
    access: "paid",
    description:
      "Forces ownership, escalation authority, and accountability boundaries into a board-presentable mandate map.",
    pricingOverride: {
      slug: "mandate-clarity-framework",
      price: 49,
      currency: "gbp",
      rationale: "Reusable governance framework with board-level output.",
    },
  },
  "structural-failure-diagnostic-canvas": {
    title: "Structural Failure Diagnostic Canvas",
    category: "worksheet",
    access: "paid",
    description:
      "Classifies failure source, cascade effect, and decision implication before post-mortem politics distort the reading.",
    pricingOverride: {
      slug: "structural-failure-diagnostic-canvas",
      price: 19,
      currency: "gbp",
      rationale: "Rapid worksheet for a single failure-classification decision.",
    },
  },
  "team-alignment-gap-map": {
    title: "Team Alignment Gap Map",
    category: "worksheet",
    access: "paid",
    description:
      "Maps leadership intent against actual team execution and produces an alignment classification.",
    pricingOverride: {
      slug: "team-alignment-gap-map",
      price: 29,
      currency: "gbp",
      rationale: "Paid worksheet producing a concrete alignment decision.",
    },
  },
  "escalation-readiness-scorecard": {
    title: "Escalation Readiness Scorecard",
    category: "worksheet",
    access: "paid",
    description:
      "Determines whether to escalate now, gather evidence, or resolve locally.",
    pricingOverride: {
      slug: "escalation-readiness-scorecard",
      price: 19,
      currency: "gbp",
      rationale: "Single-use escalation decision worksheet.",
    },
  },
  "governance-drift-detector": {
    title: "Governance Drift Detector",
    category: "framework",
    access: "paid",
    description:
      "Measures divergence between stated governance and actual decision behaviour.",
    pricingOverride: {
      slug: "governance-drift-detector",
      price: 49,
      currency: "gbp",
      rationale: "Reusable governance framework with drift classification.",
    },
  },
  "strategic-priority-stack-builder": {
    title: "Strategic Priority Stack Builder",
    category: "framework",
    access: "paid",
    description:
      "Force-ranks priorities under budget, time, and political constraints.",
    pricingOverride: {
      slug: "strategic-priority-stack-builder",
      price: 49,
      currency: "gbp",
      rationale: "Reusable strategic decision framework.",
    },
  },
  "execution-risk-index": {
    title: "Execution Risk Index",
    category: "framework",
    access: "paid",
    description:
      "Tests delivery fragility before resources are committed.",
    pricingOverride: {
      slug: "execution-risk-index",
      price: 29,
      currency: "gbp",
      rationale: "Focused execution-risk framework with explicit classification.",
    },
  },
  "intervention-path-selector": {
    title: "Intervention Path Selector",
    category: "toolkit",
    access: "paid",
    description:
      "Selects fix, restructure, or escalate with resource needs, timeline, and fallback path.",
    pricingOverride: {
      slug: "intervention-path-selector",
      price: 79,
      currency: "gbp",
      rationale: "Multi-step intervention toolkit with board-presentable output.",
    },
  },
  "board-brief-template-structured": {
    title: "Board Brief Template (Structured)",
    category: "toolkit",
    access: "paid",
    description:
      "Converts diagnostics into a board-ready brief with severity, action ownership, exposure, and timeline.",
    pricingOverride: {
      slug: "board-brief-template-structured",
      price: 129,
      currency: "gbp",
      rationale: "Capstone toolkit for board communication and repeated use.",
    },
  },
  "global-market-intelligence-report-q1-2026": {
    title: "Global Market Intelligence Report Q1 2026",
    category: "report",
    access: "paid",
    description: "Board-level market intelligence for institutional decision-making.",
    pricingOverride: {
      slug: "global-market-intelligence-report-q1-2026",
      price: 59,
      currency: "gbp",
      rationale: "Decision-support intelligence brief positioned below Executive Reporting and above commodity reports.",
    },
  },
  "global-market-intelligence-board-deck-q1-2026": {
    title: "Global Market Intelligence Board Deck Q1 2026",
    category: "report",
    access: "paid",
    description: "Executive board deck companion to the Q1 2026 intelligence report.",
    pricingOverride: {
      slug: "global-market-intelligence-board-deck-q1-2026",
      price: 129,
      currency: "gbp",
      rationale: "Board-deck toolkit pricing.",
    },
  },
  // Case evidence dossiers — free through controlled route
  "case-dossier-tariff-shock": {
    title: "Case Dossier \u2014 When Growth Models Broke Under Tariff Shock",
    category: "case_evidence",
    access: "public",
    description: "Institutional case evidence of structural repricing under tariff escalation conditions.",
  },
  "case-dossier-team-alignment-illusion": {
    title: "Case Dossier \u2014 The Illusion of Team Alignment Under Pressure",
    category: "case_evidence",
    access: "public",
    description: "Case evidence documenting hidden perception divergence between leadership and execution layer.",
  },
  "case-dossier-escalation-denied": {
    title: "Case Dossier \u2014 Why Escalation Was Denied (And That Saved the System)",
    category: "case_evidence",
    access: "public",
    description: "Case evidence showing governed escalation criteria preventing compounding intervention error.",
  },
  "fathering-without-fear": {
    title: "Fathering Without Fear",
    category: "brief",
    access: "public",
    description: "A controlled teaser asset for the Fathering Without Fear release.",
  },
  "legacy-architecture-canvas": {
    title: "Legacy Architecture Canvas",
    category: "worksheet",
    access: "inner_circle",
    description: "A structured canvas for designing legacy, governance, and household stewardship.",
  },
  "download-legacy-architecture-canvas": {
    title: "Legacy Architecture Canvas",
    category: "worksheet",
    access: "inner_circle",
    description: "A structured canvas for designing legacy, governance, and household stewardship.",
  },
};

function normalizeSlug(input: unknown): string {
  return String(input ?? "")
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "")
    .split("/")
    .filter(Boolean)
    .pop()
    ?.replace(/\.pdf$/i, "")
    .toLowerCase() || "";
}

function humanizeSlug(slug: string): string {
  return slug
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function inferCategory(slug: string): PdfCategory {
  const value = slug.toLowerCase();
  if (value.includes("worksheet") || value.includes("scorecard") || value.includes("template") || value.includes("canvas")) {
    return "worksheet";
  }
  if (value.includes("playbook")) return "playbook";
  if (value.includes("brief") || value.startsWith("cb-") || value.includes("cue-card")) return "brief";
  if (value.includes("report") || value.includes("intelligence") || value.includes("deck")) return "report";
  if (value.includes("toolkit") || value.includes("pack") || value.includes("kit")) return "toolkit";
  return "framework";
}

function inferAccess(slug: string, registryRecord?: RegistryAssetRecord): PdfAccess {
  const value = slug.toLowerCase();
  if (value.includes("global-market-intelligence")) return "paid";
  if (value.includes("legacy-architecture-canvas")) return "inner_circle";
  if (registryRecord?.publicUrl.includes("/vault/")) return "inner_circle";
  return "public";
}

function inferAuthority(decision: CanonicalDecisionRecord, registryRecord?: RegistryAssetRecord): PdfAuthority {
  if (!decision.resolved) return "draft";
  if (registryRecord?.canonicalityStatus === "generated") return "generated";
  if (registryRecord?.canonicalityStatus === "legacy_compatibility") return "legacy";
  if (decision.canonicalPath.startsWith("/assets/downloads/")) return "canonical";
  return "legacy";
}

function fileExists(publicPath: string): boolean {
  if (typeof window !== "undefined") return false;

  try {
    const fs = require("fs") as typeof import("fs");
    const path = require("path") as typeof import("path");
    const relativePath = publicPath.replace(/^\/+/, "");
    const privateRoot = path.join(process.cwd(), "private_storage", "premium-content");
    if (relativePath.startsWith("assets/downloads/") || relativePath.startsWith("_archive/")) {
      return fs.existsSync(path.join(privateRoot, relativePath));
    }
    return fs.existsSync(path.join(process.cwd(), "public", relativePath));
  } catch {
    return false;
  }
}

function readJsonFile<T>(relativePath: string): T | null {
  if (typeof window !== "undefined") return null;

  try {
    const fs = require("fs") as typeof import("fs");
    const path = require("path") as typeof import("path");
    return JSON.parse(fs.readFileSync(path.join(/* turbopackIgnore: true */ process.cwd(), relativePath), "utf8")) as T;
  } catch {
    return null;
  }
}

function loadCanonicalDecisionMap(): Record<string, CanonicalDecisionRecord> {
  const parsed = readJsonFile<{ decisions?: CanonicalDecisionRecord[] }>("reports/pdf-canonical-decisions.json");
  return Object.fromEntries(
    (parsed?.decisions || [])
      .filter((decision) => decision.resolved)
      .map((decision) => [normalizeSlug(decision.slug), decision]),
  );
}

function loadRegistryMap(): Record<string, RegistryAssetRecord> {
  const parsed = readJsonFile<{ assets?: RegistryAssetRecord[] }>("reports/pdf-asset-registry.json");
  const canonicalAssets = (parsed?.assets || []).filter((asset) =>
    /^\/assets\/downloads\/[^/]+\.pdf$/i.test(asset.publicUrl),
  );

  return Object.fromEntries(
    canonicalAssets.map((asset) => [normalizeSlug(asset.slugCandidate || asset.publicUrl), asset]),
  );
}

function resolveDecision(slug: string): CanonicalDecisionRecord | null {
  return loadCanonicalDecisionMap()[normalizeSlug(slug)] || null;
}

function resolveRegistryRecord(slug: string, decision?: CanonicalDecisionRecord | null): RegistryAssetRecord | undefined {
  const registry = loadRegistryMap();
  const normalized = normalizeSlug(slug);
  return registry[normalized] || registry[normalizeSlug(decision?.canonicalPath)];
}

export function getPdfAssetIdentityBySlug(slugInput: string): PdfAssetIdentityResolved {
  const slug = normalizeSlug(slugInput);
  if (!slug) {
    throw new Error("PDF asset slug is required.");
  }

  const decision = resolveDecision(slug);
  if (!decision) {
    throw new Error(`Unknown PDF asset slug: ${slug}`);
  }

  const registryRecord = resolveRegistryRecord(slug, decision);
  const curated = CURATED_METADATA[slug] || {};
  const exists = fileExists(decision.canonicalPath);

  return {
    slug,
    title: curated.title ?? humanizeSlug(slug),
    version: curated.version,
    category: curated.category ?? inferCategory(slug),
    authority: curated.authority ?? inferAuthority(decision, registryRecord),
    access: curated.access ?? inferAccess(slug, registryRecord),
    canonicalPath: decision.canonicalPath,
    pricingOverride: curated.pricingOverride ?? null,
    description: curated.description ?? decision.reason,
    previewImage: curated.previewImage ?? null,
    fileExists: exists,
    sourcePaths: decision.sourcePaths || [],
    aliases: decision.aliasPaths || [],
  };
}

export function getPdfAssetBySlug(slug: string): PdfAssetIdentityResolved | null {
  try {
    return getPdfAssetIdentityBySlug(slug);
  } catch {
    return null;
  }
}

export function listPdfAssetIdentities(): PdfAssetIdentityResolved[] {
  const decisions = loadCanonicalDecisionMap();
  return Object.keys(decisions)
    .sort((a, b) => a.localeCompare(b))
    .map((slug) => getPdfAssetIdentityBySlug(slug));
}

export function assertPdfAssetIdentity(slug: string): PdfAssetIdentityResolved {
  const identity = getPdfAssetIdentityBySlug(slug);
  if (!identity.fileExists) {
    throw new Error(`PDF asset ${identity.slug} is missing canonical binary ${identity.canonicalPath}.`);
  }
  return identity;
}

export function pdfAccessToRequiredTier(access: PdfAccess): "public" | "inner_circle" | "restricted" | "client" {
  if (access === "inner_circle") return "inner_circle";
  if (access === "restricted") return "restricted";
  if (access === "paid") return "client";
  return "public";
}
