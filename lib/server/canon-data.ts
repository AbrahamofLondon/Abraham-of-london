// lib/server/canon-data.ts
// Canon under content/canon/* - COMPLETE ROBUST VERSION

import {
  getMdxCollectionMeta,
  getMdxDocumentBySlug,
  type MdxMeta,
  type MdxDocument,
} from "@/lib/server/mdx-collections";
import type { Canon, ContentEntry, ContentMeta } from "@/types/index";

export type CanonWithContent = Canon & {
  content: string;
};

// Extended MDX meta with canon-specific fields
type CanonishMdxMeta = MdxMeta & Partial<Canon> & {
  publishDate?: string;
  releaseDate?: string;
  [key: string]: any;
};

type CanonishMdxDocument = MdxDocument & {
  content: string;
} & Partial<Canon>;

// ---------------------------------------------------------------------------
// SAFE TYPE CONVERTERS
// ---------------------------------------------------------------------------

/**
 * Safely convert any value to string or return undefined
 */
function safeString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : undefined;
}

/**
 * Safely convert any value to number or return undefined
 */
function safeNumber(value: unknown): number | undefined {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = parseInt(value, 10);
    return Number.isNaN(parsed) ? undefined : parsed;
  }
  return undefined;
}

/**
 * Safely convert any value to boolean or return undefined
 */
function safeBoolean(value: unknown): boolean | undefined {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const lower = value.toLowerCase().trim();
    if (lower === "true") return true;
    if (lower === "false") return false;
    if (lower === "yes") return true;
    if (lower === "no") return false;
    if (lower === "1") return true;
    if (lower === "0") return false;
  }
  if (typeof value === "number") {
    return value === 1;
  }
  return undefined;
}

/**
 * Safely convert any value to array of strings or return undefined
 */
function safeArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const filtered = value.filter((item) => typeof item === "string") as string[];
  return filtered.length > 0 ? filtered : undefined;
}

/**
 * Safely convert a value into the allowed status enum or undefined
 */
function safeStatus(
  value: unknown
): "draft" | "published" | "scheduled" | "archived" | undefined {
  if (value === "draft" || value === "published" || value === "scheduled" || value === "archived") {
    return value;
  }
  return undefined;
}

/**
 * Safely convert access level
 */
function safeAccessLevel(
  value: unknown
): "public" | "premium" | "private" | undefined {
  if (value === "public" || value === "premium" || value === "private") {
    return value;
  }
  return undefined;
}

/**
 * Safely convert genre array (for canon entries)
 */
function safeGenreArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const filtered = value.filter((item) => typeof item === "string") as string[];
  return filtered.length > 0 ? filtered : undefined;
}

// ---------------------------------------------------------------------------
// MAIN CONVERSION FUNCTIONS
// ---------------------------------------------------------------------------

/**
 * Map generic MDX meta into a fully shaped Canon.
 */
