// lib/server/canon-data.ts
import { allCanons, type CanonDocument } from "../contentlayer-helper";
import type { Canon } from "@/types/index";

export type CanonWithContent = Canon & {
  content: string;
  body?: {
    code: string;
    raw: string;
  };
};

// Helper to convert CanonDocument to Canon
function fromCanonDocument(doc: CanonDocument): Canon {
  return {
    // Core
    slug: doc.slug,
    title: doc.title || "Untitled Canon",
    
    // Content
    description: doc.description,
    excerpt: doc.excerpt,
    
    // Metadata
    date: doc.date,
    author: doc.author,
    category: doc.category,
    tags: Array.isArray(doc.tags) ? doc.tags : [],
    featured: doc.featured === true,
    
    // Visual
    coverImage: doc.coverImage,
    
    // State
    draft: doc.draft === true,
    published: doc.published === true,
    status: doc.status,
    
    // Access
    accessLevel: doc.accessLevel || "public",
    lockMessage: doc.lockMessage,
    
    // Canon-specific
    canonType: doc.canonType as any,
    origin: doc.origin,
    source: doc.source,
    attributedTo: doc.attributedTo,
    era: doc.era,
    domain: Array.isArray(doc.domain) ? doc.domain : [],
    context: Array.isArray(doc.context) ? doc.context : [],
    exceptions: Array.isArray(doc.exceptions) ? doc.exceptions : [],
    strength: doc.strength as any,
    evidence: doc.evidence,
    counterpoints: Array.isArray(doc.counterpoints) ? doc.counterpoints : [],
    relatedCanons: Array.isArray(doc.relatedCanons) ? doc.relatedCanons : [],
    derivedFrom: doc.derivedFrom,
    variations: Array.isArray(doc.variations) ? doc.variations : [],
    importance: doc.importance,
    frequency: doc.frequency,
    memorability: doc.memorability,
    icon: doc.icon,
    color: doc.color,
    symbol: doc.symbol,
    
    // Additional
    volumeNumber: doc.volumeNumber,
    order: doc.order,
    
    // System
    _raw: doc._raw,
    _id: doc._id,
    url: doc.url,
    type: "canon",
    
    // Content
    content: doc.body?.raw || "",
    body: doc.body,
  };
}

export function getAllCanon(options?: { includeDrafts?: boolean }): Canon[] {
  try {
    const includeDrafts = options?.includeDrafts || false;
    
    return allCanons
      .filter(canon => includeDrafts || !canon.draft)
      .map(fromCanonDocument)
      .sort((a, b) => {
        // Sort by order if available
        if (typeof a.order === "number" && typeof b.order === "number") {
          if (a.order !== b.order) return a.order - b.order;
        }
        
        // Then by date
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return dateB - dateA;
      });
  } catch (error) {
    console.error("[canon-data] Error getting all canon:", error);
    return [];
  }
}

export function getCanonBySlug(slug: string): CanonWithContent | null {
  try {
    const normalizedSlug = slug.toLowerCase().trim();
    const doc = allCanons.find(c => c.slug.toLowerCase() === normalizedSlug);
    
    if (!doc) {
      console.warn(`[canon-data] Canon not found: ${slug}`);
      return null;
    }
    
    return fromCanonDocument(doc) as CanonWithContent;
  } catch (error) {
    console.error(`[canon-data] Error getting canon ${slug}:`, error);
    return null;
  }
}

export function getFeaturedCanon(): Canon[] {
  try {
    return getAllCanon()
      .filter(c => c.featured);
  } catch (error) {
    console.error("[canon-data] Error getting featured canon:", error);
    return [];
  }
}

export function getCanonVolumes(): Canon[] {
  try {
    return getAllCanon()
      .filter(c => c.volumeNumber || c.order);
  } catch (error) {
    console.error("[canon-data] Error getting canon volumes:", error);
    return [];
  }
}

// Helper functions for specific canon documents
export function getCanonCampaign(): CanonWithContent | null {
  return getCanonBySlug("canon-campaign");
}

export function getCanonMasterIndex(): CanonWithContent | null {
  return getCanonBySlug("canon-master-index-preview");
}

export function getCanonVolumeX(): CanonWithContent | null {
  return getCanonBySlug("volume-x-the-arc-of-future-civilisation");
}

export default {
  getAllCanon,
  getCanonBySlug,
  getFeaturedCanon,
  getCanonVolumes,
  getCanonCampaign,
  getCanonMasterIndex,
  getCanonVolumeX,
};