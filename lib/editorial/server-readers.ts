// lib/editorial/server-readers.ts
// 🚫 NEVER import this in client components

import fs from "fs";
import path from "path";
import matter from "gray-matter";

function safeString(v: unknown, fallback = ""): string {
  return typeof v === "string" && v.trim() ? v : fallback;
}

function fileExistsInPublic(relPath: string): boolean {
  try {
    return fs.existsSync(
      path.join(process.cwd(), "public", relPath.replace(/^\/+/, "")),
    );
  } catch {
    return false;
  }
}

export type PublicationItem = {
  slug: string;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  author: string;
  date?: string | null;
  tier: string;
  category?: string | null;
  readingTime?: string | null;
  documentId?: string | null;
  href: string;
  pdfHref: string | null;
};

export function readPrintSourcePublications(): PublicationItem[] {
  const dir = path.join(process.cwd(), "scripts", "pdf", "print-sources");

  if (!fs.existsSync(dir)) return [];

  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".print.md"));

  return files
    .map((file) => {
      const raw = fs.readFileSync(path.join(dir, file), "utf8");
      const parsed = matter(raw);
      const data = parsed.data as Record<string, unknown>;

      const slug = file.replace(/\.print\.md$/i, "");

      const preferredPdf = `/downloads/${slug}.pdf`;
      const controlledPdf = `/api/downloads/${slug}`;
      const fallbackPdf = ["", "assets", "downloads", `${slug}.pdf`].join("/");

      const pdfHref = fileExistsInPublic(preferredPdf)
        ? preferredPdf
        : fileExistsInPublic(fallbackPdf)
        ? controlledPdf
        : null;

      return {
        slug,
        title: safeString(data.title, slug),
        subtitle: safeString(data.subtitle) || null,
        description: safeString(data.description) || null,
        author: safeString(data.author, "Abraham of London"),
        date: safeString(data.date) || null,
        tier: safeString(data.tier, "public"),
        category: safeString(data.category) || "Editorial",
        readingTime:
          safeString(data.readingTime) ||
          safeString(data.readTime) ||
          null,
        documentId: safeString(data.documentId) || null,
        href: `/editorials/${slug}`,
        pdfHref,
      };
    })
    .sort((a, b) => {
      const da = Date.parse(a.date || "") || 0;
      const db = Date.parse(b.date || "") || 0;
      return db - da;
    });
}
