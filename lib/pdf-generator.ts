/**
 * lib/pdf-generator.ts — V11.1 (Next.js/Netlify Optimized)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import "server-only";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import matter from "gray-matter";
import QRCode from "qrcode";
import { pathToFileURL } from "url";

import { getPDFById } from "./pdf/registry";
import {
  registerPdfFonts,
  CANONICAL_PDF_FONT_FAMILY,
  PDF_FONT_FAMILIES,
} from "./pdf/register-fonts";
import {
  generateDossierSignature,
  getWatermarkPayload,
} from "./intelligence/watermark-delegate";

/* -------------------------------------------------------------------------- */
/* Public types                                                               */
/* -------------------------------------------------------------------------- */

export interface PDFGenResult {
  success: boolean;
  path?: string;
  buffer?: Buffer;
  error?: string;
  cached?: boolean;
  fingerprint?: string;
  meta?: PDFGenMeta;
}

export interface PDFGenMeta {
  id: string;
  title: string;
  slug: string;
  outputPath: string;
  sourcePath?: string;
  sourceFolder?: string;
  detectedTier?: string;
  sourceType?: string;
  contentHash?: string;
}

/* -------------------------------------------------------------------------- */
/* Internal types                                                             */
/* -------------------------------------------------------------------------- */

type ContentlayerDoc = {
  _id?: string;
  type?: string;
  title?: string;
  titleSafe?: string;
  slug?: string;
  slugSafe?: string;
  institutionalId?: string;
  tier?: string;
  accessTierSafe?: string;
  version?: string;
  description?: string;
  summary?: string;
  body?: {
    raw?: string;
    code?: string;
  };
  content?: string;
};

type PDFRegistryConfig = {
  id?: string;
  title?: string;
  slug?: string;
  outputPath?: string;
  tier?: string;
  type?: string;
  summary?: string;
  description?: string;
};

type ParsedMdxFile = {
  filePath: string;
  folder: string;
  content: string;
  frontmatter: Record<string, unknown>;
};

type ResolvedSource = {
  id: string;
  slug: string;
  title: string;
  sourcePath?: string;
  sourceFolder?: string;
  sourceType: string;
  body: string;
  frontmatter: Record<string, unknown>;
  tier: string;
  version: string;
  summary: string;
  description: string;
};

/**
 * Prop type for the template. 
 * Kept here to avoid early import of the template file.
 */
interface BriefDocumentProps {
  config: ResolvedSource & {
    outputPath: string;
    pdfFontFamily: string;
    pdfFontFamilies: typeof PDF_FONT_FAMILIES;
    type: string;
  };
  content: string;
  watermark: any;
  qrCode: string;
  frontmatter: Record<string, unknown>;
}

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

const PROJECT_ROOT = process.cwd();
const CONTENT_ROOT = path.join(PROJECT_ROOT, "content");
const PUBLIC_ROOT = path.join(PROJECT_ROOT, "public");
const CONTENTLAYER_INDEX = path.join(
  PROJECT_ROOT,
  ".contentlayer",
  "generated",
  "index.mjs"
);

const SOURCE_FOLDERS = [
  "briefs", "vault", "strategy", "resources", "downloads",
  "blog", "canon", "dispatch", "intelligence", "posts",
  "books", "prints", "lexicon", "events",
] as const;

const MDX_EXTENSIONS = new Set([".mdx", ".md", ".markdown"]);
const FORBIDDEN_PDF_TYPES = new Set(["Book", "Post", "Canon"]);
const GENERATOR_VERSION = "V11.1";

/* -------------------------------------------------------------------------- */
/* Utilities                                                                  */
/* -------------------------------------------------------------------------- */

function safeString(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value.trim() || fallback;
  return value != null ? String(value) : fallback;
}

function slugify(value: string): string {
  return safeString(value)
    .normalize("NFKD")
    .replace(/[^\w\s/-]+/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase();
}

function normalizeRouteLikeSlug(value: string): string {
  return safeString(value)
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/\/+/g, "/")
    .trim();
}

