// lib/assets/pdf-identity.ts

export type PdfCategory =
  | "framework"
  | "worksheet"
  | "playbook"
  | "brief"
  | "report"
  | "toolkit";

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
};

const CURATED_METADATA: Record<string, CuratedPdfMetadata> = {
  "global-market-intelligence-report-q1-2026": {
    title: "Global Market Intelligence Report Q1 2026",
    category: "report",
    access: "paid",
    description: "Board-level market intelligence for institutional decision-making.",
  },
  "global-market-intelligence-board-deck-q1-2026": {
    title: "Global Market Intelligence Board Deck Q1 2026",
    category: "report",
    access: "paid",
    description: "Executive board deck companion to the Q1 2026 intelligence report.",
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
    return fs.existsSync(path.join(process.cwd(), "public", publicPath.replace(/^\/+/, "")));
  } catch {
    return false;
  }
}

function readJsonFile<T>(relativePath: string): T | null {
  if (typeof window !== "undefined") return null;

  try {
    const fs = require("fs") as typeof import("fs");
    const path = require("path") as typeof import("path");
    return JSON.parse(fs.readFileSync(path.join(process.cwd(), relativePath), "utf8")) as T;
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
