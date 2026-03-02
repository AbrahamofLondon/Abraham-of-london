// scripts/pdf/file-pdf-converter/config.ts
import path from "path";
import fs from "fs";

export type FileType = "mdx" | "xlsx" | "pptx" | "docx" | "pdf" | "txt" | "csv";
export type TierSlug = "architect" | "member" | "free";
export type AccessLevel = TierSlug | "public" | "all";
export type Format = "A4" | "Letter" | "A3";

// IMPORTANT: keep aligned to the rest of your system
export type Quality = "draft" | "standard" | "premium" | "enterprise";

export interface DocumentTier {
  slug: TierSlug;
  displayName: string;

  // "public" is valid here because your content system uses it.
  accessLevel: AccessLevel;

  generatePdf: boolean;
  generateFillable: boolean;

  formats: Format[];
  quality: Quality[];

  // true for non-PDF sources that need conversion
  requiresConversion?: boolean;
}

export interface FileDocument {
  // Path relative to repo root (preferred) OR absolute.
  // Keep relative for stable diffs and portability.
  sourcePath: string;

  // canonical id / slug for output
  pdfName: string;

  displayName: string;
  category: string;
  description: string;

  fileType: FileType;
  thumbnail?: string;

  tiers: DocumentTier[];

  metadata?: Record<string, any>;

  conversionOptions?: {
    excel?: {
      includeCharts: boolean;
      includeFormulas: boolean;
      sheetSelection?: string[];
    };
    powerpoint?: {
      includeNotes: boolean;
      includeHiddenSlides: boolean;
      slidesPerPage: 1 | 2 | 4 | 6;
    };
    mdx?: {
      includeFrontmatter: boolean;
      includeComponents: boolean;
      maxContentLength?: number;
    };
  };
}

// -----------------------------------------------------------------------------
// Paths / Tools (production-safe defaults)
// -----------------------------------------------------------------------------

export const PDF_CONFIG = {
  // Source directories
  sourceDirs: {
    content: path.join(process.cwd(), "content", "downloads"),
    libPdf: path.join(process.cwd(), "lib", "pdf"),
    assets: path.join(process.cwd(), "public", "assets"),
  },

  // Output directories (public served)
  outputDir: path.join(process.cwd(), "public", "assets", "downloads"),
  tierDirs: {
    // aligns to your canonical buckets
    contentDownloads: "content-downloads",
    libPdf: "lib-pdf",
  },

  tempDir: path.join(process.cwd(), ".temp", "pdf-conversion"),

  // External tools (resolved via env first)
  externalTools: {
    libreoffice: process.env.SOFFICE_PATH || process.env.LIBREOFFICE_PATH || "soffice",
    pandoc: process.env.PANDOC_PATH || "pandoc",
  },

  defaultQuality: "premium" as Quality,
  defaultFormats: ["A4", "Letter", "A3"] as Format[],

  // File type handlers
  fileTypeHandlers: {
    mdx: { converter: "mdx", extensions: [".mdx", ".md"] },
    xlsx: { converter: "excel", extensions: [".xlsx", ".xls", ".csv"] },
    pptx: { converter: "powerpoint", extensions: [".pptx", ".ppt"] },
    docx: { converter: "word", extensions: [".docx", ".doc"] },
    pdf: { converter: "copy", extensions: [".pdf"] },
    txt: { converter: "text", extensions: [".txt", ".rtf"] },
    csv: { converter: "csv", extensions: [".csv"] },
  },
} as const;

// -----------------------------------------------------------------------------
// Output naming — deterministic
// -----------------------------------------------------------------------------

export type OutputTarget = {
  outputAbs: string;
  outputRelPublic: string; // "assets/downloads/..."
  outputWeb: string; // "/assets/downloads/..."
};

export function resolveSourceAbs(sourcePath: string): string {
  const p = String(sourcePath || "").trim();
  if (!p) throw new Error("Empty sourcePath");
  return path.isAbsolute(p) ? p : path.join(process.cwd(), p);
}