function getLeafStem(value: string): string {
  const normalized = normalizeRouteLikeSlug(value)
    .replace(/\.(md|mdx|markdown|pdf)$/i, "")
    .replace(/[^\w/-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
  return normalized.split("/").pop() || "document";
}

function sanitizeMDXContent(rawContent: string): string {
  if (!rawContent) return "";
  return rawContent
    .replace(/```[\s\S]*?```/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/^\s*import\s+.*?\s+from\s+['"].*?['"];?\s*$/gm, "")
    .replace(/^\s*export\s+default\s+.*?;?\s*$/gm, "")
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function extractPlainSummary(text: string, maxLength = 320): string {
  const clean = sanitizeMDXContent(text).replace(/\s+/g, " ").trim();
  return clean.length > maxLength ? `${clean.slice(0, maxLength - 1)}\u2026` : clean;
}

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function walkFilesRecursive(rootDir: string): string[] {
  if (!fs.existsSync(rootDir)) return [];
  const results: string[] = [];
  const entries = fs.readdirSync(rootDir, { withFileTypes: true });
  for (const entry of entries) {
    const res = path.resolve(rootDir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkFilesRecursive(res));
    } else if (MDX_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
      results.push(res);
    }
  }
  return results;
}

/* -------------------------------------------------------------------------- */
/* Logic Helpers                                                              */
/* -------------------------------------------------------------------------- */

function inferSourceType(params: { docType?: string; folder?: string; slug?: string }): string {
  const slug = (params.slug || "").toLowerCase();
  if (slug.includes("/lexicon/")) return "Lexicon";
  if (slug.includes("/strategy/")) return "Strategy";
  
  const folderMap: Record<string, string> = {
    briefs: "Brief", intelligence: "Intelligence", strategy: "Strategy", lexicon: "Lexicon"
  };
  return folderMap[params.folder || ""] ?? params.docType ?? "Resource";
}

function resolveCanonicalOutputPath(params: { sourceType: string; slug: string; registryOutputPath?: string }): string {
  if (params.registryOutputPath) return `/${params.registryOutputPath.replace(/^\/+/, "")}`;
  const map: Record<string, string> = {
    Brief: "vault/briefs", Intelligence: "vault/intelligence", Strategy: "strategy"
  };
  const sub = map[params.sourceType] ?? "resources";
  return `/${sub}/${getLeafStem(params.slug)}.pdf`;
}

async function resolveSource(id: string, contentOverride?: string): Promise<ResolvedSource | null> {
  const candidates = [id, slugify(id), normalizeRouteLikeSlug(id)];
  let doc: any = null;

  // 1. Contentlayer Resolution
  if (fs.existsSync(CONTENTLAYER_INDEX)) {
    try {
      const mod = await import(pathToFileURL(CONTENTLAYER_INDEX).href);
      const allDocs = Object.entries(mod)
        .filter(([k]) => k.startsWith("all") && Array.isArray(mod[k]))
        .flatMap(([, v]) => v as any[]);
      doc = allDocs.find(d => candidates.includes(d.institutionalId || d.slug || d.slugSafe || d._id));
    } catch (e) {}
  }

  // 2. MDX Fallback
  let fm: any = {};
  let body = contentOverride || "";
  let sourcePath = "";
  let folder = "";

  if (!doc && !contentOverride) {
    for (const sFolder of SOURCE_FOLDERS) {
      const files = walkFilesRecursive(path.join(CONTENT_ROOT, sFolder));
      const match = files.find(f => candidates.includes(path.parse(f).name));
      if (match) {
        const p = matter(fs.readFileSync(match, "utf8"));
        fm = p.data;
        body = p.content;
        sourcePath = match;
        folder = sFolder;
        break;
      }
    }
  }

  if (!doc && !fm && !contentOverride) return null;

  const slug = doc?.slugSafe || fm.slug || slugify(id);
  const type = inferSourceType({ docType: doc?.type, folder, slug });

  return {
    id, slug,
    title: doc?.title || fm.title || id,
    sourceType: type,
    body: body || doc?.body?.raw || "",
    frontmatter: fm,
    tier: (doc?.tier || fm.tier || "public").toLowerCase(),
    version: String(doc?.version || fm.version || "1.0"),
    summary: doc?.summary || fm.summary || extractPlainSummary(body),
    description: doc?.description || fm.description || extractPlainSummary(body),
    sourcePath, sourceFolder: folder
  };
}

/* -------------------------------------------------------------------------- */
/* Main Engine                                                                */
/* -------------------------------------------------------------------------- */

export async function generatePDF(id: string, force = false, contentOverride?: string): Promise<PDFGenResult> {
  try {
    const source = await resolveSource(id, contentOverride);
    if (!source) return { success: false, error: `Source ${id} not found.` };
    if (FORBIDDEN_PDF_TYPES.has(source.sourceType)) return { success: false, error: `Type ${source.sourceType} forbidden.` };

    const registry = getPDFById(id) as PDFRegistryConfig | null;
    const finalTier = (registry?.tier || source.tier).toLowerCase();
    const finalType = registry?.type || source.sourceType;
    
    const outPublic = resolveCanonicalOutputPath({ sourceType: finalType, slug: source.slug, registryOutputPath: registry?.outputPath });
    const outFs = path.join(PUBLIC_ROOT, outPublic);
    const fingerPath = `${outFs}.fingerprint`;

    const contentHash = crypto.createHash("sha256").update(sanitizeMDXContent(source.body)).digest("hex");
    const fingerprint = crypto.createHash("sha256").update(`${GENERATOR_VERSION}|${id}|${finalTier}|${contentHash}`).digest("hex").slice(0, 24);

    if (!force && fs.existsSync(outFs) && fs.existsSync(fingerPath)) {
      if (fs.readFileSync(fingerPath, "utf8").trim() === fingerprint) {
        return { success: true, path: outPublic, buffer: fs.readFileSync(outFs), cached: true, fingerprint };
      }
    }

    // QR & Security
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://abrahamoflondon.org";
    const qrCode = await QRCode.toDataURL(`${siteUrl}${outPublic}`, { margin: 1 });
    const signature = generateDossierSignature("SYSTEM", id, { brand: "Abraham of London", slug: source.slug, title: source.title });
    const watermark = getWatermarkPayload({ signature, classification: finalTier.toUpperCase(), context: { docType: finalType, reference: id } });

    // ── CRITICAL: DYNAMIC RENDER CONTEXT ──
    const ReactPDF = await import("@react-pdf/renderer");
    const React = await import("react");
    
    registerPdfFonts(ReactPDF, PROJECT_ROOT);

    const { BriefDocument } = await import("./pdf-templates/BriefDocument");

    const pdfBuffer = await ReactPDF.renderToBuffer(
      React.createElement(BriefDocument as any, {
        config: { ...source, type: finalType, outputPath: outPublic, pdfFontFamily: CANONICAL_PDF_FONT_FAMILY, pdfFontFamilies: PDF_FONT_FAMILIES },
        content: sanitizeMDXContent(source.body),
        watermark, qrCode, frontmatter: source.frontmatter
      })
    );

    ensureDir(path.dirname(outFs));
    fs.writeFileSync(outFs, pdfBuffer);
    fs.writeFileSync(fingerPath, fingerprint);

    return { success: true, path: outPublic, buffer: pdfBuffer, cached: false, fingerprint };
  } catch (e: any) {
    console.error(`PDF Error [${id}]:`, e.message);
    return { success: false, error: e.message };
  }
}