/* lib/pdf-generator.ts — V10.2 (CANONICAL PATHING + BUFFER RETURN + SLUG-AWARE TYPE INFERENCE) */
import "server-only";

import fs from "fs";
import path from "path";
import crypto from "crypto";
import matter from "gray-matter";
import QRCode from "qrcode";
import { pathToFileURL } from "url";

import { getPDFById } from "./pdf/registry";
import { registerPDFFonts } from "./pdf/font-registry";
import {
  generateDossierSignature,
  getWatermarkPayload,
} from "./intelligence/watermark-delegate";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export interface PDFGenResult {
  success: boolean;
  path?: string;
  buffer?: Buffer;
  error?: string;
  cached?: boolean;
  fingerprint?: string;
  meta?: {
    id: string;
    title: string;
    slug: string;
    outputPath: string;
    sourcePath?: string;
    sourceFolder?: string;
    detectedTier?: string;
    sourceType?: string;
    contentHash?: string;
  };
}

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
];

const MDX_EXTENSIONS = [".mdx", ".md", ".markdown"];

const FORBIDDEN_PDF_TYPES = new Set(["Book", "Post", "Canon"]);

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
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

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

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
    ? `${clean.slice(0, maxLength - 1).trim()}…`
    : clean;
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

function inferSourceType(params: {
  docType?: string;
  frontmatterType?: unknown;
  folder?: string;
  slug?: string;
}): string {
  const slug = normalizeRouteLikeSlug(safeString(params.slug)).toLowerCase();

  if (
    slug.startsWith("lexicon/") ||
    slug.startsWith("vault/lexicon/") ||
    slug.includes("/lexicon/")
  ) {
    return "Lexicon";
  }

  if (slug.startsWith("strategy/") || slug.includes("/strategy/")) {
    return "Strategy";
  }

  if (slug.startsWith("downloads/") || slug.includes("/downloads/")) {
    return "Download";
  }

  if (slug.startsWith("dispatch/") || slug.includes("/dispatch/")) {
    return "Dispatch";
  }

  if (slug.startsWith("prints/") || slug.includes("/prints/")) {
    return "Print";
  }

  const docType = safeString(params.docType);
  if (docType && !["Post", "Page", "Canon", "Book"].includes(docType)) {
    return docType;
  }

  const fmType = safeString(params.frontmatterType);
  if (fmType) {
    return fmType;
  }

  switch (safeString(params.folder)) {
    case "briefs":
      return "Brief";
    case "resources":
      return "Resource";
    case "lexicon":
      return "Lexicon";
    case "strategy":
      return "Strategy";
    case "downloads":
      return "Download";
    case "dispatch":
      return "Dispatch";
    case "prints":
      return "Print";
    case "vault":
      return "Vault";
    case "intelligence":
      return "Intelligence";
    default:
      return "Resource";
  }
}

function canonicalPdfSubfolder(sourceType: string): string {
  switch (safeString(sourceType)) {
    case "Brief":
    case "VaultBrief":
      return "vault/briefs";
    case "Intelligence":
      return "vault/intelligence";
    case "Strategy":
      return "strategy";
    case "Resource":
      return "resources";
    case "Lexicon":
      return "lexicon";
    case "Print":
      return "prints";
    case "Download":
      return "downloads";
    case "Dispatch":
      return "dispatch";
    case "Vault":
      return "vault/general";
    default:
      return "vault/general";
  }
}

function registryPathLooksCanonical(
  registryOutputPath: string,
  sourceType: string
): boolean {
  const clean = registryOutputPath.replace(/\\/g, "/").replace(/^\/+/, "");
  if (!clean.toLowerCase().endsWith(".pdf")) return false;

  const canonicalFolder = canonicalPdfSubfolder(sourceType);
  return clean === `assets/downloads/${getLeafStem(clean)}.pdf` ||
    clean.startsWith(`${canonicalFolder}/`);
}

function resolveCanonicalOutputPath(params: {
  sourceType: string;
  slug: string;
  registryOutputPath?: string | null;
}): string {
  const typeFolder = canonicalPdfSubfolder(params.sourceType);
  const stem = getLeafStem(params.slug);

  const registryPath = safeString(params.registryOutputPath);
  if (registryPath && registryPathLooksCanonical(registryPath, params.sourceType)) {
    return `/${registryPath.replace(/\\/g, "/").replace(/^\/+/, "")}`;
  }

  return `/${typeFolder}/${stem}.pdf`;
}

/* -------------------------------------------------------------------------- */
/* File Walking                                                               */
/* -------------------------------------------------------------------------- */

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
      } else if (MDX_EXTENSIONS.includes(path.extname(entry.name).toLowerCase())) {
        results.push(fullPath);
      }
    }
  }

  return results;
}

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
/* Source Resolution                                                          */
/* -------------------------------------------------------------------------- */