function fromMdxMeta(meta: MdxMeta): Canon {
  const m = meta as CanonishMdxMeta;

  // Handle different date fields
  const date = safeString(m.date) || safeString(m.publishDate) || safeString(m.releaseDate) || safeString(m.publishedDate);
  
  // Ensure required fields have defaults
  const slug = safeString(m.slug) || "";
  const title = safeString(m.title) || "Untitled";
  
  if (!slug || !title) {
    console.warn(`Canon metadata missing slug or title: ${slug} - ${title}`);
  }

  return {
    // Core identifiers - REQUIRED
    slug,
    title,

    // Content fields
    description: safeString(m.description),
    excerpt: safeString(m.excerpt),
    subtitle: safeString(m.subtitle),

    // Metadata
    date,
    author: safeString(m.author),
    category: safeString(m.category), // This should be in Canon type
    tags: safeArray(m.tags),
    featured: safeBoolean(m.featured),
    readTime: safeString(m.readTime) || safeNumber(m.readTime),

    // Visual
    coverImage: safeString(m.coverImage) || safeString(m.image),

    // Canon-specific fields
    originalTitle: safeString(m.originalTitle),
    translatedBy: safeString(m.translatedBy),
    yearWritten: safeNumber(m.yearWritten),
    yearPublished: safeNumber(m.yearPublished),
    period: safeString(m.period),
    movement: safeString(m.movement),
    genre: safeGenreArray(m.genre),
    literaryForm: safeString(m.literaryForm),
    language: safeString(m.language),
    country: safeString(m.country),
    themes: safeArray(m.themes),
    characters: safeArray(m.characters),
    setting: safeString(m.setting),
    symbolism: safeString(m.symbolism),
    awards: safeArray(m.awards),
    adaptations: safeArray(m.adaptations),
    criticism: safeString(m.criticism),
    influence: safeString(m.influence),
    significance: safeString(m.significance),
    isbn: safeString(m.isbn),
    publisher: safeString(m.publisher),
    publishedDate: safeString(m.publishedDate),
    price: safeString(m.price),
    purchaseLink: safeString(m.purchaseLink),
    pages: safeNumber(m.pages),
    format: safeString(m.format),
    series: safeString(m.series),
    volume: safeNumber(m.volume) || safeString(m.volume),
    edition: safeString(m.edition),
    rating: safeNumber(m.rating),
    lastModified: safeString(m.lastModified),

    // Additional fields
    translator: safeString(m.translator),
    editor: safeString(m.editor),
    forewordBy: safeString(m.forewordBy),
    introductionBy: safeString(m.introductionBy),

    // State
    draft: safeBoolean(m.draft),
    published: safeBoolean(m.published),
    status: safeStatus(m.status),

    // Access
    accessLevel: safeAccessLevel(m.accessLevel) || "public",
    lockMessage: safeString(m.lockMessage),

    // System fields
    _raw: m._raw,
    _id: safeString(m._id),
    url: safeString(m.url),
    type: safeString(m.type) || "canon",

    // Preserve any additional fields
    ...Object.fromEntries(
      Object.entries(m)
        .filter(([key]) => ![
          'slug', 'title', 'description', 'excerpt', 'subtitle',
          'date', 'author', 'category', 'tags', 'featured', 'readTime',
          'coverImage', 'image', 'originalTitle', 'translatedBy', 'yearWritten',
          'yearPublished', 'period', 'movement', 'genre', 'literaryForm', 'language',
          'country', 'themes', 'characters', 'setting', 'symbolism', 'awards',
          'adaptations', 'criticism', 'influence', 'significance', 'isbn', 'publisher',
          'publishedDate', 'price', 'purchaseLink', 'pages', 'format', 'series',
          'volume', 'edition', 'rating', 'lastModified', 'translator', 'editor',
          'forewordBy', 'introductionBy', 'draft', 'published', 'status',
          'accessLevel', 'lockMessage', '_raw', '_id', 'url', 'type', 'publishDate', 'releaseDate'
        ].includes(key))
        .map(([key, value]) => [key, value])
    ),
  };
}

/**
 * Attach MDX content to a typed Canon.
 */
function fromMdxDocument(doc: MdxDocument): CanonWithContent {
  const canonDoc = doc as CanonishMdxDocument;
  const { content, ...rest } = canonDoc;
  const meta = fromMdxMeta(rest);
  
  return { 
    ...meta, 
    content: typeof content === "string" ? content : "",
    body: canonDoc.body || undefined,
  };
}

/**
 * Convert Canon to ContentMeta for listings
 */
export function canonToContentMeta(canon: Canon): ContentMeta {
  const { content, body, ...meta } = canon;
  return {
    ...meta,
    category: canon.category, // Ensure category is included
  };
}

/**
 * Convert Canon to ContentEntry for backward compatibility
 */
export function canonToContentEntry(canon: Canon): ContentEntry {
  return {
    slug: canon.slug,
    title: canon.title,
    date: canon.date,
    excerpt: canon.excerpt,
    description: canon.description,
    category: canon.category,
    tags: canon.tags,
    featured: canon.featured,
    readTime: canon.readTime,
    _raw: canon._raw,
    ...Object.fromEntries(
      Object.entries(canon)
        .filter(([key]) => ![
          'slug', 'title', 'date', 'excerpt', 'description', 'category',
          'tags', 'featured', 'readTime', '_raw', 'content', 'body'
        ].includes(key))
    ),
  };
}

// ---------------------------------------------------------------------------
// PUBLIC API FUNCTIONS
// ---------------------------------------------------------------------------

/**
 * All canon entries - meta only.
 */
