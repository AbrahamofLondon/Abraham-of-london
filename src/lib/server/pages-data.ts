src / lib / server / pages - data.ts;
// src/lib/server/pages-data.ts
import fs from "fs";
import path from "path";
import matter from "gray-matter";

export interface PageMeta {
  slug: string;
  title: string;
  description?: string;
  content: string;
  excerpt?: string;
  date?: string;
  author?: string;
  readTime?: string;
  category?: string;
  tags?: string[];
}

// Server-side guard
if (typeof window !== "undefined") {
  throw new Error("This module is server-only");
}

// Use content directory in project root
const pagesDir = path.join(process.cwd(), "content", "pages");
const exts = [".mdx", ".md"] as const;

// ---------- Core page data functions ----------

function resolvePagePath(slug: string): string | null {
  const real = slug.replace(/\.mdx?$/i, "");

  // Ensure pages directory exists
  if (!fs.existsSync(pagesDir)) {
    console.warn("[pages-data] Pages directory does not exist:", pagesDir);
    return null;
  }

  for (const ext of exts) {
    const full = path.join(pagesDir, `${real}${ext}`);
    if (fs.existsSync(full)) return full;
  }
  return null;
}

export function getPageSlugs(): string[] {
  if (!fs.existsSync(pagesDir)) {
    console.warn("[pages-data] Pages directory not found:", pagesDir);
    return [];
  }

  try {
    return fs
      .readdirSync(pagesDir)
      .filter((f) => exts.some((e) => f.toLowerCase().endsWith(e)))
      .map((f) => f.replace(/\.mdx?$/i, ""));
  } catch (err) {
    console.error("[pages-data] Error reading pages directory:", err);
    return [];
  }
}

export function getPageBySlug(
  slug: string,
  fields: string[] = []
): PageMeta | null {
  const real = slug.replace(/\.mdx?$/i, "");
  const fullPath = resolvePagePath(real);

  // If file is missing, return null or fallback
  if (!fullPath) {
    console.warn("[pages-data] Page not found for slug:", real);

    // Check if it's a known page and return mock data
    const knownPage = mockPages.find((page) => page.slug === real);
    if (knownPage) {
      // Filter fields if specified
      if (fields.length > 0) {
        const filteredPage: any = {};
        fields.forEach((field) => {
          if (field in knownPage) {
            filteredPage[field] = (knownPage as any)[field];
          }
        });
        return filteredPage;
      }
      return knownPage;
    }

    return null;
  }

  try {
    const raw = fs.readFileSync(fullPath, "utf8");
    const { data, content } = matter(raw);
    const fm = data || {};

    const pageData: PageMeta = {
      slug: real,
      title: typeof fm.title === "string" ? fm.title : "Untitled",
      description:
        typeof fm.description === "string" ? fm.description : undefined,
      content: content || "",
      excerpt: typeof fm.excerpt === "string" ? fm.excerpt : undefined,
      date: typeof fm.date === "string" ? fm.date : undefined,
      author: typeof fm.author === "string" ? fm.author : "Abraham of London",
      readTime: typeof fm.readTime === "string" ? fm.readTime : undefined,
      category: typeof fm.category === "string" ? fm.category : undefined,
      tags: Array.isArray(fm.tags) ? fm.tags : undefined,
    };

    // Filter fields if specified
    if (fields.length > 0) {
      const filteredPage: any = {};
      fields.forEach((field) => {
        if (field in pageData) {
          filteredPage[field] = (pageData as any)[field];
        }
      });
      return filteredPage;
    }

    return pageData;
  } catch (err) {
    console.error(`[pages-data] Error processing page ${slug}:`, err);

    // Fallback to mock data
    const knownPage = mockPages.find((page) => page.slug === real);
    if (knownPage) {
      if (fields.length > 0) {
        const filteredPage: any = {};
        fields.forEach((field) => {
          if (field in knownPage) {
            filteredPage[field] = (knownPage as any)[field];
          }
        });
        return filteredPage;
      }
      return knownPage;
    }

    return null;
  }
}

export function getAllPages(fields: string[] = []): PageMeta[] {
  const slugs = getPageSlugs();
  const pages: PageMeta[] = [];

  for (const slug of slugs) {
    const page = getPageBySlug(slug, fields);
    if (page) {
      pages.push(page);
    }
  }

  // If no pages found in filesystem, use mock pages
  if (pages.length === 0) {
    console.warn("[pages-data] No pages found in filesystem, using mock data");
    return mockPages.map((page) => {
      if (fields.length > 0) {
        const filteredPage: any = {};
        fields.forEach((field) => {
          if (field in page) {
            filteredPage[field] = (page as any)[field];
          }
        });
        return filteredPage as PageMeta;
      }
      return page;
    });
  }

  return pages;
}

// Mock data fallback for development
export const mockPages: PageMeta[] = [
  {
    slug: "about",
    title: "About Abraham of London",
    description:
      "Learn more about Abraham of London and his work in technology and innovation.",
    content:
      "# About Abraham of London\n\nWelcome to my digital space. This is where faith, strategy, and legacy converge for fathers, founders, and leaders.",
    excerpt:
      "Building faith-rooted strategy for leaders who refuse to outsource responsibility.",
    author: "Abraham of London",
    date: "2024-01-01",
    readTime: "3 min",
    category: "Personal",
    tags: ["about", "biography"],
  },
  {
    slug: "contact",
    title: "Contact",
    description:
      "Get in touch with Abraham of London for collaborations and inquiries.",
    content:
      "# Contact\n\nReach out to discuss opportunities, strategic partnerships, or meaningful conversations about faith, fatherhood, and legacy building.",
    excerpt:
      "Connect for strategic conversations about faith, fatherhood, and legacy.",
    author: "Abraham of London",
    date: "2024-01-01",
    readTime: "2 min",
    category: "Contact",
    tags: ["contact", "connect"],
  },
];

// Export default for compatibility
export default {
  getPageSlugs,
  getPageBySlug,
  getAllPages,
  mockPages,
};
