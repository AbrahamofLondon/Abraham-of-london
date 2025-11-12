// lib/resources.ts - PRODUCTION SAFE VERSION
import allBooks from "contentlayer/generated";

// Type-safe fallback for Resource type
interface SafeResource {
  _id: string;
  title: string;
  slug: string;
  type: string;
  url: string;
  [key: string]: any; // Allow for other fields
}

/**
 * Safely get all resources with comprehensive error handling
 */
export function getAllResources(): SafeResource[] {
  try {
    // Check if ContentLayer data is available
    if (typeof allResources === 'undefined') {
      console.warn('⚠️ ContentLayer resources data is undefined - returning empty array');
      return [];
    }

    // Ensure it's an array
    if (!Array.isArray(allResources)) {
      console.error('❌ ContentLayer resources is not an array:', typeof allResources);
      return [];
    }

    // Validate and sanitize each resource
    const safeResources = allResources.filter((resource): resource is SafeResource => {
      // Basic validation - ensure resource has required fields
      const isValid = resource && 
                     typeof resource === 'object' &&
                     typeof resource._id === 'string' &&
                     typeof resource.title === 'string' &&
                     typeof resource.slug === 'string' &&
                     typeof resource.type === 'string' &&
                     typeof resource.url === 'string';

      if (!isValid) {
        console.warn('🚨 Filtering out invalid resource:', resource);
      }

      return isValid;
    });

    // Log for monitoring (remove in production if too verbose)
    if (safeResources.length !== allResources.length) {
      console.warn(`🔄 Filtered ${allResources.length - safeResources.length} invalid resources`);
    }

    return safeResources;

  } catch (error) {
    console.error('💥 Critical error in getAllResources:', error);
    // Return empty array to prevent build failures
    return [];
  }
}

/**
 * Safely get a resource by slug with fallbacks
 */
export function getResourceBySlug(slug: string): SafeResource | null {
  try {
    // Validate input
    if (!slug || typeof slug !== 'string') {
      console.warn('⚠️ Invalid slug provided to getResourceBySlug:', slug);
      return null;
    }

    const resources = getAllResources();
    const resource = resources.find(resource => resource.slug === slug);

    if (!resource) {
      console.warn(`🔍 Resource not found for slug: "${slug}"`);
      return null;
    }

    return resource;

  } catch (error) {
    console.error(`💥 Error finding resource with slug "${slug}":`, error);
    return null;
  }
}

/**
 * Get resources by type with validation
 */
export function getResourcesByType(type: string): SafeResource[] {
  try {
    if (!type || typeof type !== 'string') {
      console.warn('⚠️ Invalid type provided to getResourcesByType:', type);
      return [];
    }

    return getAllResources().filter(resource => 
      resource.type?.toLowerCase() === type.toLowerCase()
    );

  } catch (error) {
    console.error(`💥 Error getting resources by type "${type}":`, error);
    return [];
  }
}

/**
 * Get all unique resource types
 */
export function getAllResourceTypes(): string[] {
  try {
    const resources = getAllResources();
    const types = resources
      .map(resource => resource.type)
      .filter((type): type is string => typeof type === 'string' && type.length > 0);

    return [...new Set(types)]; // Remove duplicates

  } catch (error) {
    console.error('💥 Error getting resource types:', error);
    return [];
  }
}

/**
 * Search resources with safe fallbacks
 */
export function searchResources(query: string): SafeResource[] {
  try {
    if (!query || typeof query !== 'string') {
      return [];
    }

    const searchTerm = query.toLowerCase();
    return getAllResources().filter(resource =>
      resource.title?.toLowerCase().includes(searchTerm) ||
      resource.slug?.toLowerCase().includes(searchTerm) ||
      resource.type?.toLowerCase().includes(searchTerm)
    );

  } catch (error) {
    console.error(`💥 Error searching resources with query "${query}":`, error);
    return [];
  }
}

// Export types for use in other files
export type { SafeResource as Resource };