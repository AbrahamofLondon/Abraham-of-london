/**
 * INSTITUTIONAL PDF REGISTRY (RUNTIME SSOT)
 * ------------------------------------------------------------
 * Stable runtime entrypoint.
 * Data is generated into: lib/pdf/pdf-registry.generated.ts
 * ------------------------------------------------------------
 */

import type { AccessTier } from "../access/tier-policy";

export type PDFType =
  | "editorial"
  | "framework"
  | "academic"
  | "strategic"
  | "tool"
  | "canvas"
  | "worksheet"
  | "assessment"
  | "journal"
  | "tracker"
  | "bundle"
  | "toolkit"
  | "playbook"
  | "brief"
  | "checklist"
  | "pack"
  | "blueprint"
  | "liturgy"
  | "study"
  | "other";

export type PDFFormat = "PDF" | "EXCEL" | "POWERPOINT" | "ZIP" | "BINARY";
export type PaperFormat = "A4" | "Letter" | "A3" | "bundle";

export interface PDFRegistryEntry {
  id: string;
  title: string;
  type: PDFType;
  tier: string | AccessTier;
  outputPath: string;
  description?: string;
  excerpt?: string;
  tags?: string[];
  paper?: PaperFormat;
  formats?: PaperFormat[];
  format: PDFFormat;
  isInteractive?: boolean;
  isFillable?: boolean;
  requiresAuth?: boolean;
  version?: string;
  author?: string;
  category?: string;
  categorySlug?: string;
  createdAt?: string;
  updatedAt?: string;
  priority?: number;
  preload?: boolean;
  lastModified?: string;
  exists?: boolean;
  fileSizeBytes?: number;
  existsOnDisk?: boolean;
  fileSizeHuman?: string;
  lastModifiedISO?: string;
  [k: string]: unknown;
}

// @ts-ignore - populated by generation script
import {
  GENERATED_PDF_CONFIGS as _GENERATED_PDF_CONFIGS,
  GENERATED_AT as _GENERATED_AT,
  GENERATED_COUNT as _GENERATED_COUNT,
} from "./pdf-registry.generated";

export const GENERATED_PDF_CONFIGS: ReadonlyArray<PDFRegistryEntry> =
  (_GENERATED_PDF_CONFIGS || []) as unknown as ReadonlyArray<PDFRegistryEntry>;

export const GENERATED_AT: string = String(
  _GENERATED_AT || new Date().toISOString(),
);

export const GENERATED_COUNT: number = Number(
  _GENERATED_COUNT || GENERATED_PDF_CONFIGS.length,
);

export const PDF_REGISTRY: ReadonlyArray<PDFRegistryEntry> =
  GENERATED_PDF_CONFIGS;

export type GeneratedPDFId = PDFRegistryEntry["id"];

export type NodePDFItem = PDFRegistryEntry & {
  existsOnDisk?: boolean;
  fileSizeHuman?: string;
  lastModifiedISO?: string;
};

/* -----------------------------------------------------------------------------
   Isomorphic accessors
----------------------------------------------------------------------------- */

export const getGeneratedPDFs = (): ReadonlyArray<PDFRegistryEntry> =>
  GENERATED_PDF_CONFIGS;

export function getAllPDFs(): PDFRegistryEntry[] {
  return [...GENERATED_PDF_CONFIGS];
}

export function getPDFById(id: string): PDFRegistryEntry | undefined {
  const key = String(id || "").trim();
  return GENERATED_PDF_CONFIGS.find((x) => x.id === key);
}

export function getRegistryStats() {
  const categories = [
    ...new Set(
      GENERATED_PDF_CONFIGS.map((c) => String(c.category || "Uncategorized")),
    ),
  ];

  return {
    totalAssets: GENERATED_PDF_CONFIGS.length,
    categories,
    categoryCount: categories.length,
    generatedAt: GENERATED_AT,
    health: {
      exists: GENERATED_PDF_CONFIGS.filter((c) => Boolean(c.exists)).length,
      missing: GENERATED_PDF_CONFIGS.filter((c) => !Boolean(c.exists)).length,
    },
  };
}

/* -----------------------------------------------------------------------------
   Node-only disk inspection
----------------------------------------------------------------------------- */

function formatBytesInternal(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";

  const units = ["B", "KB", "MB", "GB", "TB"] as const;
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

export async function getAllPDFItemsNode(options?: {
  includeMissing?: boolean;
}): Promise<NodePDFItem[]> {
  if (typeof window !== "undefined") {
    console.warn(
      "[registry.static] Node-only utility called in browser. Returning empty set.",
    );
    return [];
  }

  try {
    // eslint-disable-next-line no-eval
    const req = eval("require") as NodeRequire;
    const fs = req("fs") as typeof import("fs");
    const path = req("path") as typeof import("path");

    const items = GENERATED_PDF_CONFIGS.map((item) => {
      const rel = String(item.outputPath || "").replace(/^\/+/, "");
      const fullPath = path.join(process.cwd(), "public", rel);

      let existsOnDisk = false;
      let fileSizeHuman = "0 B";
      let lastModifiedISO = new Date(0).toISOString();
      let size = 0;

      if (fs.existsSync(fullPath)) {
        const stats = fs.statSync(fullPath);
        existsOnDisk = true;
        lastModifiedISO = stats.mtime.toISOString();
        size = stats.size;
        fileSizeHuman = formatBytesInternal(size);
      }

      return {
        ...item,
        existsOnDisk,
        fileSizeHuman,
        lastModifiedISO,
        fileSizeBytes: size || (item.fileSizeBytes as number) || 0,
      };
    });

    return options?.includeMissing
      ? items
      : items.filter((i) => i.existsOnDisk);
  } catch (error) {
    console.error(
      "[registry.static] Failed to execute Node-only disk check:",
      error,
    );
    return [];
  }
}