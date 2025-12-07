// lib/server/prints-data.ts
import {
  getMdxCollectionMeta,
  getMdxDocumentBySlug,
  type MdxMeta,
  type MdxDocument,
} from "@/lib/server/mdx-collections";
import type { Print } from "@/types/index";

export type PrintWithContent = Print & {
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

function fromMdxMeta(meta: MdxMeta): Print {
  const m = meta as any;
  
  const slug = safeString(m.slug) || safeString(m._raw?.flattenedPath) || "";
  
  return {
    // Required
    slug,
    title: safeString(m.title) || "Untitled Print",
    
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
    
    // Print-specific
    dimensions: safeString(m.dimensions),
    material: safeString(m.material),
    finish: safeString(m.finish),
    weight: safeString(m.weight),
    editionNumber: safeString(m.editionNumber) || safeNumber(m.editionNumber)?.toString(),
    editionSize: safeNumber(m.editionSize),
    limitedEdition: safeBoolean(m.limitedEdition),
    signed: safeBoolean(m.signed),
    numbered: safeBoolean(m.numbered),
    printMethod: safeString(m.printMethod),
    paperType: safeString(m.paperType),
    inkType: safeString(m.inkType),
    price: safeString(m.price) || safeNumber(m.price)?.toString(),
    currency: safeString(m.currency),
    salePrice: safeString(m.salePrice) || safeNumber(m.salePrice)?.toString(),
    inStock: safeBoolean(m.inStock),
    stockQuantity: safeNumber(m.stockQuantity),
    shippingWeight: safeString(m.shippingWeight),
    shippingCost: safeString(m.shippingCost) || safeNumber(m.shippingCost)?.toString(),
    shipsFrom: safeString(m.shipsFrom),
    artist: safeString(m.artist),
    yearCreated: safeString(m.yearCreated) || safeNumber(m.yearCreated)?.toString(),
    style: safeString(m.style),
    medium: safeString(m.medium),
    frame: safeString(m.frame),
    orientation: safeString(m.orientation) as any,
    
    // System
    _raw: m._raw,
    url: safeString(m.url),
    type: "print",
  };
}

function fromMdxDocument(doc: MdxDocument): PrintWithContent {
  const { content, ...rest } = doc as any;
  const meta = fromMdxMeta(rest);
  
  return {
    ...meta,
    content: typeof content === "string" ? content : "",
  };
}

export function getAllPrintsMeta(): Print[] {
  try {
    const metas = getMdxCollectionMeta("prints");
    return metas.map(m => fromMdxMeta(m));
  } catch (error) {
    console.error("[prints-data] Error getting all prints meta:", error);
    return [];
  }
}

export function getPrintBySlug(slug: string): PrintWithContent | null {
  try {
    const doc = getMdxDocumentBySlug("prints", slug);
    if (!doc) {
      console.warn(`[prints-data] Print not found: ${slug}`);
      return null;
    }
    
    return fromMdxDocument(doc);
  } catch (error) {
    console.error(`[prints-data] Error getting print ${slug}:`, error);
    return null;
  }
}

export function getFeaturedPrints(): Print[] {
  try {
    return getAllPrintsMeta()
      .filter(p => p.featured && !p.draft && p.inStock !== false);
  } catch (error) {
    console.error("[prints-data] Error getting featured prints:", error);
    return [];
  }
}

export function getAvailablePrints(): Print[] {
  try {
    return getAllPrintsMeta()
      .filter(p => !p.draft && (p.inStock === true || p.stockQuantity > 0));
  } catch (error) {
    console.error("[prints-data] Error getting available prints:", error);
    return [];
  }
}

export default {
  getAllPrintsMeta,
  getPrintBySlug,
  getFeaturedPrints,
  getAvailablePrints,
};