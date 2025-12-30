import path from "path";
import { defineDocumentType, makeSource } from "contentlayer2/source-files";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";

/* -------------------------------------------------------------------------- */
/* 1. TYPES                                                                   */
/* -------------------------------------------------------------------------- */

type RawMeta = { flattenedPath: string };

type AnyDoc = {
  _raw: RawMeta;
  slug?: string | null;
  canonicalUrl?: string | null;
  href?: string | null;
  coverImage?: string | null;
  coverimage?: string | null;
  readTime?: string | null;
  readtime?: string | null;
  readingTime?: string | null;
};

type DownloadDoc = AnyDoc & {
  pdfPath?: string | null;
  downloadFile?: string | null;
  fileUrl?: string | null;
  downloadUrl?: string | null;
  file?: string | null;
};

/* -------------------------------------------------------------------------- */
/* 2. STRING HELPERS                                                          */
/* -------------------------------------------------------------------------- */

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function toPosix(p: string): string {
  return p.replace(/\\/g, "/");
}

function trimSlashes(s: string): string {
  return s.replace(/^\/+/, "").replace(/\/+$/, "");
}

function normalizeUrl(url: string): string {
  const u = `/${trimSlashes(url)}`;
  return u === "/" ? "/" : u.replace(/\/+$/, "");
}

function stripIndex(p: string): string {
  return p.replace(/\/index$/i, "");
}

function deriveSegmentFromFlattenedPath(flattenedPath: string, basePath: string): string {
  const fp = stripIndex(toPosix(flattenedPath || ""));
  const base = trimSlashes(basePath);
  if (!base) return fp;
  if (fp === base) return "";
  if (fp.startsWith(`${base}/`)) return fp.slice(base.length + 1);
  return fp;
}

function getDocUrl(doc: AnyDoc, basePath: string): string {
  const base = trimSlashes(basePath);
  if (isNonEmptyString(doc.canonicalUrl)) {
    const explicit = normalizeUrl(doc.canonicalUrl);
    if (explicit === `/${base}` || explicit.startsWith(`/${base}/`)) return explicit;
  }
  if (isNonEmptyString(doc.slug)) {
    const provided = trimSlashes(doc.slug);
    if (provided === base) return `/${base}`;
    if (provided.startsWith(`${base}/`)) return normalizeUrl(`/${provided}`);
    return normalizeUrl(`${base}/${provided}`);
  }
  const seg = deriveSegmentFromFlattenedPath(doc._raw?.flattenedPath ?? "", base);
  return seg ? normalizeUrl(`${base}/${seg}`) : normalizeUrl(base);
}

/* -------------------------------------------------------------------------- */
/* 3. ESBUILD ALIASES                                                         */
/* -------------------------------------------------------------------------- */

function withAppAliases(esbuildOptions: any) {
  const root = process.cwd();
  esbuildOptions.alias = {
    ...(esbuildOptions.alias || {}),
    "@": root,
    "@/components": path.join(root, "components"),
    "@/lib": path.join(root, "lib"),
    "@/types": path.join(root, "types"),
    "@/content": path.join(root, "content"),
  };
  esbuildOptions.resolveExtensions = [".tsx", ".ts", ".jsx", ".js", ".json", ".mdx", ".md"];
  return esbuildOptions;
}

/* -------------------------------------------------------------------------- */
/* 4. SHARED FIELD DEFINITIONS                                                */
/* -------------------------------------------------------------------------- */

const commonFields = {
  title: { type: "string", required: true },
  date: { type: "date", required: false },
  slug: { type: "string", required: false },
  canonicalUrl: { type: "string", required: false },
  href: { type: "string", required: false },
  type: { type: "string", required: false },
  description: { type: "string", required: false },
  excerpt: { type: "string", required: false },
  coverImage: { type: "string", required: false },
  coverimage: { type: "string", required: false },
  tags: { type: "list", of: { type: "string" }, required: false },
  draft: { type: "boolean", required: false, default: false },
  featured: { type: "boolean", required: false, default: false },
  accessLevel: { type: "string", required: false },
  lockMessage: { type: "string", required: false },
} as const;

