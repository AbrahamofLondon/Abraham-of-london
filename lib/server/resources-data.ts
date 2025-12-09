// lib/server/resources-data.ts
import {
  getMdxCollectionMeta,
  getMdxDocumentBySlug,
  type MdxMeta,
  type MdxDocument,
} from "@/lib/server/mdx-collections";
import type { Resource } from "@/types/index";

export type ResourceWithContent = Resource & {
  content: string;
};

// Safe converters
function safeString(value: any): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function safeArray(value: any): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value.filter(item => typeof item === "string");
}

function safeNumber(value: any): number | undefined {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? undefined : parsed;
  }
  return undefined;
}

function safeBoolean(value: any): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const lower = value.toLowerCase().trim();
    return lower === "true" || lower === "yes" || lower === "1";
  }
  return false;
}

function fromMdxMeta(meta: MdxMeta): Resource {
  const m = meta as any;
  
  const slug = safeString(m.slug) || safeString(m._raw?.flattenedPath) || "";
  
  return {
    // Required
    slug,
    title: safeString(m.title) || "Untitled Resource",
    
    // Content
    description: safeString(m.description) || safeString(m.excerpt),
    excerpt: safeString(m.excerpt) || safeString(m.description),
    
    // Metadata
    date: safeString(m.date),
    author: safeString(m.author),
    category: safeString(m.category),
    tags: safeArray(m.tags),
    featured: safeBoolean(m.featured),
    
    // Visual
    coverImage: safeString(m.coverImage) || safeString(m.image),
    
    // State
    draft: safeBoolean(m.draft),
    published: safeBoolean(m.published),
    
    // Resource-specific
    resourceType: safeString(m.resourceType) as any,
    applications: safeArray(m.applications),
    useCases: safeArray(m.useCases),
    industries: safeArray(m.industries),
    format: safeString(m.format) as any,
    complexity: safeString(m.complexity) as any,
    timeRequired: safeString(m.timeRequired),
    version: safeString(m.version),
    lastUpdated: safeString(m.lastUpdated),
    prerequisites: safeArray(m.prerequisites),
    toolsRequired: safeArray(m.toolsRequired),
    deliverables: safeArray(m.deliverables),
    outcomes: safeArray(m.outcomes),
    instructions: safeString(m.instructions),
    examples: safeArray(m.examples),
    tips: safeArray(m.tips),
    
    // System
    _raw: m._raw,
    url: safeString(m.url),
    type: "resource",
  };
}

function fromMdxDocument(doc: MdxDocument): ResourceWithContent {
  const { content, ...rest } = doc as any;
  const meta = fromMdxMeta(rest);
  
  return {
    ...meta,
    content: typeof content === "string" ? content : "",
  };
}

export function getAllResourcesMeta(): Resource[] {
  try {
    const metas = getMdxCollectionMeta("resources");
    return metas.map(m => fromMdxMeta(m));
  } catch (error) {
    console.error("[resources-data] Error getting all resources meta:", error);
    return [];
  }
}

export function getResourceBySlug(slug: string): ResourceWithContent | null {
  try {
    const doc = getMdxDocumentBySlug("resources", slug);
    if (!doc) {
      console.warn(`[resources-data] Resource not found: ${slug}`);
      return null;
    }
    
    return fromMdxDocument(doc);
  } catch (error) {
    console.error(`[resources-data] Error getting resource ${slug}:`, error);
    return null;
  }
}

export function getResourcesByType(type: string): Resource[] {
  try {
    return getAllResourcesMeta()
      .filter(r => !r.draft && r.resourceType?.toLowerCase() === type.toLowerCase());
  } catch (error) {
    console.error(`[resources-data] Error getting resources by type ${type}:`, error);
    return [];
  }
}

export function getFeaturedResources(): Resource[] {
  try {
    return getAllResourcesMeta()
      .filter(r => r.featured && !r.draft);
  } catch (error) {
    console.error("[resources-data] Error getting featured resources:", error);
    return [];
  }
}

export default {
  getAllResourcesMeta,
  getResourceBySlug,
  getResourcesByType,
  getFeaturedResources,
};