// lib/server/downloads-data.ts
import {
  getMdxCollectionMeta,
  getMdxDocumentBySlug,
  type MdxMeta,
  type MdxDocument,
} from "@/lib/server/mdx-collections";
import type { Download } from "@/types/index";

export type DownloadWithContent = Download & {
  content: string;
};

// Safe converters (same pattern as posts)
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

function fromMdxMeta(meta: MdxMeta): Download {
  const m = meta as any;
  
  const slug = safeString(m.slug) || safeString(m._raw?.flattenedPath) || "";
  
  return {
    // Required
    slug,
    title: safeString(m.title) || "Untitled Download",
    
    // Content
    description: safeString(m.description) || safeString(m.excerpt),
    excerpt: safeString(m.excerpt) || safeString(m.description),
    
    // Metadata
    date: safeString(m.date),
    author: safeString(m.author),
    category: safeString(m.category),
    tags: safeArray(m.tags),
    featured: m.featured === true,
    
    // Visual
    coverImage: safeString(m.coverImage) || safeString(m.image),
    
    // State
    draft: m.draft === true,
    published: m.published === true,
    
    // Download-specific
    fileName: safeString(m.fileName),
    fileSize: safeString(m.fileSize) || safeNumber(m.fileSize)?.toString(),
    fileFormat: safeString(m.fileFormat),
    fileUrl: safeString(m.fileUrl),
    downloadUrl: safeString(m.downloadUrl),
    version: safeString(m.version),
    versionDate: safeString(m.versionDate),
    changelog: safeArray(m.changelog),
    requirements: safeArray(m.requirements),
    compatibility: safeArray(m.compatibility),
    systemRequirements: safeString(m.systemRequirements),
    license: safeString(m.license),
    licenseUrl: safeString(m.licenseUrl),
    termsOfUse: safeString(m.termsOfUse),
    useCases: safeArray(m.useCases),
    applications: safeArray(m.applications),
    industries: safeArray(m.industries),
    framework: safeString(m.framework),
    dependencies: safeArray(m.dependencies),
    installation: safeString(m.installation),
    supportEmail: safeString(m.supportEmail),
    documentationUrl: safeString(m.documentationUrl),
    tutorialUrl: safeString(m.tutorialUrl),
    
    // System
    _raw: m._raw,
    url: safeString(m.url),
    type: "download",
  };
}

function fromMdxDocument(doc: MdxDocument): DownloadWithContent {
  const { content, ...rest } = doc as any;
  const meta = fromMdxMeta(rest);
  
  return {
    ...meta,
    content: typeof content === "string" ? content : "",
  };
}

export function getAllDownloadsMeta(): Download[] {
  try {
    const metas = getMdxCollectionMeta("downloads");
    return metas.map(m => fromMdxMeta(m));
  } catch (error) {
    console.error("[downloads-data] Error getting all downloads meta:", error);
    return [];
  }
}

export function getDownloadBySlug(slug: string): DownloadWithContent | null {
  try {
    const doc = getMdxDocumentBySlug("downloads", slug);
    if (!doc) {
      console.warn(`[downloads-data] Download not found: ${slug}`);
      return null;
    }
    
    return fromMdxDocument(doc);
  } catch (error) {
    console.error(`[downloads-data] Error getting download ${slug}:`, error);
    return null;
  }
}

export function getFeaturedDownloads(): Download[] {
  try {
    return getAllDownloadsMeta()
      .filter(d => d.featured && !d.draft);
  } catch (error) {
    console.error("[downloads-data] Error getting featured downloads:", error);
    return [];
  }
}

export default {
  getAllDownloadsMeta,
  getDownloadBySlug,
  getFeaturedDownloads,
};