export function getAllCanonMeta(): Canon[] {
  try {
    const metas = getMdxCollectionMeta("canon");
    if (!metas || !Array.isArray(metas)) {
      console.warn("No canon metadata found or metadata is not an array");
      return [];
    }
    
    const canonEntries = metas.map((m) => fromMdxMeta(m));
    
    // Filter out invalid entries (missing required fields)
    const validCanon = canonEntries.filter(canon => {
      const isValid = canon.slug && canon.title;
      if (!isValid) {
        console.warn(`Invalid canon entry skipped: ${canon.slug || 'no-slug'} - ${canon.title || 'no-title'}`);
      }
      return isValid;
    });
    
    console.log(`Found ${validCanon.length} valid canon entries out of ${metas.length} total`);
    return validCanon;
  } catch (error) {
    console.error("Error fetching all canon meta:", error);
    return [];
  }
}

/**
 * Single canon entry - meta + content.
 */
export function getCanonBySlug(slug: string): CanonWithContent | null {
  try {
    if (!slug || typeof slug !== 'string') {
      console.error("getCanonBySlug called with invalid slug:", slug);
      return null;
    }
    
    const doc = getMdxDocumentBySlug("canon", slug);
    if (!doc) {
      console.warn(`No canon entry found for slug: ${slug}`);
      return null;
    }
    
    return fromMdxDocument(doc);
  } catch (error) {
    console.error(`Error fetching canon by slug (${slug}):`, error);
    return null;
  }
}

/**
 * Get all canon entries with content
 */
export function getAllCanon(): CanonWithContent[] {
  try {
    const metas = getAllCanonMeta();
    if (metas.length === 0) return [];
    
    const canonWithContent: CanonWithContent[] = [];
    
    for (const meta of metas) {
      const canon = getCanonBySlug(meta.slug);
      if (canon) {
        canonWithContent.push(canon);
      } else {
        console.warn(`Could not load content for canon: ${meta.slug}`);
      }
    }
    
    return canonWithContent;
  } catch (error) {
    console.error("Error fetching all canon:", error);
    return [];
  }
}

/**
 * Get canon entries by period
 */
export function getCanonByPeriod(period: string): Canon[] {
  try {
    const canonEntries = getAllCanonMeta();
    if (!period || typeof period !== 'string') return [];
    
    const normalizedPeriod = period.toLowerCase().trim();
    
    return canonEntries.filter(canon => {
      const canonPeriod = canon.period?.toLowerCase().trim();
      return canonPeriod === normalizedPeriod;
    });
  } catch (error) {
    console.error(`Error fetching canon by period (${period}):`, error);
    return [];
  }
}

/**
 * Get canon entries by movement
 */
export function getCanonByMovement(movement: string): Canon[] {
  try {
    const canonEntries = getAllCanonMeta();
    if (!movement || typeof movement !== 'string') return [];
    
    const normalizedMovement = movement.toLowerCase().trim();
    
    return canonEntries.filter(canon => {
      const canonMovement = canon.movement?.toLowerCase().trim();
      return canonMovement === normalizedMovement;
    });
  } catch (error) {
    console.error(`Error fetching canon by movement (${movement}):`, error);
    return [];
  }
}

/**
 * Get canon entries by genre
 */
export function getCanonByGenre(genre: string): Canon[] {
  try {
    const canonEntries = getAllCanonMeta();
    if (!genre || typeof genre !== 'string') return [];
    
    const normalizedGenre = genre.toLowerCase().trim();
    
    return canonEntries.filter(canon => {
      return canon.genre?.some(g => g.toLowerCase().trim() === normalizedGenre);
    });
  } catch (error) {
    console.error(`Error fetching canon by genre (${genre}):`, error);
    return [];
  }
}

/**
 * Get canon entries by country
 */
export function getCanonByCountry(country: string): Canon[] {
  try {
    const canonEntries = getAllCanonMeta();
    if (!country || typeof country !== 'string') return [];
    
    const normalizedCountry = country.toLowerCase().trim();
    
    return canonEntries.filter(canon => {
      const canonCountry = canon.country?.toLowerCase().trim();
      return canonCountry === normalizedCountry;
    });
  } catch (error) {
    console.error(`Error fetching canon by country (${country}):`, error);
    return [];
  }
}