async function resolveSource(
  id: string,
  contentOverride?: string
): Promise<ResolvedSource | null> {
  let doc: ContentlayerDoc | undefined;
  const candidates = buildCandidateKeys(id);

  if (fs.existsSync(CONTENTLAYER_INDEX)) {
    try {
      const mod = (await import(pathToFileURL(CONTENTLAYER_INDEX).href)) as Record<
        string,
        unknown
      >;

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
      // ignore and continue to MDX fallback
    }
  }

  const mdxFiles = SOURCE_FOLDERS.flatMap((folder) =>
    walkFilesRecursive(path.join(CONTENT_ROOT, folder))
  );

  let mdx: ParsedMdxFile | null = null;

  for (const filePath of mdxFiles) {
    const parsed = parseMdxFile(filePath);
    if (!parsed) continue;

    const values = uniqueStrings([
      path.parse(filePath).name,
      safeString(parsed.frontmatter.institutionalId),
      safeString(parsed.frontmatter.slug),
      safeString(parsed.frontmatter.title),
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

  if (!doc && !mdx && !contentOverride) {
    return null;
  }

  const frontmatter = mdx?.frontmatter || {};
  const rawBody =
    safeString(contentOverride) ||
    safeString(doc?.body?.raw) ||
    safeString(doc?.content) ||
    safeString(mdx?.content);

  const slug =
    safeString(doc?.slugSafe) ||
    safeString(doc?.slug) ||
    safeString(frontmatter.slug) ||
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
    safeString(frontmatter.title) ||
    id;

  const tier = safeString(doc?.tier || frontmatter.tier || "public").toLowerCase();

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
    version: safeString(doc?.version || frontmatter.version, "1.0"),
    summary: safeString(
      doc?.summary || frontmatter.summary || extractPlainSummary(rawBody)
    ),
    description: safeString(
      doc?.description || frontmatter.description || extractPlainSummary(rawBody)
    ),
  };
}

/* -------------------------------------------------------------------------- */
/* Main Generator                                                             */
/* -------------------------------------------------------------------------- */

export async function generatePDF(
  id: string,
  force = false,
  contentOverride?: string
): Promise<PDFGenResult> {
  try {
    const source = await resolveSource(id, contentOverride);
    if (!source) {
      return { success: false, error: `Source not found: ${id}` };
    }

    if (FORBIDDEN_PDF_TYPES.has(source.sourceType)) {
      return {
        success: false,
        error: `PDF generation disabled for type: ${source.sourceType} [${id}]`,
      };
    }

    const registry = (getPDFById(id) || null) as PDFRegistryConfig | null;
    const effectiveType = safeString(registry?.type, source.sourceType);
    const effectiveTitle = safeString(registry?.title, source.title);
    const effectiveTier = safeString(registry?.tier, source.tier || "public").toLowerCase();

    const outputPathPublic = resolveCanonicalOutputPath({
      sourceType: effectiveType,
      slug: source.slug,
      registryOutputPath: registry?.outputPath ?? null,
    });

    const outputPathFs = path.join(
      PUBLIC_ROOT,
      outputPathPublic.replace(/^\//, "")
    );

    const cleanBody = sanitizeMDXContent(source.body);
    const contentHash = crypto
      .createHash("sha256")
      .update(cleanBody)
      .digest("hex");

    const fingerprint = crypto
      .createHash("sha256")
      .update(`V10.2|${id}|${effectiveTier}|${contentHash}`)
      .digest("hex")
      .slice(0, 24);

    const fingerprintPath = `${outputPathFs}.fingerprint`;

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
          meta: {
            id,
            title: effectiveTitle,
            slug: source.slug,
            outputPath: outputPathPublic,
            sourcePath: source.sourcePath,
            sourceFolder: source.sourceFolder,
            detectedTier: effectiveTier,
            sourceType: effectiveType,
            contentHash,
          },
        };
      }
    }

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL || "https://abrahamoflondon.org";

    const qrCode = await QRCode.toDataURL(`${siteUrl}${outputPathPublic}`, {
      margin: 1,
      errorCorrectionLevel: "H",
    });

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

    const React = await import("react");
    const ReactPDF = await import("@react-pdf/renderer");
    await registerPDFFonts(ReactPDF.Font as never);

    const { BriefDocument } = await import("./pdf-templates/BriefDocument");

    const pdfBuffer = await ReactPDF.renderToBuffer(
      React.createElement(BriefDocument as any, {
        config: {
          ...source,
          title: effectiveTitle,
          tier: effectiveTier,
          type: effectiveType,
          outputPath: outputPathPublic,
        },
        content: cleanBody,
        watermark,
        qrCode,
        frontmatter: source.frontmatter,
      })
    );

    ensureDir(path.dirname(outputPathFs));
    fs.writeFileSync(outputPathFs, pdfBuffer);
    fs.writeFileSync(fingerprintPath, fingerprint, "utf8");

    return {
      success: true,
      path: outputPathPublic,
      buffer: pdfBuffer,
      cached: false,
      fingerprint,
      meta: {
        id,
        title: effectiveTitle,
        slug: source.slug,
        outputPath: outputPathPublic,
        sourcePath: source.sourcePath,
        sourceFolder: source.sourceFolder,
        detectedTier: effectiveTier,
        sourceType: effectiveType,
        contentHash,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}