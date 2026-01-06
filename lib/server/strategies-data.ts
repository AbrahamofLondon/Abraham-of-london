// lib/server/strategies-data.ts
import {
  getMdxCollectionMeta,
  getMdxDocumentBySlug,
  type MdxMeta,
  type MdxDocument,
} from "@/lib/server/mdx-collections";
import type { Strategy } from "@/types/index";

export type StrategyWithContent = Strategy & {
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

function fromMdxMeta(meta: MdxMeta): Strategy {
  const m = meta as any;
  
  const slug = safeString(m.slug) || safeString(m._raw?.flattenedPath) || "";
  
  return {
    // Required
    slug,
    title: safeString(m.title) || "Untitled Strategy",
    
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
    
    // Strategy-specific
    strategyType: safeString(m.strategyType) as any,
    framework: safeString(m.framework),
    methodology: safeString(m.methodology),
    scope: safeString(m.scope) as any,
    scale: safeString(m.scale) as any,
    timeframe: safeString(m.timeframe) as any,
    implementationTime: safeString(m.implementationTime),
    kpis: safeArray(m.kpis),
    successMetrics: safeArray(m.successMetrics),
    roi: safeString(m.roi),
    steps: safeArray(m.steps),
    phases: safeArray(m.phases),
    milestones: safeArray(m.milestones),
    risks: safeArray(m.risks),
    challenges: safeArray(m.challenges),
    mitigation: safeArray(m.mitigation),
    tools: safeArray(m.tools),
    templates: safeArray(m.templates),
    software: safeArray(m.software),
    
    // System
    _raw: m._raw,
    url: safeString(m.url),
    type: "strategy",
  };
}

function fromMdxDocument(doc: MdxDocument): StrategyWithContent {
  const { content, ...rest } = doc as any;
  const meta = fromMdxMeta(rest);
  
  return {
    ...meta,
    content: typeof content === "string" ? content : "",
  };
}

export function getAllStrategiesMeta(): Strategy[] {
  try {
    const metas = getMdxCollectionMeta("strategies");
    return metas.map(m => fromMdxMeta(m));
  } catch (error) {
    console.error("[strategies-data] Error getting all strategies meta:", error);
    return [];
  }
}

export function getStrategyBySlug(slug: string): StrategyWithContent | null {
  try {
    const doc = getMdxDocumentBySlug("strategies", slug);
    if (!doc) {
      console.warn(`[strategies-data] Strategy not found: ${slug}`);
      return null;
    }
    
    return fromMdxDocument(doc);
  } catch (error) {
    console.error(`[strategies-data] Error getting strategy ${slug}:`, error);
    return null;
  }
}

export function getStrategiesByType(type: string): Strategy[] {
  try {
    return getAllStrategiesMeta()
      .filter(s => !s.draft && s.strategyType?.toLowerCase() === type.toLowerCase());
  } catch (error) {
    console.error(`[strategies-data] Error getting strategies by type ${type}:`, error);
    return [];
  }
}

export function getFeaturedStrategies(): Strategy[] {
  try {
    return getAllStrategiesMeta()
      .filter(s => s.featured && !s.draft);
  } catch (error) {
    console.error("[strategies-data] Error getting featured strategies:", error);
    return [];
  }
}

export default {
  getAllStrategiesMeta,
  getStrategyBySlug,
  getStrategiesByType,
  getFeaturedStrategies,
};

