// scripts/pdf/build-pdf-registry-generated.ts
// Generates: scripts/pdf/pdf-registry.generated.ts
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { ALL_SOURCE_PDFS, type SourcePDFItem, type PaperFormat, type PDFFormat, type Tier, type PDFType } from "./pdf-registry.source";

type Paper = "A4" | "Letter" | "A3";
const PAPER_ORDER: Paper[] = ["A4", "Letter", "A3"];

type GeneratedTier = Tier;
type GeneratedType = PDFType;
type GeneratedFileFormat = PDFFormat;

interface GeneratedPDFConfig {
  id: string;
  title: string;
  type: GeneratedType;
  tier: GeneratedTier;
  outputPath: string;
  description?: string;
  excerpt?: string;
  tags?: string[];
  paper?: Paper;
  format: GeneratedFileFormat;
  isInteractive?: boolean;
  isFillable?: boolean;
  requiresAuth?: boolean;
  version?: string;
  author?: string;
  category?: string;
  createdAt?: string;
  updatedAt?: string;
  priority?: number;
  preload?: boolean;
  lastModified?: string;
  exists?: boolean;
  fileSizeBytes?: number;
}

function invariant(condition: any, message: string): asserts condition {
  if (!condition) throw new Error(`[build-pdf-registry-generated] ${message}`);
}

/** HELPER: Fixed ReferenceError from previous run */
function paperFormatsOnly(formats?: PaperFormat[]): Paper[] {
  if (!Array.isArray(formats)) return [];
  return formats.filter((f): f is Paper => f === "A4" || f === "Letter" || f === "A3");
}

function normalizeWebPath(p: string): string {
  const raw = String(p || "").trim();
  let v = raw.replace(/\\/g, "/");
  if (!v.startsWith("/")) v = `/${v}`;
  v = v.replace(/^\/public\//, "/");
  v = v.replace(/\/{2,}/g, "/");
  return v;
}

function extensionForFormat(fmt: GeneratedFileFormat): string {
  switch (fmt) {
    case "PDF": return ".pdf";
    case "EXCEL": return ".xlsx";
    case "POWERPOINT": return ".pptx";
    case "ZIP": return ".zip";
    case "BINARY": return ".bin";
    default: return ".pdf";
  }
}

function ensureExtensionByFormat(webPath: string, fmt: GeneratedFileFormat): string {
  const ext = extensionForFormat(fmt);
  if (webPath.toLowerCase().endsWith(ext)) return webPath;
  return `${webPath}${ext}`;
}

function statPublicFile(webPath: string): { exists: boolean; lastModified?: string; fileSizeBytes?: number } {
  try {
    const fullPath = path.join(process.cwd(), "public", webPath.replace(/^\/+/, ""));
    const st = fs.statSync(fullPath);
    return {
      exists: true,
      lastModified: st.mtime.toISOString(),
      fileSizeBytes: st.size,
    };
  } catch {
    return { exists: false };
  }
}

function discoverUnmappedFiles(mappedPaths: Set<string>): GeneratedPDFConfig[] {
  const searchRoots = [
    path.join(process.cwd(), "public", "assets", "downloads"),
    path.join(process.cwd(), "public", "vault", "downloads")
  ];
  
  const discovered: GeneratedPDFConfig[] = [];

  const scan = (dir: string) => {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scan(fullPath);
      } else {
        const webPath = normalizeWebPath("/" + path.relative(path.join(process.cwd(), "public"), fullPath));
        if (mappedPaths.has(webPath)) continue;

        const ext = path.extname(entry.name).toLowerCase();
        if (![".pdf", ".xlsx", ".pptx", ".zip", ".bin"].includes(ext)) continue;

        const idBase = path.basename(entry.name, ext);
        const parentFolder = path.basename(path.dirname(fullPath));
        const stats = statPublicFile(webPath);

        discovered.push({
          id: `auto__${parentFolder}__${idBase}`,
          title: idBase.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
          type: "other",
          tier: "architect",
          outputPath: webPath,
          format: ext === ".pdf" ? "PDF" : "BINARY",
          exists: stats.exists,
          lastModified: stats.lastModified,
          fileSizeBytes: stats.fileSizeBytes,
          category: "unmapped-discovery",
          version: "1.0.0",
          requiresAuth: true
        });
      }
    }
  };

  searchRoots.forEach(scan);
  return discovered;
}

function addPaperSuffix(webPath: string, paper: Paper): string {
  const ext = path.posix.extname(webPath);
  const base = webPath.substring(0, webPath.length - ext.length);
  return `${base}-${paper.toLowerCase()}${ext}`;
}

async function main(): Promise<void> {
  const source = (ALL_SOURCE_PDFS || []) as SourcePDFItem[];
  const generated: GeneratedPDFConfig[] = [];
  const mappedPaths = new Set<string>();

  for (const item of source) {
    const baseId = String(item.id).trim();
    const fmt: GeneratedFileFormat = (item.format ?? "PDF") as GeneratedFileFormat;
    const basePath = ensureExtensionByFormat(normalizeWebPath(item.outputPath), fmt);
    
    mappedPaths.add(basePath);
    const baseStat = statPublicFile(basePath);

    const baseEntry: GeneratedPDFConfig = {
      ...item,
      id: baseId,
      type: item.type as GeneratedType,
      tier: item.tier as GeneratedTier,
      outputPath: basePath,
      format: fmt,
      exists: baseStat.exists,
      lastModified: baseStat.lastModified,
      fileSizeBytes: baseStat.fileSizeBytes,
    };

    generated.push(baseEntry);

    const papers = paperFormatsOnly(item.formats as PaperFormat[]);
    if (fmt === "PDF" && papers.length >= 2) {
      for (const paper of papers) {
        const variantPath = addPaperSuffix(basePath, paper);
        mappedPaths.add(variantPath);
        const st = statPublicFile(variantPath);
        generated.push({
          ...baseEntry,
          id: `${baseId}__${paper.toLowerCase()}`,
          title: `${item.title} (${paper})`,
          outputPath: variantPath,
          paper,
          exists: st.exists,
          lastModified: st.lastModified,
          fileSizeBytes: st.fileSizeBytes,
        });
      }
    }
  }

  // Sweep unmapped files
  const discovered = discoverUnmappedFiles(mappedPaths);
  const final = [...generated, ...discovered];

  const outFile = path.join(process.cwd(), "lib/pdf/pdf-registry.generated.ts");
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  
  const content = `/** AUTO-GENERATED - DO NOT EDIT */
export const GENERATED_PDF_CONFIGS = ${JSON.stringify(final, null, 2)} as const;
export const getGeneratedPDFs = () => GENERATED_PDF_CONFIGS;
`;

  fs.writeFileSync(outFile, content, "utf8");
  console.log(`✅ Registry built: ${final.length} assets (${source.length} manual, ${discovered.length} discovered).`);
}

const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] === path.resolve(__filename)) {
  main().catch(console.error);
}

export default main;