// lib/resources.ts
// Resources data facade

import { getAllResourcesMeta } from "@/lib/server/resources-data";

// Type definitions
export interface ResourceMeta {
  slug: string;
  title: string;
  description?: string;
  subtitle?: string;
  excerpt?: string;
  date?: string;
  coverImage?: string;
  tags?: string[];
  featured?: boolean;
  draft?: boolean;
  published?: boolean;
  status?: string;
  author?: string | { name: string; [key: string]: any } | null;
  category?: string;
  // Resource-specific fields
  resourceType?: string;
  applications?: string[];
  fileSize?: string;
  downloadUrl?: string;
  [key: string]: any;
}

export type Resource = ResourceMeta & {
  content?: string;
  // Additional resource-specific content fields
  body?: {
    raw?: string;
  };
};

export type ResourceFieldKey = keyof ResourceMeta;

/**
 * Get all resources
 */
export function getAllResources(): ResourceMeta[] {
  try {
    const resources = getAllResourcesMeta();
    if (!Array.isArray(resources)) return [];
    
    // Ensure all resources have required fields
    return resources.map(resource => {
      // Ensure coverImage is string or undefined
      let coverImage: string | undefined;
      if (resource.coverImage) {
        if (typeof resource.coverImage === 'string') {
          coverImage = resource.coverImage;
        } else if (typeof resource.coverImage === 'object' && resource.coverImage !== null) {
          coverImage = (resource.coverImage as any).src;
        }
      }
      
      // Create a clean object without slug and title to avoid duplicates
      const { slug, title, ...rest } = resource;
      
      return {
        slug: slug || '',
        title: title || 'Untitled Resource',
        description: rest.description,
        subtitle: rest.subtitle,
        excerpt: rest.excerpt,
        date: rest.date,
        coverImage: coverImage,
        tags: rest.tags || [],
        featured: Boolean(rest.featured),
        draft: Boolean(rest.draft),
        published: rest.published !== false,
        status: rest.status,
        author: rest.author,
        category: rest.category,
        resourceType: rest.resourceType,
        applications: rest.applications,
        fileSize: rest.fileSize,
        downloadUrl: rest.downloadUrl,
        // Preserve other fields from rest
        ...rest,
      };
    });
  } catch {
    return [];
  }
}

/**
 * Get resource by slug
 */
export function getResourceBySlug(slug: string): Resource | null {
  try {
    const resources = getAllResources();
    const resourceMeta = resources.find(r => r.slug === slug);
    
    if (!resourceMeta) return null;
    
    // Convert ResourceMeta to Resource (add content field)
    return {
      ...resourceMeta,
      content: '', // You might want to fetch actual content here
    };
  } catch {
    return null;
  }
}

/**
 * Get resource slugs
 */
export function getResourceSlugs(): string[] {
  const resources = getAllResources();
  return resources.map(r => r.slug).filter(Boolean);
}

/**
 * Get public resources
 */
export function getPublicResources(): ResourceMeta[] {
  const resources = getAllResources();
  return resources.filter(resource => {
    const isDraft = resource.draft === true;
    const isNotPublished = resource.published === false;
    const isStatusDraft = resource.status === 'draft';
    const isStatusArchived = resource.status === 'archived';
    const isStatusPrivate = resource.status === 'private';
    const isStatusScheduled = resource.status === 'scheduled';
    
    return !(isDraft || isNotPublished || isStatusDraft || 
             isStatusArchived || isStatusPrivate || isStatusScheduled);
  });
}

/**
 * Get resources by type
 */
export function getResourcesByType(type: string): ResourceMeta[] {
  const resources = getPublicResources();
  return resources.filter(r => r.resourceType === type);
}

/**
 * Get resources by application
 */
export function getResourcesByApplication(application: string): ResourceMeta[] {
  const resources = getPublicResources();
  return resources.filter(r => 
    r.applications?.some(app => app.toLowerCase() === application.toLowerCase())
  );
}

/**
 * Get featured resources
 */
export function getFeaturedResources(limit?: number): ResourceMeta[] {
  const resources = getPublicResources();
  const featured = resources.filter(r => r.featured === true);
  return limit ? featured.slice(0, limit) : featured;
}

/**
 * Get resources sorted by date (newest first)
 */
export function getResourcesByDate(): ResourceMeta[] {
  const resources = getPublicResources();
  return resources.sort((a, b) => {
    const dateA = a.date ? new Date(a.date).getTime() : 0;
    const dateB = b.date ? new Date(b.date).getTime() : 0;
    return dateB - dateA; // Newest first
  });
}
