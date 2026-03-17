// lib/editorial/discovery.ts
import fs from "fs";
import path from "path";
import matter from "gray-matter";

import type { PublicationRecord, PublicationTier } from "./types";
import { hasAccess, normalizeUserTier } from "@/lib/access/tier-policy";

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

export function discoverPublications(): PublicationRecord[] {
  const dir = abs("scripts/pdf/print-sources");
  if (!fs.existsSync(dir)) return [];

  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".print.md"))
    .sort((a, b) => a.localeCompare(b));

  return files.map((file): PublicationRecord => {
    const slug = inferSlugFromFilename(file);
    const raw = fs.readFileSync(path.join(dir, file), "utf8");
    const parsed = matter(raw);
    const data = parsed.data as Record<string, unknown>;

    const title = safeText(data.title) || slug;
    const author = safeText(data.author) || "Abraham of London";
    const year = resolveYear(data.date);
    const tier = resolvePublicationTier(data.tier);

    const pdfPath = inferPdfPath(slug);
    const epubPath = inferEpubPath(slug);
    const previewPath = inferPreviewPath(slug);

    return {
      slug,
      contentId: safeText(data.documentId) || slug,
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
        safeText(data.coverImage) || `/assets/images/books/${slug}-cover.jpg`,
      socialImage: safeText(data.socialImage),

      pdfPath,
      epubPath,
      previewPath,

      previewEnabled: true,
      epubEnabled: false,
      printEnabled: false,

      vaultEnabled: !hasAccess("public", tier),
      innerCircleEnabled: hasAccess("inner-circle", tier),

      tags: safeTags(data.tags),

      citation: {
        citationTitle: title,
        citationAuthor: author,
        citationPublisher: "Abraham of London",
        citationYear: year,
        canonicalUrl: `https://www.abrahamoflondon.org/editorials/${slug}`,
      },

      print: {
        provider: "amazon-kdp",
        status: "draft",
      },
    };
  });
}