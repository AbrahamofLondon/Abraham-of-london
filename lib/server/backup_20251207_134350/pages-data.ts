// lib/server/pages-data.ts
// Server-side page data loader with comprehensive type safety

import * as fs from "fs";
import * as path from "path";
import * as matter from "gray-matter";
import type { ContentBase, ContentEntry } from "@/types/index";

export interface PageMeta extends ContentBase {
  // Pages have all ContentBase fields plus page-specific ones
  content: string;
  type: "page";
}

export type PageWithContent = PageMeta & {
  content: string;
  body?: {
    code: string;
    raw: string;
  };
};

// Server-side guard
if (typeof window !== "undefined") {
  throw new Error("This module is server-only");
}

// Configuration
const PAGES_DIR = path.join(process.cwd(), "content", "pages");
const VALID_EXTENSIONS = [".mdx", ".md"] as const;

// ---------------------------------------------------------------------------
// UTILITY FUNCTIONS
// ---------------------------------------------------------------------------

/**
 * Safe type converters with validation
 */
function safeString(value: unknown): string | undefined {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  return undefined;
}

function safeArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const filtered = value.filter((item): item is string => typeof item === "string");
  return filtered.length > 0 ? filtered : undefined;
}

function safeNumber(value: unknown): number | undefined {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? undefined : parsed;
  }
  return undefined;
}

function safeBoolean(value: unknown): boolean | undefined {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const lower = value.toLowerCase().trim();
    if (lower === "true" || lower === "yes" || lower === "1") return true;
    if (lower === "false" || lower === "no" || lower === "0") return false;
  }
  return undefined;
}

function safeAccessLevel(value: unknown): "public" | "premium" | "private" | undefined {
  if (value === "public" || value === "premium" || value === "private") {
    return value;
  }
  return undefined;
}

function safeStatus(value: unknown): "draft" | "published" | "scheduled" | "archived" | undefined {
  if (value === "draft" || value === "published" || value === "scheduled" || value === "archived") {
    return value;
  }
  return undefined;
}

/**
 * Resolve page file path
 */
function resolvePagePath(slug: string): string | null {
  const cleanSlug = slug.replace(/\.mdx?$/i, "");

  // Check if pages directory exists
  if (!fs.existsSync(PAGES_DIR)) {
    console.warn("[pages-data] Pages directory does not exist:", PAGES_DIR);
    return null;
  }

  // Try each valid extension
  for (const ext of VALID_EXTENSIONS) {
    const fullPath = path.join(PAGES_DIR, `${cleanSlug}${ext}`);
    if (fs.existsSync(fullPath)) {
      return fullPath;
    }
  }

  return null;
}

/**
 * Generate excerpt from content
 */
