/**
 * lib/pdf-generator.ts — V11.0
 *
 * SSOT PDF GENERATION ENGINE — PERMANENT FONT REGISTRATION FIX
 * ─────────────────────────────────────────────────────────────────────────────
 * WHAT CHANGED FROM V10.5 AND WHY:
 *
 * V10.5 called `registerPdfFonts()` at the top of `generatePDF()`, importing
 * it from a separate module. That module called `Font.register()` on whatever
 * `@react-pdf/renderer` instance *it* had resolved at import time. Later in
 * the same function, `@react-pdf/renderer` was dynamically imported again via
 * `await import(...)`. In a tsx/ts-node CLI script running concurrent async
 * batches, Node.js does NOT guarantee these two dynamic-import calls resolve to
 * the same in-memory module instance, so the FontStore that `renderToBuffer`
 * consults was never the FontStore that `Font.register()` wrote to.
 *
 * V11.0 fix (permanent, long-term):
 *   1. `@react-pdf/renderer` is dynamically imported ONCE per render call.
 *   2. That live instance is passed directly into `registerPdfFonts()`.
 *   3. `Font.register()` therefore writes to the SAME FontStore that
 *      `renderToBuffer` reads from — always, in every execution context
 *      (Next.js server, tsx CLI, worker threads, Vercel edge).
 *   4. No module-level singleton guard is used here. Calling Font.register()
 *      multiple times is safe and idempotent in @react-pdf/renderer.
 *   5. React is imported from the SAME dynamic import call to guarantee
 *      version and instance consistency with the renderer.
 *
 * FONT FAMILY NAMES are now imported from register-fonts.ts as typed constants
 * (PDF_FONT_FAMILIES / CANONICAL_PDF_FONT_FAMILY) — one source of truth.
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
/* Public types                                                                */
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
/* Internal types                                                              */
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

/* -------------------------------------------------------------------------- */
/* Constants                                                                   */
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

/**
 * Ordered list of content source folders that the file walker will search.
 * Add new content areas here — do not duplicate entries.
 */
const SOURCE_FOLDERS = [
  "briefs",
  "vault",
  "strategy",
  "resources",
  "downloads",
  "blog",
  "canon",
  "dispatch",
  "intelligence",
  "posts",
  "books",
  "prints",
  "lexicon",
  "events",
] as const;

const MDX_EXTENSIONS = new Set([".mdx", ".md", ".markdown"]);

/**
 * Document types for which PDF generation is explicitly disabled.
 * These are content types that are rendered via the web only.
 */
const FORBIDDEN_PDF_TYPES = new Set(["Book", "Post", "Canon"]);

/**
 * Generator version string — bump this whenever a change in rendering logic
 * should invalidate all existing cached PDFs.
 */
const GENERATOR_VERSION = "V11.0";

/* -------------------------------------------------------------------------- */
/* String / slug utilities                                                     */
/* -------------------------------------------------------------------------- */

function safeString(value: unknown, fallback = ""): string {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : fallback;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return fallback;
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

function uniqueStrings(values: Array<string | undefined | null>): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    const v = safeString(value);
    if (!v || seen.has(v)) continue;
    seen.add(v);
    out.push(v);
  }
  return out;
}

function normalizeRouteLikeSlug(value: string): string {
  return safeString(value)
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/\/+/g, "/")
    .trim();
}

