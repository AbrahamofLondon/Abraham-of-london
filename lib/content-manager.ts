// lib/content-manager.ts - FIXED WITH OPTIONAL TITLE
import { safeArraySlice } from "@/lib/utils/safe";
import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';

// Types for our content structure
export interface ContentFile {
  slug: string;
  title?: string; // Changed from required to optional
  date?: string;
  author?: string;
  description?: string;
  excerpt?: string;
  coverImage?: string;
  category?: string;
  tags?: string[];
  featured?: boolean;
  published?: boolean;
  draft?: boolean;
  content?: string;
  url?: string;
  [key: string]: any; // Allow additional frontmatter fields
}

export interface ContentCollection {
  name: string;
  directory: string;
  route: string;
}

// Content collections configuration
const CONTENT_COLLECTIONS: ContentCollection[] = [
  { name: 'posts', directory: 'blog', route: '/blog' },
  { name: 'books', directory: 'books', route: '/books' },
  { name: 'canon', directory: 'canon', route: '/canon' },
  { name: 'downloads', directory: 'downloads', route: '/downloads' },
  { name: 'shorts', directory: 'shorts', route: '/shorts' },
  { name: 'events', directory: 'events', route: '/events' },
  { name: 'prints', directory: 'prints', route: '/prints' },
  { name: 'resources', directory: 'resources', route: '/resources' },
  { name: 'strategies', directory: 'strategies', route: '/strategies' },
];

// Get content directory path
function getContentDir(): string {
  return path.join(process.cwd(), 'content');
}

// Safely read directory contents
async function safeReadDir(dirPath: string): Promise<string[]> {
  try {
    const files = await fs.readdir(dirPath);
    return files.filter(file => 
      file.endsWith('.md') || 
      file.endsWith('.mdx') ||
      file.endsWith('.json')
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn(`⚠️ Could not read directory: ${dirPath}`, errorMessage);
    return [];
  }
}

// Parse content file
async function parseContentFile(
  filePath: string, 
  fileName: string, 
  collection: ContentCollection
): Promise<ContentFile | null> {
  try {
    const fileContent = await fs.readFile(filePath, 'utf8');
    const extension = path.extname(fileName);
    const slug = fileName.replace(/\.(md|mdx|json)$/, '');
    
    if (extension === '.json') {
      // Handle JSON files
      const data = JSON.parse(fileContent);
      return {
        title: data.title || 'Untitled', // Provide default title
        ...data,
        slug,
        url: `${collection.route}/${slug}`,
      };
    } else {
      // Handle MD/MDX files
      const { data, content } = matter(fileContent);
      
      return {
        title: data.title || 'Untitled', // Provide default title
        ...data,
        slug,
        content,
        url: `${collection.route}/${slug}`,
      };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn(`⚠️ Could not parse file: ${filePath}`, errorMessage);
    return null;
  }
}

// Get all content from a specific collection
export async function getAllFromCollection(
  collectionName: string
): Promise<ContentFile[]> {
  const collection = CONTENT_COLLECTIONS.find(c => c.name === collectionName);
  if (!collection) {
    console.warn(`⚠️ Collection not found: ${collectionName}`);
    return [];
  }
  
  const collectionDir = path.join(getContentDir(), collection.directory);
  const files = await safeReadDir(collectionDir);
  
  const contentPromises = files.map(async (file) => {
    const filePath = path.join(collectionDir, file);
    return parseContentFile(filePath, file, collection);
  });
  
  const contentItems = await Promise.all(contentPromises);
  
  // Filter out null items and sort by date (newest first)
  return contentItems
    .filter((item): item is ContentFile => item !== null)
    .filter(item => item.published !== false && item.draft !== true)
    .sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateB - dateA;
    });
}

// Get single content item by slug
export async function getContentBySlug(
  collectionName: string,
  slug: string
): Promise<ContentFile | null> {
  const collection = CONTENT_COLLECTIONS.find(c => c.name === collectionName);
  if (!collection) {
    console.warn(`⚠️ Collection not found: ${collectionName}`);
    return null;
  }
  
  const collectionDir = path.join(getContentDir(), collection.directory);
  const files = await safeReadDir(collectionDir);
  
  const file = files.find(f => 
    f.replace(/\.(md|mdx|json)$/, '') === slug
  );
  
  if (!file) {
    console.warn(`⚠️ File not found: ${slug} in ${collectionName}`);
    return null;
  }
  
  const filePath = path.join(collectionDir, file);
  return parseContentFile(filePath, file, collection);
}

// Get all content across all collections
export async function getAllContent(): Promise<Record<string, ContentFile[]>> {
  const result: Record<string, ContentFile[]> = {};
  
  for (const collection of CONTENT_COLLECTIONS) {
    result[collection.name] = await getAllFromCollection(collection.name);
  }
  
  return result;
}