function generateExcerpt(content: string, maxLength: number = 200): string {
  const plainText = content
    .replace(/[#*`\[\]]/g, '') // Remove markdown formatting
    .replace(/\s+/g, ' ')      // Normalize whitespace
    .trim();
  
  if (plainText.length <= maxLength) return plainText;
  
  return plainText.substring(0, maxLength).trim() + '...';
}

/**
 * Estimate read time
 */
function estimateReadTime(content: string): string {
  const wordsPerMinute = 200;
  const wordCount = content.split(/\s+/).length;
  const minutes = Math.ceil(wordCount / wordsPerMinute);
  return `${minutes} min`;
}

// ---------------------------------------------------------------------------
// CORE PAGE FUNCTIONS
// ---------------------------------------------------------------------------

/**
 * Get all page slugs from filesystem
 */
export function getPageSlugs(): string[] {
  if (!fs.existsSync(PAGES_DIR)) {
    console.warn("[pages-data] Pages directory not found:", PAGES_DIR);
    return [];
  }

  try {
    return fs
      .readdirSync(PAGES_DIR)
      .filter((filename) => 
        VALID_EXTENSIONS.some((ext) => 
          filename.toLowerCase().endsWith(ext)
        )
      )
      .map((filename) => 
        filename.replace(/\.mdx?$/i, "")
      )
      .filter(Boolean);
  } catch (error) {
    console.error("[pages-data] Error reading pages directory:", error);
    return [];
  }
}

/**
 * Parse and process a single page file
 */
function parsePageFile(filePath: string, slug: string): PageMeta | null {
  try {
    const fileContent = fs.readFileSync(filePath, "utf8");
    const { data: frontmatter, content } = matter(fileContent);
    
    const fm = frontmatter || {};
    
    // Generate ID from file path
    const fileId = path.relative(process.cwd(), filePath);
    
    return {
      // Core identifiers
      slug,
      title: safeString(fm.title) || path.basename(slug).replace(/-/g, ' '),
      
      // Content
      description: safeString(fm.description),
      excerpt: safeString(fm.excerpt) || generateExcerpt(content),
      content,
      
      // Metadata
      date: safeString(fm.date) || safeString(fm.createdAt) || new Date().toISOString().split('T')[0],
      author: safeString(fm.author) || "Abraham of London",
      category: safeString(fm.category),
      tags: safeArray(fm.tags),
      featured: safeBoolean(fm.featured),
      readTime: safeString(fm.readTime) || estimateReadTime(content),
      
      // Visual
      coverImage: safeString(fm.coverImage) || safeString(fm.image),
      
      // State
      draft: safeBoolean(fm.draft),
      published: safeBoolean(fm.published) ?? true,
      status: safeStatus(fm.status) || "published",
      
      // Access
      accessLevel: safeAccessLevel(fm.accessLevel) || "public",
      lockMessage: safeString(fm.lockMessage),
      
      // Page-specific
      type: "page",
      
      // System fields
      _raw: {
        sourceFilePath: filePath,
        sourceFileDir: PAGES_DIR,
        contentType: "page",
        flatData: fm,
      },
      _id: `page-${slug}-${fileId}`,
      url: `/${slug}`,
      
      // Additional fields from frontmatter
      ...Object.fromEntries(
        Object.entries(fm).filter(([key]) => ![
          'title', 'description', 'excerpt', 'date', 'author', 'category',
          'tags', 'featured', 'readTime', 'coverImage', 'image', 'draft',
          'published', 'status', 'accessLevel', 'lockMessage'
        ].includes(key))
        .map(([key, value]) => [key, value])
      ),
    };
  } catch (error) {
    console.error(`[pages-data] Error parsing page file ${filePath}:`, error);
    return null;
  }
}

/**
 * Get a single page by slug
 */
export function getPageBySlug(
  slug: string,
  options?: {
    fields?: string[];
    withContent?: boolean;
  }
): (PageMeta | PageWithContent) | null {
  try {
    if (!slug || typeof slug !== 'string') {
      console.error("[pages-data] Invalid slug provided:", slug);
      return null;
    }
    
    const cleanSlug = slug.replace(/\.mdx?$/i, "");
    const filePath = resolvePagePath(cleanSlug);
    
    if (!filePath) {
      console.warn(`[pages-data] Page not found for slug: ${cleanSlug}`);
      
      // Check mock pages as fallback
      const mockPage = mockPages.find(page => page.slug === cleanSlug);
      if (mockPage) {
        console.log(`[pages-data] Using mock data for: ${cleanSlug}`);
        return options?.withContent ? mockPage : { ...mockPage, content: '' };
      }
      
      return null;
    }
    
    const page = parsePageFile(filePath, cleanSlug);
    if (!page) return null;
    
    // Handle field filtering
    if (options?.fields && options.fields.length > 0) {
      const filtered: any = {};
      for (const field of options.fields) {
        if (field === 'content' && options.withContent) {
          filtered.content = page.content;
        } else if (field in page) {
          filtered[field] = (page as any)[field];
        }
      }
      return filtered;
    }
    
    // Return with or without content
    return options?.withContent ? page : { ...page, content: '' };
    
  } catch (error) {
    console.error(`[pages-data] Error getting page ${slug}:`, error);
    return null;
  }
}

/**
 * Get all pages
 */
export function getAllPages(options?: {
  includeDrafts?: boolean;
  fields?: string[];
  withContent?: boolean;
  sortBy?: 'date' | 'title' | 'slug';
  sortOrder?: 'asc' | 'desc';
}): (PageMeta | PageWithContent)[] {
  try {
    const slugs = getPageSlugs();
    const pages: (PageMeta | PageWithContent)[] = [];
    
    for (const slug of slugs) {
      const page = getPageBySlug(slug, {
        fields: options?.fields,
        withContent: options?.withContent
      });
      
      if (page) {
        // Filter drafts if requested
        if (!options?.includeDrafts && page.draft) {
          continue;
        }
        pages.push(page);
      }
    }
    
    // Apply sorting
    const sortBy = options?.sortBy || 'date';
    const sortOrder = options?.sortOrder || 'desc';
    
    pages.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          const dateA = a.date ? new Date(a.date).getTime() : 0;
          const dateB = b.date ? new Date(b.date).getTime() : 0;
          comparison = dateB - dateA;
          break;
          
        case 'title':
          comparison = (a.title || '').localeCompare(b.title || '');
          break;
          
        case 'slug':
          comparison = a.slug.localeCompare(b.slug);
          break;
      }
      
      return sortOrder === 'desc' ? comparison : -comparison;
    });
    
    return pages;
    
  } catch (error) {
    console.error("[pages-data] Error getting all pages:", error);
    return [];
  }
}

/**
 * Search pages by query
 */
export function searchPages(
  query: string,
  options?: {
    fields?: ('title' | 'description' | 'excerpt' | 'content' | 'tags')[];
    limit?: number;
  }
): PageMeta[] {
  try {
    const allPages = getAllPages({ withContent: false });
    const normalizedQuery = query.toLowerCase().trim();
    
    if (!normalizedQuery) return allPages;
    
    const searchFields = options?.fields || ['title', 'description', 'excerpt', 'tags'];
    const results = allPages.filter(page => {
      for (const field of searchFields) {
        if (field === 'tags') {
          if (page.tags?.some(tag => tag.toLowerCase().includes(normalizedQuery))) {
            return true;
          }
        } else {
          const value = page[field];
          if (typeof value === 'string' && value.toLowerCase().includes(normalizedQuery)) {
            return true;
          }
        }
      }
      return false;
    });
    
    return options?.limit ? results.slice(0, options.limit) : results;
    
  } catch (error) {
    console.error(`[pages-data] Error searching pages for "${query}":`, error);
    return [];
  }
}