function normalizeFileStem(value: string): string {
  return normalizeRouteLikeSlug(value)
    .replace(/\.(md|mdx|markdown|pdf)$/i, "")
    .replace(/[^\w/-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/\/+/g, "/")
    .replace(/^-+|-+$/g, "");
}

function getLeafStem(value: string): string {
  const normalized = normalizeFileStem(value);
  const leaf = normalized.split("/").pop();
  return safeString(leaf, "document");
}

/* -------------------------------------------------------------------------- */
/* Content utilities                                                           */
/* -------------------------------------------------------------------------- */

/**
 * Strips code blocks, JSX imports, exports, and HTML tags from MDX source so
 * that only plain prose reaches the PDF renderer.
 */
function sanitizeMDXContent(rawContent: string): string {
  if (!rawContent) return "";
  return rawContent
    .replace(/```[\s\S]*?```/g, "")
    .replace(/~~~[\s\S]*?~~~/g, "")
    .replace(/^\s*import\s+.*?\s+from\s+['"].*?['"];?\s*$/gm, "")
    .replace(/^\s*export\s+default\s+.*?;?\s*$/gm, "")
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function extractPlainSummary(text: string, maxLength = 320): string {
  const clean = sanitizeMDXContent(text).replace(/\s+/g, " ").trim();
  return clean.length > maxLength
    ? `${clean.slice(0, maxLength - 1).trim()}\u2026`
    : clean;
}

/* -------------------------------------------------------------------------- */
/* File system utilities                                                       */
/* -------------------------------------------------------------------------- */

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function parseMdxFile(filePath: string): ParsedMdxFile | null {
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    const parsed = matter(raw);
    const relative = path.relative(CONTENT_ROOT, filePath);
    const folder = relative.split(path.sep)[0] || "content";
    return {
      filePath,
      folder,
      content: parsed.content || "",
      frontmatter: (parsed.data || {}) as Record<string, unknown>,
    };
  } catch {
    return null;
  }
}

function walkFilesRecursive(rootDir: string): string[] {
  if (!fs.existsSync(rootDir)) return [];
  const results: string[] = [];
  const stack: string[] = [rootDir];

  while (stack.length > 0) {
    const current = stack.pop()!;
    let entries: fs.Dirent[] = [];
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
      } else if (MDX_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
        results.push(fullPath);
      }
    }
  }
  return results;
}

/* -------------------------------------------------------------------------- */
/* Source type inference & output path resolution                              */
/* -------------------------------------------------------------------------- */

function inferSourceType(params: {
  docType?: string;
  frontmatterType?: unknown;
  folder?: string;
  slug?: string;
}): string {
  const slug = normalizeRouteLikeSlug(safeString(params.slug)).toLowerCase();

  // Slug-based overrides take highest priority
  if (slug.includes("/lexicon/")) return "Lexicon";
  if (slug.includes("/strategy/")) return "Strategy";
  if (slug.includes("/downloads/")) return "Download";
  if (slug.includes("/dispatch/")) return "Dispatch";
  if (slug.includes("/prints/")) return "Print";

  // Contentlayer doc type (exclude generic types that don't map to a PDF type)
  const docType = safeString(params.docType);
  if (docType && !["Post", "Page", "Canon", "Book"].includes(docType)) {
    return docType;
  }

  // Frontmatter explicit type declaration
  const fmType = safeString(params.frontmatterType as string | undefined);
  if (fmType) return fmType;

  // Derive from source folder
  const folderMap: Record<string, string> = {
    briefs: "Brief",
    resources: "Resource",
    lexicon: "Lexicon",
    strategy: "Strategy",
    downloads: "Download",
    dispatch: "Dispatch",
    prints: "Print",
    vault: "Vault",
    intelligence: "Intelligence",
  };
  return folderMap[safeString(params.folder)] ?? "Resource";
}

function canonicalPdfSubfolder(sourceType: string): string {
  const map: Record<string, string> = {
    Brief: "vault/briefs",
    Intelligence: "vault/intelligence",
    Strategy: "strategy",
    Resource: "resources",
    Lexicon: "lexicon",
    Print: "prints",
    Download: "downloads",
    Dispatch: "dispatch",
    Vault: "vault/general",
  };
  return map[safeString(sourceType)] ?? "vault/general";
}

function resolveCanonicalOutputPath(params: {
  sourceType: string;
  slug: string;
  registryOutputPath?: string | null;
}): string {
  const registryPath = safeString(params.registryOutputPath);
  if (registryPath) {
    return `/${registryPath.replace(/\\/g, "/").replace(/^\/+/, "")}`;
  }
  const typeFolder = canonicalPdfSubfolder(params.sourceType);
  const stem = getLeafStem(params.slug);
  return `/${typeFolder}/${stem}.pdf`;
}

/* -------------------------------------------------------------------------- */
/* Candidate key building for document lookup                                  */
/* -------------------------------------------------------------------------- */

function buildCandidateKeys(id: string): string[] {
  const base = safeString(id);
  const noExt = base.replace(/\.(mdx|md|markdown)$/i, "");
  return uniqueStrings([
    base,
    noExt,
    base.toLowerCase(),
    noExt.toLowerCase(),
    slugify(base),
    slugify(noExt),
    normalizeRouteLikeSlug(base),
    normalizeRouteLikeSlug(noExt),
  ]);
}

/* -------------------------------------------------------------------------- */
/* Source resolution                                                           */
/* -------------------------------------------------------------------------- */

/**
 * Resolves a document source by ID, searching (in priority order):
 *   1. Contentlayer generated index (fastest, pre-built)
 *   2. MDX file walk across all SOURCE_FOLDERS
 *   3. contentOverride (caller-supplied raw body, no file needed)
 */
async function resolveSource(
  id: string,
  contentOverride?: string
): Promise<ResolvedSource | null> {
  let doc: ContentlayerDoc | undefined;
  const candidates = buildCandidateKeys(id);

  // ── 1. Contentlayer index ──────────────────────────────────────────────────
  if (fs.existsSync(CONTENTLAYER_INDEX)) {
    try {
      const mod = (await import(
        pathToFileURL(CONTENTLAYER_INDEX).href
      )) as Record<string, unknown>;

      const allDocs = Object.entries(mod)
        .filter(([key, value]) => key.startsWith("all") && Array.isArray(value))
        .flatMap(([, value]) => value as ContentlayerDoc[]);

      doc = allDocs.find((d) => {
        const values = uniqueStrings([
          d.institutionalId,
          d.slug,
          d.slugSafe,
          d._id,
          d.title,
          d.titleSafe,
        ]);
        return values.some(
          (v) =>
            candidates.includes(v) ||
            candidates.includes(slugify(v)) ||
            candidates.includes(normalizeRouteLikeSlug(v))
        );
      });
    } catch {
      // Contentlayer index unavailable — fall through to file walk
    }
  }

  // ── 2. MDX file walk ───────────────────────────────────────────────────────
  let mdx: ParsedMdxFile | null = null;

  const mdxFiles = SOURCE_FOLDERS.flatMap((folder) =>
    walkFilesRecursive(path.join(CONTENT_ROOT, folder))
  );

  for (const filePath of mdxFiles) {
    const parsed = parseMdxFile(filePath);
    if (!parsed) continue;

    const values = uniqueStrings([
      path.parse(filePath).name,
      safeString(parsed.frontmatter.institutionalId as string | undefined),
      safeString(parsed.frontmatter.slug as string | undefined),
      safeString(parsed.frontmatter.title as string | undefined),
    ]);

    const isMatch = values.some(
      (v) =>
        candidates.includes(v) ||
        candidates.includes(slugify(v)) ||
        candidates.includes(normalizeRouteLikeSlug(v))
    );

    if (isMatch) {
      mdx = parsed;
      break;
    }
  }

  // ── 3. Nothing found and no override ──────────────────────────────────────
  if (!doc && !mdx && !contentOverride) {
    return null;
  }

  // ── Assemble resolved source ───────────────────────────────────────────────
  const frontmatter = mdx?.frontmatter ?? {};
  const rawBody =
    safeString(contentOverride) ||
    safeString(doc?.body?.raw) ||
    safeString(doc?.content) ||
    safeString(mdx?.content);

  const slug =
    safeString(doc?.slugSafe) ||
    safeString(doc?.slug) ||
    safeString(frontmatter.slug as string | undefined) ||
    slugify(id);

  const sourceType = inferSourceType({
    docType: doc?.type,
    frontmatterType: frontmatter.type,
    folder: mdx?.folder,
    slug,
  });

  const title =
    safeString(doc?.titleSafe) ||
    safeString(doc?.title) ||
    safeString(frontmatter.title as string | undefined) ||
    id;

  const tier = safeString(
    (doc?.tier ?? frontmatter.tier ?? "public") as string
  ).toLowerCase();

  return {
    id,
    slug,
    title,
    sourceType,
    body: rawBody,
    frontmatter,
    tier,
    sourcePath: mdx?.filePath,
    sourceFolder: mdx?.folder,
    version: safeString(
      (doc?.version ?? frontmatter.version) as string | undefined,
      "1.0"
    ),
    summary: safeString(
      (doc?.summary ?? frontmatter.summary) as string | undefined,
      extractPlainSummary(rawBody)
    ),
    description: safeString(
      (doc?.description ?? frontmatter.description) as string | undefined,
      extractPlainSummary(rawBody)
    ),
  };
}

/* -------------------------------------------------------------------------- */
/* Fingerprint                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Produces a deterministic cache key for a given document render. If the key
 * matches the one stored on disk, the cached PDF is returned without re-render.
 *
 * The key encodes:
 *   • Generator version   — invalidates cache on renderer logic changes
 *   • Document ID         — unique per document
 *   • Access tier         — re-render if tier changes (watermark changes)
 *   • Content hash        — re-render if body content changes
 *
 * Bump GENERATOR_VERSION whenever a change in template logic, font set, or
 * watermark format should force a full cache bust across all documents.
 */
function buildFingerprint(
  id: string,
  tier: string,
  contentHash: string
): string {
  return crypto
    .createHash("sha256")
    .update(`${GENERATOR_VERSION}|${id}|${tier}|${contentHash}`)
    .digest("hex")
    .slice(0, 24);
}

/* -------------------------------------------------------------------------- */
/* Main export — generatePDF                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Generates a PDF for the given document ID and writes it to the public
 * directory. Returns a result object describing success, the output path,
 * the raw buffer, and cache metadata.
 *
 * @param id              - Institutional ID, slug, or file stem of the document.
 * @param force           - If true, bypasses the fingerprint cache and
 *                          regenerates even if the content is unchanged.
 * @param contentOverride - Optional raw MDX body to use instead of resolving
 *                          from the file system. Useful for preview/draft flows.
 */
export async function generatePDF(
  id: string,
  force = false,
  contentOverride?: string
): Promise<PDFGenResult> {
  try {
    /* ── 1. Resolve document source ────────────────────────────────────────── */
    const source = await resolveSource(id, contentOverride);
    if (!source) {
      return {
        success: false,
        error: `[generatePDF] Source not found for id: "${id}". ` +
          `Checked Contentlayer index and MDX file walk across all source folders.`,
      };
    }

    /* ── 2. Guard: forbidden content types ─────────────────────────────────── */
    if (FORBIDDEN_PDF_TYPES.has(source.sourceType)) {
      return {
        success: false,
        error:
          `[generatePDF] PDF generation is disabled for content type ` +
          `"${source.sourceType}" [id: ${id}]. ` +
          `This type is rendered exclusively via the web.`,
      };
    }

    /* ── 3. Registry overrides ──────────────────────────────────────────────── */
    const registry = (getPDFById(id) ?? null) as PDFRegistryConfig | null;
    const effectiveType = safeString(registry?.type, source.sourceType);
    const effectiveTitle = safeString(registry?.title, source.title);
    const effectiveTier = safeString(
      registry?.tier ?? source.tier ?? "public"
    ).toLowerCase();

    /* ── 4. Resolve output paths ────────────────────────────────────────────── */
    const outputPathPublic = resolveCanonicalOutputPath({
      sourceType: effectiveType,
      slug: source.slug,
      registryOutputPath: registry?.outputPath ?? null,
    });
    const outputPathFs = path.join(
      PUBLIC_ROOT,
      outputPathPublic.replace(/^\//, "")
    );
    const fingerprintPath = `${outputPathFs}.fingerprint`;

    /* ── 5. Content hash & cache fingerprint ───────────────────────────────── */
    const cleanBody = sanitizeMDXContent(source.body);
    const contentHash = crypto
      .createHash("sha256")
      .update(cleanBody)
      .digest("hex");
    const fingerprint = buildFingerprint(id, effectiveTier, contentHash);

    /* ── 6. Cache hit check ─────────────────────────────────────────────────── */
    if (!force && fs.existsSync(outputPathFs) && fs.existsSync(fingerprintPath)) {
      const existingFingerprint = fs.readFileSync(fingerprintPath, "utf8").trim();
      if (existingFingerprint === fingerprint) {
        const cachedBuffer = fs.readFileSync(outputPathFs);
        return {
          success: true,
          path: outputPathPublic,
          buffer: cachedBuffer,
          cached: true,
          fingerprint,
          meta: buildMeta({
            id,
            effectiveTitle,
            source,
            outputPathPublic,
            effectiveTier,
            effectiveType,
            contentHash,
          }),
        };
      }
    }

    /* ── 7. QR code ─────────────────────────────────────────────────────────── */
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ?? "https://abrahamoflondon.org";
    const qrCode = await QRCode.toDataURL(
      `${siteUrl}${outputPathPublic}`,
      { margin: 1, errorCorrectionLevel: "H" }
    );

    /* ── 8. Watermark / signature ───────────────────────────────────────────── */
    const signature = generateDossierSignature("SYSTEM", id, {
      brand: "Abraham of London",
      slug: source.slug,
      title: effectiveTitle,
    });
    const watermark = getWatermarkPayload({
      signature,
      classification: effectiveTier.toUpperCase(),
      context: {
        docType: effectiveType.toUpperCase(),
        reference: id,
        version: source.version,
        slug: source.slug,
      },
    });

    /* ── 9. CRITICAL: dynamic import + immediate font registration ──────────
     *
     *  We import @react-pdf/renderer HERE, then pass the live instance into
     *  registerPdfFonts() immediately. This guarantees that Font.register()
     *  writes to the exact same FontStore that renderToBuffer will read from.
     *
     *  DO NOT move the import earlier (module level or top of function).
     *  DO NOT call registerPdfFonts() before this import.
     *  DO NOT use a cached reference across async boundaries.
     *
     *  This pattern is the only approach that is safe across:
     *    • Next.js App Router server components
     *    • tsx / ts-node CLI scripts (vault-master.ts)
     *    • Concurrent async batch rendering
     *    • Vercel serverless & edge functions
     * ─────────────────────────────────────────────────────────────────────── */
    const ReactPDF = await import("@react-pdf/renderer");

    registerPdfFonts(ReactPDF, PROJECT_ROOT);

    // React must come from the same resolution context as @react-pdf/renderer
    // to avoid "Invalid hook call" and renderer version mismatches.
    const React = (await import("react")) as typeof import("react");

    /* ── 10. Template import ─────────────────────────────────────────────────
     *
     *  BriefDocument is imported AFTER font registration so that any
     *  StyleSheet.create() calls within the template resolve font metrics
     *  against an already-populated FontStore.
     * ─────────────────────────────────────────────────────────────────────── */
    const { BriefDocument } = await import(
      "./pdf-templates/BriefDocument"
    );

    /* ── 11. Render ─────────────────────────────────────────────────────────── */
    const pdfBuffer = await ReactPDF.renderToBuffer(
      React.createElement(BriefDocument as React.ComponentType<BriefDocumentProps>, {
        config: {
          ...source,
          title: effectiveTitle,
          tier: effectiveTier,
          type: effectiveType,
          outputPath: outputPathPublic,
          // Pass the canonical font family name so the template never
          // hard-codes it — single source of truth from register-fonts.ts
          pdfFontFamily: CANONICAL_PDF_FONT_FAMILY,
          pdfFontFamilies: PDF_FONT_FAMILIES,
        },
        content: cleanBody,
        watermark,
        qrCode,
        frontmatter: source.frontmatter,
      })
    );

    /* ── 12. Write output ───────────────────────────────────────────────────── */
    ensureDir(path.dirname(outputPathFs));
    fs.writeFileSync(outputPathFs, pdfBuffer);
    fs.writeFileSync(fingerprintPath, fingerprint, "utf8");

    return {
      success: true,
      path: outputPathPublic,
      buffer: pdfBuffer,
      cached: false,
      fingerprint,
      meta: buildMeta({
        id,
        effectiveTitle,
        source,
        outputPathPublic,
        effectiveTier,
        effectiveType,
        contentHash,
      }),
    };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : String(error);
    console.error(`\u274C PDF generation failed for ${id}:`, message);
    return {
      success: false,
      error: message,
    };
  }
}

/* -------------------------------------------------------------------------- */
/* Internal helpers                                                            */
/* -------------------------------------------------------------------------- */

/** Centralised meta object builder — avoids repetition in cache and live paths. */
function buildMeta(params: {
  id: string;
  effectiveTitle: string;
  source: ResolvedSource;
  outputPathPublic: string;
  effectiveTier: string;
  effectiveType: string;
  contentHash: string;
}): PDFGenMeta {
  return {
    id: params.id,
    title: params.effectiveTitle,
    slug: params.source.slug,
    outputPath: params.outputPathPublic,
    sourcePath: params.source.sourcePath,
    sourceFolder: params.source.sourceFolder,
    detectedTier: params.effectiveTier,
    sourceType: params.effectiveType,
    contentHash: params.contentHash,
  };
}

/* -------------------------------------------------------------------------- */
/* BriefDocument prop type shim                                                */
/*                                                                             */
/* Avoids importing BriefDocument at module level (which would pull in        */
/* @react-pdf/renderer before the dynamic import + font registration).        */
/* Extend this interface if the template's props evolve.                      */
/* -------------------------------------------------------------------------- */

interface BriefDocumentProps {
  config: {
    id: string;
    slug: string;
    title: string;
    tier: string;
    type: string;
    outputPath: string;
    version: string;
    summary: string;
    description: string;
    body: string;
    frontmatter: Record<string, unknown>;
    sourcePath?: string;
    sourceFolder?: string;
    sourceType: string;
    pdfFontFamily: string;
    pdfFontFamilies: typeof PDF_FONT_FAMILIES;
  };
  content: string;
  watermark: unknown;
  qrCode: string;
  frontmatter: Record<string, unknown>;
}