/**
 * Get canon entries by language
 */
export function getCanonByLanguage(language: string): Canon[] {
  try {
    const canonEntries = getAllCanonMeta();
    if (!language || typeof language !== 'string') return [];
    
    const normalizedLanguage = language.toLowerCase().trim();
    
    return canonEntries.filter(canon => {
      const canonLanguage = canon.language?.toLowerCase().trim();
      return canonLanguage === normalizedLanguage;
    });
  } catch (error) {
    console.error(`Error fetching canon by language (${language}):`, error);
    return [];
  }
}

/**
 * Get canon entries by category
 */
export function getCanonByCategory(category: string): Canon[] {
  try {
    const canonEntries = getAllCanonMeta();
    if (!category || typeof category !== 'string') return [];
    
    const normalizedCategory = category.toLowerCase().trim();
    
    return canonEntries.filter(canon => {
      const canonCategory = canon.category?.toLowerCase().trim();
      return canonCategory === normalizedCategory;
    });
  } catch (error) {
    console.error(`Error fetching canon by category (${category}):`, error);
    return [];
  }
}

/**
 * Get canon entries by tag
 */
export function getCanonByTag(tag: string): Canon[] {
  try {
    const canonEntries = getAllCanonMeta();
    if (!tag || typeof tag !== 'string') return [];
    
    const normalizedTag = tag.toLowerCase().trim();
    
    return canonEntries.filter(canon => {
      return canon.tags?.some(t => t.toLowerCase().trim() === normalizedTag);
    });
  } catch (error) {
    console.error(`Error fetching canon by tag (${tag}):`, error);
    return [];
  }
}

/**
 * Get featured canon entries
 */
export function getFeaturedCanon(): Canon[] {
  try {
    const canonEntries = getAllCanonMeta();
    return canonEntries.filter(canon => canon.featured === true);
  } catch (error) {
    console.error("Error fetching featured canon:", error);
    return [];
  }
}

/**
 * Get published canon entries only (filter out drafts)
 */
export function getPublishedCanon(): Canon[] {
  try {
    const canonEntries = getAllCanonMeta();
    return canonEntries.filter(canon => 
      canon.draft !== true && 
      canon.status !== "draft" && 
      (canon.published === true || canon.status === "published")
    );
  } catch (error) {
    console.error("Error fetching published canon:", error);
    return [];
  }
}

/**
 * Search canon entries by multiple fields
 */
export function searchCanon(query: string): Canon[] {
  try {
    const canonEntries = getAllCanonMeta();
    const normalizedQuery = query.toLowerCase().trim();
    
    if (!normalizedQuery) return canonEntries;
    
    return canonEntries.filter(canon => {
      // Search in title
      if (canon.title?.toLowerCase().includes(normalizedQuery)) return true;
      
      // Search in original title
      if (canon.originalTitle?.toLowerCase().includes(normalizedQuery)) return true;
      
      // Search in subtitle
      if (canon.subtitle?.toLowerCase().includes(normalizedQuery)) return true;
      
      // Search in description
      if (canon.description?.toLowerCase().includes(normalizedQuery)) return true;
      
      // Search in excerpt
      if (canon.excerpt?.toLowerCase().includes(normalizedQuery)) return true;
      
      // Search in author
      if (canon.author?.toLowerCase().includes(normalizedQuery)) return true;
      
      // Search in translator
      if (canon.translator?.toLowerCase().includes(normalizedQuery)) return true;
      
      // Search in tags
      if (canon.tags?.some(tag => tag.toLowerCase().includes(normalizedQuery))) return true;
      
      // Search in category
      if (canon.category?.toLowerCase().includes(normalizedQuery)) return true;
      
      // Search in period
      if (canon.period?.toLowerCase().includes(normalizedQuery)) return true;
      
      // Search in movement
      if (canon.movement?.toLowerCase().includes(normalizedQuery)) return true;
      
      // Search in genre
      if (canon.genre?.some(g => g.toLowerCase().includes(normalizedQuery))) return true;
      
      // Search in themes
      if (canon.themes?.some(theme => theme.toLowerCase().includes(normalizedQuery))) return true;
      
      return false;
    });
  } catch (error) {
    console.error(`Error searching canon (${query}):`, error);
    return [];
  }
}