/**
 * Default output bucket:
 * - sources in lib/pdf -> /assets/downloads/lib-pdf/
 * - sources in content/downloads -> /assets/downloads/content-downloads/
 */
export function outputBucketForSourceAbs(sourceAbs: string): "lib-pdf" | "content-downloads" {
  const norm = sourceAbs.replace(/\\/g, "/").toLowerCase();
  if (norm.includes("/lib/pdf/")) return "lib-pdf";
  return "content-downloads";
}

/**
 * Output path for a generated PDF (file converters):
 * /public/assets/downloads/<bucket>/<pdfName>.pdf
 *
 * We intentionally DO NOT multiply outputs by format/quality here;
 * those axes are handled elsewhere in your newer unified generator.
 */
export function outputTargetFor(document: FileDocument): OutputTarget {
  const srcAbs = resolveSourceAbs(document.sourcePath);
  const bucket = outputBucketForSourceAbs(srcAbs);

  const outputRelPublic = path
    .join("assets", "downloads", bucket, `${document.pdfName}.pdf`)
    .replace(/\\/g, "/");

  const outputAbs = path.join(process.cwd(), "public", outputRelPublic);
  const outputWeb = `/${outputRelPublic}`;

  return { outputAbs, outputRelPublic, outputWeb };
}

// -----------------------------------------------------------------------------
// File Registry (manual entries — optional, but keep if you want curated)
// -----------------------------------------------------------------------------

export const FILE_REGISTRY: FileDocument[] = [
  {
    sourcePath: "content/downloads/legacy-architecture-canvas.mdx",
    pdfName: "legacy-architecture-canvas",
    displayName: "Legacy Architecture Canvas",
    category: "Frameworks",
    description: "Strategic legacy planning framework",
    fileType: "mdx",
    tiers: [
      { slug: "architect", displayName: "Architect", accessLevel: "architect", generatePdf: true, generateFillable: true, formats: ["A4", "Letter", "A3"], quality: ["premium", "enterprise"], requiresConversion: true },
      { slug: "member", displayName: "Member", accessLevel: "member", generatePdf: true, generateFillable: true, formats: ["A4", "Letter", "A3"], quality: ["premium"], requiresConversion: true },
      { slug: "free", displayName: "Free", accessLevel: "public", generatePdf: true, generateFillable: false, formats: ["A4"], quality: ["standard"], requiresConversion: true },
    ],
    conversionOptions: {
      mdx: { includeFrontmatter: true, includeComponents: true },
    },
  },
  {
    sourcePath: "content/downloads/entrepreneur-operating-pack.mdx",
    pdfName: "entrepreneur-operating-pack",
    displayName: "Entrepreneur Operating Pack",
    category: "Business",
    description: "Complete entrepreneur operating system",
    fileType: "mdx",
    tiers: [
      { slug: "architect", displayName: "Architect", accessLevel: "architect", generatePdf: true, generateFillable: true, formats: ["A4", "Letter"], quality: ["premium", "enterprise"], requiresConversion: true },
      { slug: "member", displayName: "Member", accessLevel: "member", generatePdf: true, generateFillable: false, formats: ["A4"], quality: ["premium"], requiresConversion: true },
    ],
  },
  {
    sourcePath: "content/downloads/board-decision-log-template.xlsx",
    pdfName: "board-decision-log-template",
    displayName: "Board Decision Log Template",
    category: "Templates",
    description: "Excel template for board decision tracking",
    fileType: "xlsx",
    tiers: [
      { slug: "architect", displayName: "Architect", accessLevel: "architect", generatePdf: true, generateFillable: false, formats: ["A4", "Letter"], quality: ["premium"], requiresConversion: true },
      { slug: "member", displayName: "Member", accessLevel: "member", generatePdf: true, generateFillable: false, formats: ["A4"], quality: ["standard"], requiresConversion: true },
    ],
    conversionOptions: {
      excel: { includeCharts: true, includeFormulas: false, sheetSelection: ["Sheet1"] },
    },
  },
  {
    sourcePath: "content/downloads/operating-cadence-pack.pptx",
    pdfName: "operating-cadence-pack",
    displayName: "Operating Cadence Pack",
    category: "Presentations",
    description: "PowerPoint presentation on operating rhythms",
    fileType: "pptx",
    tiers: [
      { slug: "architect", displayName: "Architect", accessLevel: "architect", generatePdf: true, generateFillable: false, formats: ["A4"], quality: ["premium"], requiresConversion: true },
      { slug: "member", displayName: "Member", accessLevel: "member", generatePdf: true, generateFillable: false, formats: ["A4"], quality: ["standard"], requiresConversion: true },
    ],
    conversionOptions: {
      powerpoint: { includeNotes: false, includeHiddenSlides: false, slidesPerPage: 1 },
    },
  },
  {
    sourcePath: "lib/pdf/decision-log-template.pdf",
    pdfName: "decision-log-template",
    displayName: "Decision Log Template",
    category: "Templates",
    description: "PDF version of decision log",
    fileType: "pdf",
    tiers: [
      { slug: "architect", displayName: "Architect", accessLevel: "architect", generatePdf: true, generateFillable: false, formats: ["A4"], quality: ["premium"], requiresConversion: false },
      { slug: "member", displayName: "Member", accessLevel: "member", generatePdf: true, generateFillable: false, formats: ["A4"], quality: ["standard"], requiresConversion: false },
    ],
  },
];

