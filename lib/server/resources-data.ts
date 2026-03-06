// lib/server/resources-data.ts
import "server-only";

import {
  getMdxCollectionMeta,
  getMdxDocumentBySlug,
  type MdxMeta,
  type MdxDocument,
} from "@/lib/server/mdx-collections";
import type { Resource } from "@/types/index";

export type ResourceWithContent = Resource & { content: string };

// Safe converters
function safeString(value: any): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}
function safeArray(value: any): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value.filter((item) => typeof item === "string");
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
    slug,
    title: safeString(m.title) || "Untitled Resource",

    description: safeString(m.description) || safeString(m.excerpt),
    excerpt: safeString(m.excerpt) || safeString(m.description),

    date: safeString(m.date),
    author: safeString(m.author),
    category: safeString(m.category),
    tags: safeArray(m.tags),
    featured: safeBoolean(m.featured),

    coverImage: safeString(m.coverImage) || safeString(m.image),

    draft: safeBoolean(m.draft),
    published: m.published === undefined ? true : safeBoolean(m.published),

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

    _raw: m._raw,
    url: safeString(m.url),
    type: "resource",
  } as any;
}

function fromMdxDocument(doc: MdxDocument): ResourceWithContent {
  const { content, ...rest } = doc as any;
  const meta = fromMdxMeta(rest);
  return { ...(meta as any), content: typeof content === "string" ? content : "" };
}

export async function getAllResourcesMeta(): Promise<Resource[]> {
  try {
    const metas = await getMdxCollectionMeta("resources");
    return (metas || []).map((m) => fromMdxMeta(m));
  } catch (error) {
    console.error("[resources-data] Error getting all resources meta:", error);
    return [];
  }
}

export async function getResourceBySlug(slug: string): Promise<ResourceWithContent | null> {
  try {
    const doc = await getMdxDocumentBySlug("resources", slug);
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

export async function getResourcesByType(type: string): Promise<Resource[]> {
  try {
    const all = await getAllResourcesMeta();
    const target = String(type || "").toLowerCase().trim();
    return all.filter((r: any) => !r?.draft && String(r?.resourceType || "").toLowerCase() === target);
  } catch (error) {
    console.error(`[resources-data] Error getting resources by type ${type}:`, error);
    return [];
  }
}

export async function getFeaturedResources(): Promise<Resource[]> {
  try {
    const all = await getAllResourcesMeta();
    return all.filter((r: any) => r?.featured && !r?.draft);
  } catch (error) {
    console.error("[resources-data] Error getting featured resources:", error);
    return [];
  }
}

const resourcesDataApi = {
  getAllResourcesMeta,
  getResourceBySlug,
  getResourcesByType,
  getFeaturedResources,
};

export default resourcesDataApi;