/**
 * Get recent canon entries (sorted by date, newest first)
 */
export function getRecentCanon(limit?: number): Canon[] {
  try {
    const canonEntries = getAllCanonMeta();
    
    // Sort by date (newest first), then by title for same dates
    const sorted = canonEntries.sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      
      if (dateB !== dateA) return dateB - dateA;
      
      // Same date, sort alphabetically by title
      return (a.title || '').localeCompare(b.title || '');
    });
    
    return limit && limit > 0 ? sorted.slice(0, limit) : sorted;
  } catch (error) {
    console.error("Error fetching recent canon:", error);
    return [];
  }
}

/**
 * Get all unique periods from canon
 */
export function getAllCanonPeriods(): string[] {
  try {
    const canonEntries = getAllCanonMeta();
    const periods = canonEntries
      .map(canon => canon.period)
      .filter((period): period is string => 
        typeof period === "string" && period.trim().length > 0
      );
    
    // Remove duplicates and sort alphabetically
    return [...new Set(periods)].sort();
  } catch (error) {
    console.error("Error fetching canon periods:", error);
    return [];
  }
}

/**
 * Get all unique movements from canon
 */
export function getAllCanonMovements(): string[] {
  try {
    const canonEntries = getAllCanonMeta();
    const movements = canonEntries
      .map(canon => canon.movement)
      .filter((movement): movement is string => 
        typeof movement === "string" && movement.trim().length > 0
      );
    
    // Remove duplicates and sort alphabetically
    return [...new Set(movements)].sort();
  } catch (error) {
    console.error("Error fetching canon movements:", error);
    return [];
  }
}

/**
 * Get all unique genres from canon
 */
export function getAllCanonGenres(): string[] {
  try {
    const canonEntries = getAllCanonMeta();
    const allGenres = canonEntries
      .flatMap(canon => canon.genre || [])
      .filter((genre): genre is string => typeof genre === "string");
    
    // Remove duplicates and sort alphabetically
    return [...new Set(allGenres)].sort();
  } catch (error) {
    console.error("Error fetching canon genres:", error);
    return [];
  }
}

/**
 * Get all unique countries from canon
 */
export function getAllCanonCountries(): string[] {
  try {
    const canonEntries = getAllCanonMeta();
    const countries = canonEntries
      .map(canon => canon.country)
      .filter((country): country is string => 
        typeof country === "string" && country.trim().length > 0
      );
    
    // Remove duplicates and sort alphabetically
    return [...new Set(countries)].sort();
  } catch (error) {
    console.error("Error fetching canon countries:", error);
    return [];
  }
}

/**
 * Get all unique languages from canon
 */
export function getAllCanonLanguages(): string[] {
  try {
    const canonEntries = getAllCanonMeta();
    const languages = canonEntries
      .map(canon => canon.language)
      .filter((language): language is string => 
        typeof language === "string" && language.trim().length > 0
      );
    
    // Remove duplicates and sort alphabetically
    return [...new Set(languages)].sort();
  } catch (error) {
    console.error("Error fetching canon languages:", error);
    return [];
  }
}

/**
 * Get all unique categories from canon
 */
export function getAllCanonCategories(): string[] {
  try {
    const canonEntries = getAllCanonMeta();
    const categories = canonEntries
      .map(canon => canon.category)
      .filter((category): category is string => 
        typeof category === "string" && category.trim().length > 0
      );
    
    // Remove duplicates and sort alphabetically
    return [...new Set(categories)].sort();
  } catch (error) {
    console.error("Error fetching canon categories:", error);
    return [];
  }
}

/**
 * Get all unique tags from canon
 */
export function getAllCanonTags(): string[] {
  try {
    const canonEntries = getAllCanonMeta();
    const allTags = canonEntries
      .flatMap(canon => canon.tags || [])
      .filter((tag): tag is string => typeof tag === "string");
    
    // Remove duplicates and sort alphabetically
    return [...new Set(allTags)].sort();
  } catch (error) {
    console.error("Error fetching canon tags:", error);
    return [];
  }
}

/**
 * Get all unique authors from canon
 */
