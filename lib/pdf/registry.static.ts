// lib/pdf/registry.static.ts
/**
 * INSTITUTIONAL PDF REGISTRY (RUNTIME SSOT)
 * ------------------------------------------------------------
 * Stable runtime entrypoint.
 * Data is generated into: lib/pdf/pdf-registry.generated.ts
 *
 * POLICY:
 * - NO PLACEHOLDERS
 * - Registry lists REAL files in repo (public/assets/downloads/**)
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

  // optional runtime-enrichment fields
  existsOnDisk?: boolean;
  fileSizeHuman?: string;
  lastModifiedISO?: string;

  [k: string]: unknown;
}

// GENERATED DATA (written by build script)
import {
  GENERATED_PDF_CONFIGS as _GENERATED_PDF_CONFIGS,
  GENERATED_AT as _GENERATED_AT,
  GENERATED_COUNT as _GENERATED_COUNT,
} from "./pdf-registry.generated";

export const GENERATED_PDF_CONFIGS: ReadonlyArray<PDFRegistryEntry> =
  _GENERATED_PDF_CONFIGS as unknown as ReadonlyArray<PDFRegistryEntry>;

export const GENERATED_AT: string = String(_GENERATED_AT || "");
export const GENERATED_COUNT: number = Number(_GENERATED_COUNT || GENERATED_PDF_CONFIGS.length);

// ✅ Backward-compat alias expected by runtime.ts and legacy callers
export const PDF_REGISTRY: ReadonlyArray<PDFRegistryEntry> = GENERATED_PDF_CONFIGS;

export type GeneratedPDFId = PDFRegistryEntry["id"];

export const getGeneratedPDFs = (): ReadonlyArray<PDFRegistryEntry> => GENERATED_PDF_CONFIGS;

export function getAllPDFs(): PDFRegistryEntry[] {
  return GENERATED_PDF_CONFIGS.map((x) => ({ ...x }));
}

export function getPDFById(id: string): PDFRegistryEntry | undefined {
  const key = String(id || "").trim();
  return GENERATED_PDF_CONFIGS.find((x) => x.id === key);
}

export function getRegistryStats() {
  const categories = [...new Set(GENERATED_PDF_CONFIGS.map((c) => String(c.category || "Uncategorized")))];
  return {
    totalAssets: GENERATED_PDF_CONFIGS.length,
    categories,
    categoryCount: categories.length,
    generatedAt: GENERATED_AT || new Date().toISOString(),
    health: {
      exists: GENERATED_PDF_CONFIGS.filter((c) => Boolean(c.exists)).length,
      missing: GENERATED_PDF_CONFIGS.filter((c) => !Boolean(c.exists)).length,
    },
  };
}

// ------------------------------
// NODE-ONLY (dynamic imports)
// ------------------------------

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"] as const;
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  const digits = unitIndex === 0 ? 0 : 1;
  return `${size.toFixed(digits)} ${units[unitIndex]}`;
}

export type NodePDFItem = PDFRegistryEntry & {
  existsOnDisk?: boolean;
  fileSizeHuman?: string;
  lastModifiedISO?: string;
};

export async function getAllPDFItemsNode(options?: { includeMissing?: boolean }): Promise<NodePDFItem[]> {
  if (typeof window !== "undefined") {
    throw new Error("[registry.static] getAllPDFItemsNode is Node-only but was called in the browser.");
  }

  const fsMod = await import("fs");
  const pathMod = await import("path");

  const fs: typeof import("fs") = (fsMod as any).default ?? (fsMod as any);
  const path: typeof import("path") = (pathMod as any).default ?? (pathMod as any);

  const items: NodePDFItem[] = GENERATED_PDF_CONFIGS.map((item) => {
    const rel = String(item.outputPath || "").replace(/^\//, "");
    const fullPath = path.join(process.cwd(), "public", rel);

    let existsOnDisk = false;
    let fileSizeHuman = "0 B";
    let lastModifiedISO = new Date(0).toISOString();

    try {
      if (fs.existsSync(fullPath)) {
        const stats = fs.statSync(fullPath);
        existsOnDisk = true;
        lastModifiedISO = stats.mtime.toISOString();
        fileSizeHuman = formatBytes(stats.size);

        return {
          ...item,
          existsOnDisk,
          fileSizeBytes: typeof item.fileSizeBytes === "number" ? item.fileSizeBytes : stats.size,
          fileSizeHuman,
          lastModifiedISO,
        };
      }
    } catch {
      // ignore
    }

    return { ...item, existsOnDisk, fileSizeHuman, lastModifiedISO };
  });

  if (options?.includeMissing) return items;
  return items.filter((i) => Boolean(i.existsOnDisk));
}