/* -------------------------------------------------------------------------- */
/* 5. COMPUTED FIELD GENERATORS                                               */
/* -------------------------------------------------------------------------- */

function computedCommon(base: string) {
  return {
    url: { type: "string", resolve: (doc: AnyDoc) => getDocUrl(doc, base) },
    normalizedCoverImage: {
      type: "string",
      resolve: (doc: AnyDoc) =>
        (typeof doc.coverImage === "string" && doc.coverImage.trim()) ||
        (typeof doc.coverimage === "string" && doc.coverimage.trim()) || "",
    },
  } as const;
}

function computedReadTime() {
  return {
    normalizedReadTime: {
      type: "string",
      resolve: (doc: AnyDoc) =>
        (typeof doc.readTime === "string" && doc.readTime.trim()) ||
        (typeof doc.readtime === "string" && doc.readtime.trim()) ||
        (typeof doc.readingTime === "string" && doc.readingTime.trim()) || "",
    },
  } as const;
}

function computedCanonicalPdfHref() {
  return {
    canonicalPdfHref: {
      type: "string",
      resolve: (doc: DownloadDoc) => {
        const pick =
          (typeof doc.pdfPath === "string" && doc.pdfPath.trim()) ||
          (typeof doc.downloadFile === "string" && doc.downloadFile.trim()) ||
          (typeof doc.fileUrl === "string" && doc.fileUrl.trim()) ||
          (typeof doc.downloadUrl === "string" && doc.downloadUrl.trim()) || "";
        const file = typeof doc.file === "string" && doc.file.trim() ? doc.file.trim() : "";
        if (/^https?:\/\//i.test(pick)) return pick;
        if (pick) {
          const clean = pick.startsWith("/") ? pick : `/${pick}`;
          if (!clean.includes("/", 1)) return `/downloads${clean}`;
          return clean;
        }
        if (file) {
          const b = path.posix.basename(file);
          return b ? `/downloads/${b}` : "";
        }
        return "";
      },
    },
  } as const;
}

/* -------------------------------------------------------------------------- */
/* 6. DOCUMENT TYPES                                                          */
/* -------------------------------------------------------------------------- */

export const Post = defineDocumentType(() => ({
  name: "Post",
  filePathPattern: "blog/**/*.{md,mdx}",
  contentType: "mdx",
  fields: {
    ...commonFields,
    date: { type: "date", required: true },
    author: { type: "string", required: false },
    authorTitle: { type: "string", required: false },
    readTime: { type: "string", required: false },
    readtime: { type: "string", required: false },
    readingTime: { type: "string", required: false },
    category: { type: "string", required: false },
    ogTitle: { type: "string", required: false },
    ogDescription: { type: "string", required: false },
    socialCaption: { type: "string", required: false },
    coverAspect: { type: "string", required: false },
    coverFit: { type: "string", required: false },
    coverPosition: { type: "string", required: false },
    relatedDownloads: { type: "list", of: { type: "string" }, required: false },
    resources: { type: "json", required: false },
    keyInsights: { type: "json", required: false },
    authorNote: { type: "string", required: false },
    layout: { type: "string", required: false },
  },
  computedFields: { ...computedCommon("blog"), ...computedReadTime() },
}));

export const Resource = defineDocumentType(() => ({
  name: "Resource",
  filePathPattern: "resources/**/*.{md,mdx}",
  contentType: "mdx",
  fields: {
    ...commonFields,
    author: { type: "string", required: false },
    readTime: { type: "string", required: false },
    readtime: { type: "string", required: false },
    readingTime: { type: "string", required: false },
    subtitle: { type: "string", required: false },
    resourceType: { type: "string", required: false },
    fileUrl: { type: "string", required: false },
    downloadUrl: { type: "string", required: false },
    fileSize: { type: "string", required: false },
  },
  computedFields: { ...computedCommon("resources"), ...computedReadTime() },
}));

export const Download = defineDocumentType(() => ({
  name: "Download",
  filePathPattern: "downloads/**/*.{md,mdx}",
  contentType: "mdx",
  fields: {
    ...commonFields,
    author: { type: "string", required: false },
    category: { type: "string", required: false },
    layout: { type: "string", required: false },
    readTime: { type: "string", required: false },
    readtime: { type: "string", required: false },
    readingTime: { type: "string", required: false },
    subtitle: { type: "string", required: false },
    file: { type: "string", required: false },
    pdfPath: { type: "string", required: false },
    fileSize: { type: "string", required: false },
    downloadFile: { type: "string", required: false },
    fileUrl: { type: "string", required: false },
    downloadUrl: { type: "string", required: false },
  },
  computedFields: { ...computedCommon("downloads"), ...computedReadTime(), ...computedCanonicalPdfHref() },
}));

export const Book = defineDocumentType(() => ({
  name: "Book",
  filePathPattern: "books/**/*.{md,mdx}",
  contentType: "mdx",
  fields: {
    ...commonFields,
    readTime: { type: "string", required: false },
    readtime: { type: "string", required: false },
    readingTime: { type: "string", required: false },
    subtitle: { type: "string", required: false },
    author: { type: "string", required: false },
    publisher: { type: "string", required: false },
    isbn: { type: "string", required: false },
    category: { type: "string", required: false },
  },
  computedFields: { ...computedCommon("books"), ...computedReadTime() },
}));

export const Event = defineDocumentType(() => ({
  name: "Event",
  filePathPattern: "events/**/*.{md,mdx}",
  contentType: "mdx",
  fields: {
    ...commonFields,
    time: { type: "string", required: false },
    eventDate: { type: "date", required: false },
    location: { type: "string", required: false },
    registrationUrl: { type: "string", required: false },
  },
  computedFields: { ...computedCommon("events") },
}));

export const Print = defineDocumentType(() => ({
  name: "Print",
  filePathPattern: "prints/**/*.{md,mdx}",
  contentType: "mdx",
  fields: {
    ...commonFields,
    dimensions: { type: "string", required: false },
    downloadFile: { type: "string", required: false },
    price: { type: "string", required: false },
    available: { type: "boolean", required: false, default: true },
  },
  computedFields: { ...computedCommon("prints") },
}));

export const Strategy = defineDocumentType(() => ({
  name: "Strategy",
  filePathPattern: "strategy/**/*.{md,mdx}",
  contentType: "mdx",
  fields: { ...commonFields, author: { type: "string", required: false } },
  computedFields: { ...computedCommon("strategy") },
}));

export const Canon = defineDocumentType(() => ({
  name: "Canon",
  filePathPattern: "canon/**/*.{md,mdx}",
  contentType: "mdx",
  fields: {
    ...commonFields,
    subtitle: { type: "string", required: false },
    author: { type: "string", required: false },
    coverAspect: { type: "string", required: false },
    coverFit: { type: "string", required: false },
    coverPosition: { type: "string", required: false },
    volumeNumber: { type: "string", required: false },
    order: { type: "number", required: false },
    readTime: { type: "string", required: false },
    readtime: { type: "string", required: false },
    readingTime: { type: "string", required: false },
  },
  computedFields: { ...computedCommon("canon"), ...computedReadTime() },
}));

export const Short = defineDocumentType(() => ({
  name: "Short",
  filePathPattern: "shorts/**/*.{md,mdx}",
  contentType: "mdx",
  fields: {
    ...commonFields,
    theme: { type: "string", required: false },
    audience: { type: "string", required: false },
    readTime: { type: "string", required: false },
    readtime: { type: "string", required: false },
    readingTime: { type: "string", required: false },
    published: { type: "boolean", required: false, default: true },
  },
  computedFields: { ...computedCommon("shorts"), ...computedReadTime() },
}));

/* -------------------------------------------------------------------------- */
/* 7. MAKE SOURCE                                                             */
/* -------------------------------------------------------------------------- */

export default makeSource({
  contentDirPath: path.join(process.cwd(), "content"),
  documentTypes: [Post, Download, Book, Event, Print, Strategy, Resource, Canon, Short],
  mdx: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [rehypeSlug],
    esbuildOptions: (options) => withAppAliases(options),
  },
  onUnknownDocuments: "skip-warn",
  disableImportAliasWarning: true,
});