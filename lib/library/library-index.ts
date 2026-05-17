/**
 * lib/library/library-index.ts — LIBRARY INDEX AGGREGATION LAYER
 *
 * Single server-side aggregation layer that produces a unified library index
 * from all content sources: Contentlayer documents, PDF registry, premium
 * content registry, and additional content directories.
 *
 * Safe for use in getStaticProps / getServerSideProps only.
 * Do NOT import into client components directly.
 *
 * Uses the content/server facade (which is already pages-router-safe)
 * for Contentlayer data access.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  getAllBooks,
  getAllCanons,
  getAllDownloads,
  getAllPlaybooks,
  getAllPosts,
  getAllResources,
  getAllShorts,
  getAllBriefs,
  getAllIntelligence,
  getAllLexicon,
  getAllVault,
  getAllStrategies,
  getAllEvents,
  getAllPrints,
} from "@/lib/content/server";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type LibraryItemType =
  | "essay"
  | "short"
  | "book"
  | "canon"
  | "lexicon"
  | "framework"
  | "playbook"
  | "strategy"
  | "toolkit"
  | "intelligence"
  | "brief"
  | "evidence"
  | "download"
  | "pdf"
  | "print"
  | "resource"
  | "vault"
  | "event"
  | "premium";

export type LibrarySection =
  | "essays_analysis"
  | "books_manuscripts"
  | "canon_lexicon"
  | "frameworks_playbooks"
  | "intelligence_briefs"
  | "downloads_resources"
  | "vault"
  | "events";

export type LibraryItemFormat =
  | "article"
  | "pdf"
  | "epub"
  | "worksheet"
  | "book"
  | "brief"
  | "toolkit"
  | "event"
  | "resource";

export type LibraryItemAccess = "public" | "member" | "restricted" | "paid" | "unknown";

export type LibraryItemStatus = "draft" | "published" | "archived" | "unknown";

export interface LibraryIndexItem {
  id: string;
  title: string;
  summary: string | null;
  description: string | null;
  type: LibraryItemType;
  section: LibrarySection;
  href: string;
  access: LibraryItemAccess;
  format: LibraryItemFormat | null;
  status: LibraryItemStatus;
  date: string | null;
  tags: string[];
  category: string | null;
  featured: boolean;
  sourceType: string;
  sourcePath: string | null;
}

export interface LibrarySectionInfo {
  id: LibrarySection;
  title: string;
  description: string;
  count: number;
  items: LibraryIndexItem[];
  href: string;
  icon: string;
}

export interface LibraryIndex {
  items: LibraryIndexItem[];
  sections: LibrarySectionInfo[];
  stats: {
    total: number;
    public: number;
    member: number;
    restricted: number;
    paid: number;
    downloads: number;
    canonLexicon: number;
  };
  generatedAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Section definitions
// ─────────────────────────────────────────────────────────────────────────────

const SECTION_DEFS: Record<LibrarySection, { title: string; description: string; href: string; icon: string }> = {
  essays_analysis: {
    title: "Essays & Analysis",
    description: "Long-form thought, cultural and strategic commentary, and short-form field notes and insights.",
    href: "/library/essays",
    icon: "📖",
  },
  books_manuscripts: {
    title: "Books & Manuscripts",
    description: "Published volumes, long-form works, and editorial editions.",
    href: "/library/books",
    icon: "📚",
  },
  canon_lexicon: {
    title: "Canon & Lexicon",
    description: "Governing doctrine, worldview principles, decision language, and category definitions.",
    href: "/library/canon",
    icon: "🏛️",
  },
  frameworks_playbooks: {
    title: "Frameworks & Playbooks",
    description: "Execution-grade methodologies, strategic instruments, tactical frameworks, and practical toolkits.",
    href: "/library/frameworks",
    icon: "⚙️",
  },
  intelligence_briefs: {
    title: "Intelligence & Briefs",
    description: "Market intelligence, strategic briefs, evidence dossiers, and case materials.",
    href: "/library/intelligence",
    icon: "📊",
  },
  downloads_resources: {
    title: "Downloads & Resources",
    description: "PDFs, worksheets, printable materials, generated assets, and resource pages.",
    href: "/library/downloads",
    icon: "📄",
  },
  vault: {
    title: "Vault",
    description: "Controlled archive, restricted briefs, and member-access materials.",
    href: "/library/vault",
    icon: "🔒",
  },
  events: {
    title: "Events",
    description: "Past and upcoming events, briefings, and engagements.",
    href: "/library/events",
    icon: "📅",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Type-to-section mapping
// ─────────────────────────────────────────────────────────────────────────────

const TYPE_TO_SECTION: Record<LibraryItemType, LibrarySection> = {
  essay: "essays_analysis",
  short: "essays_analysis",
  book: "books_manuscripts",
  canon: "canon_lexicon",
  lexicon: "canon_lexicon",
  framework: "frameworks_playbooks",
  playbook: "frameworks_playbooks",
  strategy: "frameworks_playbooks",
  toolkit: "frameworks_playbooks",
  intelligence: "intelligence_briefs",
  brief: "intelligence_briefs",
  evidence: "intelligence_briefs",
  download: "downloads_resources",
  pdf: "downloads_resources",
  print: "downloads_resources",
  resource: "downloads_resources",
  vault: "vault",
  event: "events",
  premium: "intelligence_briefs",
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function safeStr(v: unknown, fallback?: string | null): string {
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return fallback ?? "";
}

function safeArr(v: unknown): string[] {
  return Array.isArray(v) ? v.map((x) => safeStr(x)).filter(Boolean) : [];
}

function safeISO(v: unknown): string | null {
  const s = safeStr(v);
  if (!s) return null;
  const t = Date.parse(s);
  return Number.isFinite(t) ? new Date(t).toISOString() : null;
}

function normalizeAccess(raw: unknown): LibraryItemAccess {
  const s = safeStr(raw).trim().toLowerCase();
  if (!s || s === "public" || s === "open" || s === "free" || s === "unclassified") return "public";
  if (s === "member" || s === "members" || s === "registered" || s === "inner-circle" || s === "inner_circle") return "member";
  if (s === "paid" || s === "premium") return "paid";
  if (s === "restricted" || s === "private" || s === "confidential" || s === "secret" || s === "top-secret" || s === "top_secret" || s === "hardened" || s === "sovereign" || s === "client" || s === "architect" || s === "owner" || s === "legacy" || s === "enterprise") return "restricted";
  return "unknown";
}

function normalizeStatus(raw: unknown): LibraryItemStatus {
  const s = safeStr(raw).trim().toLowerCase();
  if (s === "draft") return "draft";
  if (s === "archived") return "archived";
  if (s === "published" || s === "publish") return "published";
  if (raw === true) return "published";
  if (raw === false) return "draft";
  return "published";
}

function inferFormat(type: LibraryItemType): LibraryItemFormat | null {
  const map: Partial<Record<LibraryItemType, LibraryItemFormat>> = {
    book: "book",
    essay: "article",
    short: "article",
    brief: "brief",
    intelligence: "brief",
    event: "event",
    resource: "resource",
    toolkit: "toolkit",
    pdf: "pdf",
    download: "pdf",
    print: "pdf",
    playbook: "worksheet",
    framework: "worksheet",
    strategy: "worksheet",
    canon: "article",
    lexicon: "article",
    vault: "pdf",
    premium: "pdf",
  };
  return map[type] || null;
}

function inferSection(type: LibraryItemType): LibrarySection {
  return TYPE_TO_SECTION[type] || "downloads_resources";
}

function cleanSlug(input: string): string {
  return safeStr(input)
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\/+|\/+$/g, "")
    .replace(/\.(md|mdx)$/i, "")
    .replace(/\/{2,}/g, "/")
    .toLowerCase();
}

// ─────────────────────────────────────────────────────────────────────────────
// Build from raw doc
// ─────────────────────────────────────────────────────────────────────────────

function inferTypeFromPath(rawPath: string): LibraryItemType {
  if (rawPath.startsWith("blog/") || rawPath.startsWith("posts/")) return "essay";
  if (rawPath.startsWith("shorts/")) return "short";
  if (rawPath.startsWith("books/")) return "book";
  if (rawPath.startsWith("canon/")) return "canon";
  if (rawPath.startsWith("lexicon/")) return "lexicon";
  if (rawPath.startsWith("playbooks/")) return "playbook";
  if (rawPath.startsWith("strategy/") || rawPath.startsWith("strategies/")) return "strategy";
  if (rawPath.startsWith("intelligence/")) return "intelligence";
  if (rawPath.startsWith("briefs/")) return "brief";
  if (rawPath.startsWith("evidence/")) return "evidence";
  if (rawPath.startsWith("downloads/")) return "download";
  if (rawPath.startsWith("prints/")) return "print";
  if (rawPath.startsWith("resources/")) {
    if (rawPath.includes("strategic-frameworks")) return "framework";
    if (rawPath.includes("toolkit")) return "toolkit";
    return "resource";
  }
  if (rawPath.startsWith("toolkits/")) return "toolkit";
  if (rawPath.startsWith("vault/")) return "vault";
  if (rawPath.startsWith("events/")) return "event";
  return "resource";
}

function buildFromContentlayerDoc(doc: any): LibraryIndexItem | null {
  if (!doc) return null;

  const rawPath = cleanSlug(
    safeStr(doc._raw?.flattenedPath) || safeStr(doc._raw?.sourceFilePath) || "",
  );
  if (!rawPath) return null;

  const urlSlug = cleanSlug(safeStr(doc.urlSlug) || safeStr(doc.slug) || safeStr(doc.slugComputed) || "");
  const href = safeStr(doc.href) || (urlSlug ? `/${rawPath}` : "");

  const type = inferTypeFromPath(rawPath);
  const title = safeStr(doc.title, urlSlug || "Untitled");
  const summary = safeStr(doc.excerpt || doc.description || doc.summary || "", null) || null;
  const description = safeStr(doc.description || doc.excerpt || doc.summary || "", null) || null;
  const date = safeISO(doc.date || doc.eventDate || doc.startDate || doc.datetime || doc.startsAt || doc.updated || doc.lastUpdated);
  const tags = safeArr(doc.tags);
  const category = safeStr(doc.category || doc.theme || "", null) || null;
  const featured = Boolean(doc.featured === true);

  const accessRaw = doc.accessTierSafe || doc.accessTier || doc.accessLevel || doc.tier || doc.classification || "public";
  const access = normalizeAccess(accessRaw);

  const statusRaw = doc.publishedSafe !== undefined ? doc.publishedSafe : doc.published;
  const status = normalizeStatus(statusRaw);

  return {
    id: safeStr(doc._id) || urlSlug || rawPath,
    title,
    summary,
    description,
    type,
    section: inferSection(type),
    href: href || `/${rawPath}`,
    access,
    format: inferFormat(type),
    status,
    date,
    tags,
    category,
    featured,
    sourceType: "contentlayer",
    sourcePath: rawPath || null,
  };
}

function buildFromPDFRegistryEntry(entry: any): LibraryIndexItem | null {
  if (!entry) return null;
  const id = safeStr(entry.id);
  if (!id) return null;

  const title = safeStr(entry.title, id);
  const summary = safeStr(entry.excerpt || entry.description || "", null) || null;
  const description = safeStr(entry.description || entry.excerpt || "", null) || null;
  const tags = safeArr(entry.tags);
  const category = safeStr(entry.category || entry.categorySlug || "", null) || null;
  const outputPath = safeStr(entry.outputPath);
  const href = outputPath || `/assets/downloads/${id}.pdf`;
  const tier = safeStr(entry.tier || (entry.requiresAuth === true ? "member" : "public"));
  const access = normalizeAccess(tier);
  const date = safeISO(entry.lastModified || entry.createdAt || entry.updatedAt);

  const pdfType = safeStr(entry.type || "").toLowerCase();
  let type: LibraryItemType = "pdf";
  if (pdfType === "tool" || pdfType === "worksheet" || pdfType === "canvas" || pdfType === "assessment") type = "pdf";
  else if (pdfType === "framework") type = "framework";
  else if (pdfType === "playbook") type = "playbook";
  else if (pdfType === "brief") type = "brief";
  else if (pdfType === "editorial") type = "premium";
  else if (pdfType === "toolkit") type = "toolkit";

  return {
    id: `pdf-${id}`,
    title,
    summary,
    description,
    type,
    section: inferSection(type),
    href,
    access,
    format: "pdf",
    status: "published",
    date,
    tags,
    category,
    featured: false,
    sourceType: "pdf-registry",
    sourcePath: outputPath || null,
  };
}

function buildFromPremiumContent(item: any): LibraryIndexItem | null {
  if (!item) return null;
  const id = safeStr(item.id);
  if (!id) return null;

  const title = safeStr(item.title, id);
  const summary = safeStr(item.description || "", null) || null;
  const tags = safeArr(item.tags);
  const category = safeStr(item.category || item.categorySlug || "", null) || null;
  const featured = Boolean(item.featured === true);
  const confidential = safeStr(item.confidentialLevel || "").toLowerCase();
  const access: LibraryItemAccess = confidential === "high" || confidential === "medium" ? "restricted" : "public";
  const date = safeISO(item.metadata?.createdAt);
  const surfaceHref = safeStr(item.metadata?.surfaceHref || "");
  const directHref = safeStr(item.metadata?.directDownloadHref || "");
  const href = surfaceHref || directHref || `/artifacts/${id}`;

  return {
    id: `premium-${id}`,
    title,
    summary,
    description: null,
    type: "premium",
    section: inferSection("premium"),
    href,
    access,
    format: "pdf",
    status: "published",
    date,
    tags,
    category,
    featured,
    sourceType: "premium-registry",
    sourcePath: safeStr(item.asset?.relativePath) || null,
  };
}

type MetadataRecord = {
  relativePath: string;
  data: Record<string, unknown>;
};

const PUBLIC_EVIDENCE_SLUGS = new Set([
  "tariff-shock-growth-break",
  "team-alignment-illusion",
  "escalation-denied-case",
]);

function loadMetadataRecords(relativeDir: string): MetadataRecord[] {
  try {
    // eslint-disable-next-line no-eval
    const req = eval("require") as NodeRequire;
    const fs = req("fs") as typeof import("fs");
    const path = req("path") as typeof import("path");
    const matter = req("gray-matter") as typeof import("gray-matter");
    const root = path.join(process.cwd(), relativeDir);
    if (!fs.existsSync(root)) return [];

    const out: MetadataRecord[] = [];
    const walk = (dir: string) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const absolute = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walk(absolute);
          continue;
        }
        if (!/\.(md|mdx)$/i.test(entry.name)) continue;
        const raw = fs.readFileSync(absolute, "utf8");
        const parsed = matter(raw);
        out.push({
          relativePath: path.relative(process.cwd(), absolute).replace(/\\/g, "/"),
          data: (parsed.data || {}) as Record<string, unknown>,
        });
      }
    };

    walk(root);
    return out;
  } catch (error) {
    console.warn(`[LIBRARY_INDEX] Metadata loader unavailable for ${relativeDir}:`, error);
    return [];
  }
}

function buildFromToolkitMetadata(record: MetadataRecord): LibraryIndexItem | null {
  const sourcePath = cleanSlug(record.relativePath);
  const metadataSlug = cleanSlug(
    safeStr(record.data.slug) ||
      sourcePath.replace(/^content\/toolkits\//, ""),
  );
  if (!metadataSlug) return null;

  let href = "/toolkits";
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { TOOLKITS } = require("@/lib/toolkits/registry");
    const registry = Array.isArray(TOOLKITS) ? TOOLKITS : [];
    const titleMatch = registry.find((toolkit: any) => safeStr(toolkit.title) === safeStr(record.data.title));
    const directMatch = registry.find((toolkit: any) => safeStr(toolkit.slug) === metadataSlug);
    const parentMatch = registry.find(
      (toolkit: any) => safeStr(toolkit.slug) === metadataSlug.split("/")[0],
    );
    const safeSlug = safeStr(titleMatch?.slug || directMatch?.slug || parentMatch?.slug);
    if (safeSlug) href = `/toolkits/${safeSlug}`;
  } catch {
    href = "/toolkits";
  }

  return {
    id: `toolkit-${sourcePath}`,
    title: safeStr(record.data.title, metadataSlug),
    summary: safeStr(record.data.description, null) || null,
    description: safeStr(record.data.description, null) || null,
    type: "toolkit",
    section: inferSection("toolkit"),
    href,
    access: normalizeAccess(record.data.tier || "restricted"),
    format: "toolkit",
    status: normalizeStatus(record.data.status),
    date: safeISO(record.data.date),
    tags: safeArr(record.data.tags),
    category: safeStr(record.data.category || "Toolkit", null) || null,
    featured: Boolean(record.data.featured === true),
    sourceType: "toolkit-metadata",
    sourcePath,
  };
}

function buildFromEvidenceMetadata(record: MetadataRecord): LibraryIndexItem | null {
  const sourcePath = cleanSlug(record.relativePath);
  const slug = sourcePath
    .replace(/^content\/evidence\//, "")
    .replace(/\.(md|mdx)$/i, "");
  if (!slug) return null;

  const isPublicRoute = PUBLIC_EVIDENCE_SLUGS.has(slug);
  return {
    id: `evidence-${slug}`,
    title: safeStr(record.data.title, slug),
    summary: safeStr(record.data.description, null) || null,
    description: safeStr(record.data.description, null) || null,
    type: "evidence",
    section: inferSection("evidence"),
    href: isPublicRoute ? `/evidence/${slug}` : "/evidence",
    access: isPublicRoute ? "public" : "restricted",
    format: "resource",
    status: normalizeStatus(record.data.status),
    date: safeISO(record.data.date),
    tags: safeArr(record.data.tags),
    category: safeStr(record.data.category || "Evidence", null) || null,
    featured: false,
    sourceType: "evidence-metadata",
    sourcePath,
  };
}

function buildFromVaultIndexMetadata(record: MetadataRecord): LibraryIndexItem | null {
  const sourcePath = cleanSlug(record.relativePath);
  const slug = sourcePath
    .replace(/^content\/vault\/indices\//, "")
    .replace(/\.(md|mdx)$/i, "");
  if (!slug) return null;

  return {
    id: `vault-index-${slug}`,
    title: safeStr(record.data.title, slug),
    summary: safeStr(record.data.description, null) || null,
    description: safeStr(record.data.description, null) || null,
    type: "vault",
    section: inferSection("vault"),
    href: "/vault",
    access: "restricted",
    format: "article",
    status: normalizeStatus(record.data.status),
    date: safeISO(record.data.date),
    tags: safeArr(record.data.tags),
    category: safeStr(record.data.category || "Vault Index", null) || null,
    featured: false,
    sourceType: "vault-index-metadata",
    sourcePath,
  };
}

function buildFromEpubManifestEntry(entry: any): LibraryIndexItem | null {
  const slug = cleanSlug(safeStr(entry?.slug));
  if (!slug) return null;

  const isFlagshipBook = slug === "ultimate-purpose-of-man-editorial";
  return {
    id: `epub-${slug}`,
    title: safeStr(entry?.title, slug),
    summary: null,
    description: null,
    type: isFlagshipBook ? "book" : "download",
    section: isFlagshipBook ? "books_manuscripts" : "downloads_resources",
    href: safeStr(entry?.publicHref) || `/epubs/${slug}.epub`,
    access: "public",
    format: "epub",
    status: "published",
    date: safeISO(entry?.generatedAt),
    tags: ["epub"],
    category: isFlagshipBook ? "Book" : "EPUB",
    featured: false,
    sourceType: "epub-manifest",
    sourcePath: safeStr(entry?.publicHref, null) || null,
  };
}

function loadEpubManifestItems(): LibraryIndexItem[] {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const manifest = require("../../public/epubs/epub-manifest.json");
    const entries = Array.isArray(manifest?.items) ? manifest.items : [];
    return entries
      .map((entry: any) => buildFromEpubManifestEntry(entry))
      .filter((item: LibraryIndexItem | null): item is LibraryIndexItem => Boolean(item));
  } catch (error) {
    console.warn("[LIBRARY_INDEX] EPUB manifest unavailable:", error);
    return [];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Main aggregation function
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build the complete library index from all content sources.
 * Must be called server-side only (getStaticProps / getServerSideProps).
 *
 * Uses the content/server facade for Contentlayer data access.
 * Also loads PDF registry and premium content via dynamic import
 * to keep client bundles clean.
 */