// Get featured content
export async function getFeaturedContent(
  collectionName?: string,
  limit: number = 5
): Promise<ContentFile[]> {
  const collections = collectionName 
    ? [collectionName] 
    : CONTENT_COLLECTIONS.map(c => c.name);
  
  const allFeatured: ContentFile[] = [];
  
  for (const col of collections) {
    const items = await getAllFromCollection(col);
    const featured = items
      .filter(item => item.featured === true)
      safeArraySlice(..., 0, limit);
    
    allFeatured.push(...featured);
  }
  
  return allFeatured
    .sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateB - dateA;
    })
    safeArraySlice(..., 0, limit);
}

// Search content across all collections
export async function searchContent(
  query: string,
  fields: string[] = ['title', 'description', 'excerpt', 'content', 'tags']
): Promise<ContentFile[]> {
  const allCollections = await getAllContent();
  const allItems = Object.values(allCollections).flat();
  
  const searchTerm = query.toLowerCase().trim();
  if (!searchTerm) return [];
  
  return allItems.filter(item => {
    return fields.some(field => {
      const value = item[field];
      if (!value) return false;
      
      if (Array.isArray(value)) {
        return value.some(v => 
          String(v).toLowerCase().includes(searchTerm)
        );
      }
      
      return String(value).toLowerCase().includes(searchTerm);
    });
  });
}

// Get content statistics
export async function getContentStats(): Promise<{
  total: number;
  byCollection: Record<string, number>;
  byCategory: Record<string, number>;
  featuredCount: number;
  publishedCount: number;
  draftCount: number;
}> {
  const allCollections = await getAllContent();
  const allItems = Object.values(allCollections).flat();
  
  const stats = {
    total: allItems.length,
    byCollection: {} as Record<string, number>,
    byCategory: {} as Record<string, number>,
    featuredCount: 0,
    publishedCount: 0,
    draftCount: 0,
  };
  
  // Count by collection
  for (const [collection, items] of Object.entries(allCollections)) {
    stats.byCollection[collection] = items.length;
  }
  
  // Count by category and other stats
  for (const item of allItems) {
    if (item.category) {
      stats.byCategory[item.category] = (stats.byCategory[item.category] || 0) + 1;
    }
    
    if (item.featured) stats.featuredCount++;
    if (item.published === false || item.draft === true) {
      stats.draftCount++;
    } else {
      stats.publishedCount++;
    }
  }
  
  return stats;
}

// Legacy functions for backward compatibility
export async function getAllPosts(): Promise<ContentFile[]> {
  return getAllFromCollection('posts');
}

export async function getPost(slug: string): Promise<ContentFile | null> {
  return getContentBySlug('posts', slug);
}

export async function getAllBooks(): Promise<ContentFile[]> {
  return getAllFromCollection('books');
}

export async function getBook(slug: string): Promise<ContentFile | null> {
  return getContentBySlug('books', slug);
}

export async function getAllCanons(): Promise<ContentFile[]> {
  return getAllFromCollection('canon');
}

export async function getCanon(slug: string): Promise<ContentFile | null> {
  return getContentBySlug('canon', slug);
}

export async function getAllDownloads(): Promise<ContentFile[]> {
  return getAllFromCollection('downloads');
}

export async function getDownload(slug: string): Promise<ContentFile | null> {
  return getContentBySlug('downloads', slug);
}

export async function getAllShorts(): Promise<ContentFile[]> {
  return getAllFromCollection('shorts');
}

export async function getShort(slug: string): Promise<ContentFile | null> {
  return getContentBySlug('shorts', slug);
}

export async function getAllEvents(): Promise<ContentFile[]> {
  return getAllFromCollection('events');
}

export async function getEvent(slug: string): Promise<ContentFile | null> {
  return getContentBySlug('events', slug);
}

export async function getAllPrints(): Promise<ContentFile[]> {
  return getAllFromCollection('prints');
}

export async function getPrint(slug: string): Promise<ContentFile | null> {
  return getContentBySlug('prints', slug);
}

export async function getAllResources(): Promise<ContentFile[]> {
  return getAllFromCollection('resources');
}

export async function getResource(slug: string): Promise<ContentFile | null> {
  return getContentBySlug('resources', slug);
}

export async function getAllStrategies(): Promise<ContentFile[]> {
  return getAllFromCollection('strategies');
}

export async function getStrategy(slug: string): Promise<ContentFile | null> {
  return getContentBySlug('strategies', slug);
}

// Default export with all functions
const contentManager = {
  // Core functions
  getAllFromCollection,
  getContentBySlug,
  getAllContent,
  getFeaturedContent,
  searchContent,
  getContentStats,
  
  // Legacy functions
  getAllPosts,
  getPost,
  getAllBooks,
  getBook,
  getAllCanons,
  getCanon,
  getAllDownloads,
  getDownload,
  getAllShorts,
  getShort,
  getAllEvents,
  getEvent,
  getAllPrints,
  getPrint,
  getAllResources,
  getResource,
  getAllStrategies,
  getStrategy,
  
  // Types
  type: {
    ContentFile: {} as ContentFile,
    ContentCollection: {} as ContentCollection,
  },
};

export default contentManager;