export function getAllCanonAuthors(): string[] {
  try {
    const canonEntries = getAllCanonMeta();
    const authors = canonEntries
      .map(canon => canon.author)
      .filter((author): author is string => 
        typeof author === "string" && author.trim().length > 0
      );
    
    // Remove duplicates and sort alphabetically
    return [...new Set(authors)].sort();
  } catch (error) {
    console.error("Error fetching canon authors:", error);
    return [];
  }
}

/**
 * Get all unique translators from canon
 */
export function getAllCanonTranslators(): string[] {
  try {
    const canonEntries = getAllCanonMeta();
    const translators = canonEntries
      .map(canon => canon.translator)
      .filter((translator): translator is string => 
        typeof translator === "string" && translator.trim().length > 0
      );
    
    // Remove duplicates and sort alphabetically
    return [...new Set(translators)].sort();
  } catch (error) {
    console.error("Error fetching canon translators:", error);
    return [];
  }
}

/**
 * Get canon slugs for static generation
 */
export function getAllCanonSlugs(): string[] {
  try {
    const canonEntries = getAllCanonMeta();
    return canonEntries
      .map(canon => canon.slug)
      .filter((slug): slug is string => typeof slug === "string" && slug.length > 0);
  } catch (error) {
    console.error("Error fetching canon slugs:", error);
    return [];
  }
}

/**
 * Get statistics about canon entries
 */
export function getCanonStats(): {
  total: number;
  published: number;
  drafts: number;
  featured: number;
  byPeriod: Record<string, number>;
  byMovement: Record<string, number>;
  byCountry: Record<string, number>;
  byLanguage: Record<string, number>;
  byYear: Record<string, number>;
} {
  try {
    const canonEntries = getAllCanonMeta();
    
    const stats = {
      total: canonEntries.length,
      published: canonEntries.filter(c => c.published === true || c.status === "published").length,
      drafts: canonEntries.filter(c => c.draft === true || c.status === "draft").length,
      featured: canonEntries.filter(c => c.featured === true).length,
      byPeriod: {} as Record<string, number>,
      byMovement: {} as Record<string, number>,
      byCountry: {} as Record<string, number>,
      byLanguage: {} as Record<string, number>,
      byYear: {} as Record<string, number>,
    };
    
    canonEntries.forEach(canon => {
      // Count by period
      if (canon.period) {
        stats.byPeriod[canon.period] = (stats.byPeriod[canon.period] || 0) + 1;
      }
      
      // Count by movement
      if (canon.movement) {
        stats.byMovement[canon.movement] = (stats.byMovement[canon.movement] || 0) + 1;
      }
      
      // Count by country
      if (canon.country) {
        stats.byCountry[canon.country] = (stats.byCountry[canon.country] || 0) + 1;
      }
      
      // Count by language
      if (canon.language) {
        stats.byLanguage[canon.language] = (stats.byLanguage[canon.language] || 0) + 1;
      }
      
      // Count by year
      if (canon.date) {
        const year = new Date(canon.date).getFullYear().toString();
        stats.byYear[year] = (stats.byYear[year] || 0) + 1;
      }
    });
    
    return stats;
  } catch (error) {
    console.error("Error fetching canon stats:", error);
    return {
      total: 0,
      published: 0,
      drafts: 0,
      featured: 0,
      byPeriod: {},
      byMovement: {},
      byCountry: {},
      byLanguage: {},
      byYear: {},
    };
  }
}

// ---------------------------------------------------------------------------
// DEFAULT EXPORT
// ---------------------------------------------------------------------------

const canonData = {
  // Core functions
  getAllCanonMeta,
  getCanonBySlug,
  getAllCanon,
  
  // Filter functions
  getCanonByPeriod,
  getCanonByMovement,
  getCanonByGenre,
  getCanonByCountry,
  getCanonByLanguage,
  getCanonByCategory,
  getCanonByTag,
  getFeaturedCanon,
  getPublishedCanon,
  searchCanon,
  getRecentCanon,
  
  // List functions
  getAllCanonPeriods,
  getAllCanonMovements,
  getAllCanonGenres,
  getAllCanonCountries,
  getAllCanonLanguages,
  getAllCanonCategories,
  getAllCanonTags,
  getAllCanonAuthors,
  getAllCanonTranslators,
  getAllCanonSlugs,
  
  // Stats
  getCanonStats,
  
  // Utility functions
  canonToContentMeta,
  canonToContentEntry,
};

export default canonData;