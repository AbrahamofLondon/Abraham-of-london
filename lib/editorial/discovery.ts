import fs from "fs";
import path from "path";
import matter from "gray-matter";

import type {
  DiscoveredPublication,
  PublicationRecord,
  PublicationTier,
} from "./types";
import { hasAccess, normalizeUserTier } from "@/lib/access/tier-policy";
import {
  EDITORIAL_CATALOGUE,
  getPublicationBySlug as getPublicationBySlugFromCatalogue,
} from "./catalogue";

function abs(p: string): string {
  return path.isAbsolute(p) ? p : path.join(process.cwd(), p);
}

function safeText(v: unknown): string | undefined {
  return typeof v === "string" && v.trim() ? v.trim() : undefined;
}

function safeTags(v: unknown): string[] {
  return Array.isArray(v)
    ? v.map(String).map((x) => x.trim()).filter(Boolean)
    : [];
}

function inferSlugFromFilename(filename: string): string {
  return filename.replace(/\.print\.md$/i, "").trim();
}

function inferPdfPath(slug: string): string {
  return `/assets/downloads/${slug}.pdf`;
}

function inferEpubPath(slug: string): string {
  return `/assets/downloads/${slug}.epub`;
}

function inferPreviewPath(slug: string): string {
  return `/editorials/${slug}`;
}

function resolvePublicationTier(input: unknown): PublicationTier {
  return normalizeUserTier(safeText(input) || "public") as PublicationTier;
}

function resolveYear(dateValue: unknown): string {
  const raw = safeText(dateValue);
  if (!raw) return new Date().toISOString().slice(0, 4);
  return raw.slice(0, 4);
}

function sortRecords<T extends { date?: string | null; slug: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const aTime = a.date ? new Date(a.date).getTime() : 0;
    const bTime = b.date ? new Date(b.date).getTime() : 0;

    if (aTime !== bTime) return bTime - aTime;
    return a.slug.localeCompare(b.slug);
  });
}

export function discoverPublications(): DiscoveredPublication[] {
  const sourceDir = abs("scripts/pdf/print-sources");

  const fromFilesystem: DiscoveredPublication[] = fs.existsSync(sourceDir)
    ? fs
        .readdirSync(sourceDir)
        .filter((f) => f.endsWith(".print.md"))
        .sort((a, b) => a.localeCompare(b))
        .map((file): DiscoveredPublication => {
          const slug = inferSlugFromFilename(file);
          const raw = fs.readFileSync(path.join(sourceDir, file), "utf8");
          const parsed = matter(raw);
          const data = parsed.data as Record<string, unknown>;

          return {
            slug,
            title: safeText(data.title) || slug,
            description:
              safeText(data.description) ||
              safeText(data.subtitle) ||
              null,
            cover:
              safeText(data.coverImage) ||
              `/assets/images/books/${slug}-cover.jpg`,
            category: safeText(data.category) || "Editorial",
            tier: resolvePublicationTier(data.tier),
            date: safeText(data.date) || null,
          };
        })
    : [];

  const existingSlugs = new Set(fromFilesystem.map((item) => item.slug));

  const fromCatalogue: DiscoveredPublication[] = EDITORIAL_CATALOGUE.filter(
    (entry) => !existingSlugs.has(entry.slug),
  ).map((entry) => ({
    slug: entry.slug,
    title: entry.title,
    description: entry.description || entry.subtitle || null,
    cover: entry.coverImage || null,
    category: entry.category || "Editorial",
    tier: entry.tier,
    date: entry.date || null,
  }));

  return sortRecords([...fromFilesystem, ...fromCatalogue]);
}

export function getPublicationBySlug(slug: string): PublicationRecord | undefined {
  const normalizedSlug = String(slug || "").trim();
  if (!normalizedSlug) return undefined;

  const fromCatalogue = getPublicationBySlugFromCatalogue(normalizedSlug);
  if (fromCatalogue) return fromCatalogue;

  const sourceDir = abs("scripts/pdf/print-sources");
  const candidatePath = path.join(sourceDir, `${normalizedSlug}.print.md`);

  if (!fs.existsSync(candidatePath)) return undefined;

  const raw = fs.readFileSync(candidatePath, "utf8");
  const parsed = matter(raw);
  const data = parsed.data as Record<string, unknown>;

  const title = safeText(data.title) || normalizedSlug;
  const author = safeText(data.author) || "Abraham of London";
  const year = resolveYear(data.date);
  const tier = resolvePublicationTier(data.tier);

  const pdfPath = safeText(data.pdfPath) || inferPdfPath(normalizedSlug);
  const epubPath = safeText(data.epubPath) || inferEpubPath(normalizedSlug);
  const previewPath = safeText(data.previewPath) || inferPreviewPath(normalizedSlug);

  return {
    slug: normalizedSlug,
    contentId: safeText(data.documentId) || normalizedSlug,
    title,
    subtitle: safeText(data.subtitle),
    description: safeText(data.description),
    author,
    date: safeText(data.date),
    version: safeText(data.version),
    status: safeText(data.status),
    category: safeText(data.category),
    readingTime: safeText(data.readingTime),
    tier,

    coverImage:
      safeText(data.coverImage) || `/assets/images/books/${normalizedSlug}-cover.jpg`,
    socialImage: safeText(data.socialImage),

    pdfPath,
    epubPath,
    previewPath,

    previewEnabled: true,
    epubEnabled: Boolean(epubPath),
    printEnabled: false,

    vaultEnabled: !hasAccess("public", tier),
    innerCircleEnabled: hasAccess("inner-circle", tier),

    tags: safeTags(data.tags),

    citation: {
      citationTitle: title,
      citationAuthor: author,
      citationPublisher: "Abraham of London",
      citationYear: year,
      canonicalUrl: `https://www.abrahamoflondon.org/editorials/${normalizedSlug}`,
      doi: safeText(data.doi),
    },

    print: {
      provider: "amazon-kdp",
      status: "draft",
    },
  };
}