// -----------------------------------------------------------------------------
// Auto-discovery (recursive, stable, deduped)
// -----------------------------------------------------------------------------

const EXT_TO_TYPE: Record<string, FileType> = {
  ".mdx": "mdx",
  ".md": "mdx",
  ".xlsx": "xlsx",
  ".xls": "xlsx",
  ".csv": "csv",
  ".pptx": "pptx",
  ".ppt": "pptx",
  ".docx": "docx",
  ".doc": "docx",
  ".pdf": "pdf",
  ".txt": "txt",
  ".rtf": "txt",
};

function formatDisplayName(baseName: string): string {
  return baseName
    .split(/[-_]/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function walkRecursive(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const out: string[] = [];
  const stack = [dir];

  while (stack.length) {
    const d = stack.pop()!;
    const entries = fs.readdirSync(d, { withFileTypes: true });
    for (const e of entries) {
      const abs = path.join(d, e.name);
      if (e.isDirectory()) stack.push(abs);
      else out.push(abs);
    }
  }
  return out;
}

function toRepoRelative(abs: string): string {
  const rel = path.relative(process.cwd(), abs);
  return rel.replace(/\\/g, "/");
}

/**
 * Returns curated registry + auto-discovered items (non-duplicates).
 * Auto-discovered items are FREE tier only by default.
 */
export function discoverAllFiles(): FileDocument[] {
  const discovered: FileDocument[] = [];

  const registeredBasenames = new Set(
    FILE_REGISTRY.map((d) => path.basename(d.sourcePath).toLowerCase()),
  );

  const dirs = [PDF_CONFIG.sourceDirs.content, PDF_CONFIG.sourceDirs.libPdf];

  for (const dir of dirs) {
    const files = walkRecursive(dir);
    for (const abs of files) {
      const ext = path.extname(abs).toLowerCase();
      if (!EXT_TO_TYPE[ext]) continue;

      const baseName = path.basename(abs, ext);
      const fileName = path.basename(abs).toLowerCase();

      if (registeredBasenames.has(fileName)) continue;

      const fileType = EXT_TO_TYPE[ext];

      const rel = toRepoRelative(abs);

      discovered.push({
        sourcePath: rel,
        pdfName: baseName,
        displayName: formatDisplayName(baseName),
        category: "Uncategorized",
        description: `Auto-discovered ${fileType.toUpperCase()} source`,
        fileType,
        tiers: [
          {
            slug: "free",
            displayName: "Free",
            accessLevel: "public",
            generatePdf: true,
            generateFillable: false,
            formats: ["A4"],
            quality: ["standard"],
            requiresConversion: fileType !== "pdf",
          },
        ],
      });
    }
  }

  return [...FILE_REGISTRY, ...discovered];
}