/**
 * Get pages by category
 */
export function getPagesByCategory(category: string): PageMeta[] {
  try {
    return getAllPages({ withContent: false })
      .filter(page => page.category?.toLowerCase() === category.toLowerCase());
  } catch (error) {
    console.error(`[pages-data] Error getting pages by category "${category}":`, error);
    return [];
  }
}

/**
 * Get pages by tag
 */
export function getPagesByTag(tag: string): PageMeta[] {
  try {
    return getAllPages({ withContent: false })
      .filter(page => page.tags?.some(t => t.toLowerCase() === tag.toLowerCase()));
  } catch (error) {
    console.error(`[pages-data] Error getting pages by tag "${tag}":`, error);
    return [];
  }
}

/**
 * Get featured pages
 */
export function getFeaturedPages(): PageMeta[] {
  try {
    return getAllPages({ withContent: false })
      .filter(page => page.featured);
  } catch (error) {
    console.error("[pages-data] Error getting featured pages:", error);
    return [];
  }
}

/**
 * Convert PageMeta to ContentEntry for backward compatibility
 */
export function pageToContentEntry(page: PageMeta): ContentEntry {
  return {
    slug: page.slug,
    title: page.title,
    date: page.date,
    excerpt: page.excerpt,
    description: page.description,
    category: page.category,
    tags: page.tags,
    featured: page.featured,
    readTime: page.readTime,
    _raw: page._raw,
    ...Object.fromEntries(
      Object.entries(page).filter(([key]) => ![
        'slug', 'title', 'date', 'excerpt', 'description', 'category',
        'tags', 'featured', 'readTime', '_raw', 'content', 'type'
      ].includes(key))
    ),
  };
}

// ---------------------------------------------------------------------------
// MOCK DATA FOR DEVELOPMENT
// ---------------------------------------------------------------------------

export const mockPages: PageMeta[] = [
  {
    slug: "about",
    title: "About Abraham of London",
    description: "Learn more about Abraham of London and his work in technology and innovation.",
    excerpt: "Building faith-rooted strategy for leaders who refuse to outsource responsibility.",
    content: "# About Abraham of London\n\nWelcome to my digital space. This is where faith, strategy, and legacy converge for fathers, founders, and leaders.",
    author: "Abraham of London",
    date: "2024-01-01",
    readTime: "3 min",
    category: "Personal",
    tags: ["about", "biography"],
    featured: true,
    draft: false,
    published: true,
    status: "published",
    accessLevel: "public",
    type: "page",
    _raw: {
      sourceFilePath: "content/pages/about.mdx",
      sourceFileDir: "content/pages",
      contentType: "page",
      flatData: {},
    },
    _id: "page-about",
    url: "/about",
  },
  {
    slug: "contact",
    title: "Contact",
    description: "Get in touch with Abraham of London for collaborations and inquiries.",
    excerpt: "Connect for strategic conversations about faith, fatherhood, and legacy.",
    content: "# Contact\n\nReach out to discuss opportunities, strategic partnerships, or meaningful conversations about faith, fatherhood, and legacy building.",
    author: "Abraham of London",
    date: "2024-01-01",
    readTime: "2 min",
    category: "Contact",
    tags: ["contact", "connect"],
    featured: false,
    draft: false,
    published: true,
    status: "published",
    accessLevel: "public",
    type: "page",
    _raw: {
      sourceFilePath: "content/pages/contact.mdx",
      sourceFileDir: "content/pages",
      contentType: "page",
      flatData: {},
    },
    _id: "page-contact",
    url: "/contact",
  },
  {
    slug: "privacy",
    title: "Privacy Policy",
    description: "Privacy policy and data protection information.",
    excerpt: "How we protect and handle your personal data.",
    content: "# Privacy Policy\n\nYour privacy is important to us. This policy explains how we handle your data.",
    author: "Abraham of London",
    date: "2024-01-01",
    readTime: "5 min",
    category: "Legal",
    tags: ["privacy", "policy", "legal"],
    featured: false,
    draft: false,
    published: true,
    status: "published",
    accessLevel: "public",
    type: "page",
    _raw: {
      sourceFilePath: "content/pages/privacy.mdx",
      sourceFileDir: "content/pages",
      contentType: "page",
      flatData: {},
    },
    _id: "page-privacy",
    url: "/privacy",
  },
];

// ---------------------------------------------------------------------------
// DEFAULT EXPORT FOR COMPATIBILITY
// ---------------------------------------------------------------------------

export default {
  // Core functions
  getPageSlugs,
  getPageBySlug,
  getAllPages,
  
  // Filter functions
  searchPages,
  getPagesByCategory,
  getPagesByTag,
  getFeaturedPages,
  
  // Utility functions
  pageToContentEntry,
  
  // Mock data
  mockPages,
  
  // Types
  PageMeta,
  PageWithContent,
};