export function buildLibraryIndex(): LibraryIndex {
  const items: LibraryIndexItem[] = [];
  const seen = new Set<string>();

  function add(item: LibraryIndexItem | null) {
    if (!item) return;
    const key = `${item.sourceType}:${item.id}`;
    if (seen.has(key)) return;
    seen.add(key);
    items.push(item);
  }

  // ── 1. Contentlayer documents (via content/server facade) ──
  try {
    const allDocs: any[] = [
      ...getAllPosts(),
      ...getAllShorts(),
      ...getAllBooks(),
      ...getAllCanons(),
      ...getAllLexicon(),
      ...getAllPlaybooks(),
      ...getAllStrategies(),
      ...getAllIntelligence(),
      ...getAllBriefs(),
      ...getAllDownloads(),
      ...getAllPrints(),
      ...getAllResources(),
      ...getAllVault(),
      ...getAllEvents(),
    ];
    for (const doc of allDocs) {
      add(buildFromContentlayerDoc(doc));
    }
  } catch (e) {
    console.warn("[LIBRARY_INDEX] Contentlayer docs unavailable:", e);
  }

  // ── 2. PDF registry (dynamic import — may not be available in all contexts) ──
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { getAllPDFs } = require("@/lib/pdf/registry.static");
    const pdfs: any[] = getAllPDFs() || [];
    for (const pdf of pdfs) {
      add(buildFromPDFRegistryEntry(pdf));
    }
  } catch (e) {
    console.warn("[LIBRARY_INDEX] PDF registry unavailable:", e);
  }

  // ── 3. Premium content registry (dynamic import) ──
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { getPremiumContentList } = require("@/lib/premium/content-registry");
    const premiumItems: any[] = getPremiumContentList() || [];
    for (const item of premiumItems) {
      add(buildFromPremiumContent(item));
    }
  } catch (e) {
    console.warn("[LIBRARY_INDEX] Premium content unavailable:", e);
  }

  // ── 4. Metadata-only discovery sources ──
  for (const record of loadMetadataRecords("content/toolkits")) {
    add(buildFromToolkitMetadata(record));
  }
  for (const record of loadMetadataRecords("content/evidence")) {
    add(buildFromEvidenceMetadata(record));
  }
  for (const record of loadMetadataRecords("content/vault/indices")) {
    add(buildFromVaultIndexMetadata(record));
  }
  for (const item of loadEpubManifestItems()) {
    add(item);
  }

  // ── 5. Build sections ──
  const sections: LibrarySectionInfo[] = (Object.keys(SECTION_DEFS) as LibrarySection[]).map((secId) => {
    const def = SECTION_DEFS[secId];
    const sectionItems = items.filter((i) => i.section === secId && i.status === "published");
    return {
      id: secId,
      title: def.title,
      description: def.description,
      count: sectionItems.length,
      items: sectionItems,
      href: def.href,
      icon: def.icon,
    };
  });

  // ── 6. Compute stats ──
  const published = items.filter((i) => i.status === "published");
  const stats = {
    total: published.length,
    public: published.filter((i) => i.access === "public").length,
    member: published.filter((i) => i.access === "member").length,
    restricted: published.filter((i) => i.access === "restricted" || i.access === "paid").length,
    paid: published.filter((i) => i.access === "paid").length,
    downloads: published.filter((i) => i.section === "downloads_resources").length,
    canonLexicon: published.filter((i) => i.section === "canon_lexicon").length,
  };

  return {
    items: published,
    sections,
    stats,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Get a preview of items for a section (for the master index page).
 */
export function getSectionPreview(section: LibrarySectionInfo, limit = 10): LibraryIndexItem[] {
  return section.items.slice(0, limit);
}

/**
 * Search the library index.
 */
export function searchLibraryIndex(
  index: LibraryIndex,
  query: string,
  filters?: {
    section?: LibrarySection;
    type?: LibraryItemType;
    access?: LibraryItemAccess;
    format?: LibraryItemFormat;
    tag?: string;
  },
): LibraryIndexItem[] {
  const q = query.trim().toLowerCase();
  let results = index.items;

  if (q) {
    results = results.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        (item.summary && item.summary.toLowerCase().includes(q)) ||
        (item.description && item.description.toLowerCase().includes(q)) ||
        item.tags.some((t) => t.toLowerCase().includes(q)) ||
        item.type.toLowerCase().includes(q) ||
        (item.category && item.category.toLowerCase().includes(q)),
    );
  }

  if (filters?.section) results = results.filter((i) => i.section === filters.section);
  if (filters?.type) results = results.filter((i) => i.type === filters.type);
  if (filters?.access) results = results.filter((i) => i.access === filters.access);
  if (filters?.format) results = results.filter((i) => i.format === filters.format);
  if (filters?.tag) {
    const tag = filters.tag.toLowerCase();
    results = results.filter((i) => i.tags.some((t) => t.toLowerCase() === tag));
  }

  return results;
}
