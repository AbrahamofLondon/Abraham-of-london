// lib/contentlayer-compat.server.ts
import fs from 'fs';
import path from 'path';
import type { DocBase } from './contentlayer-compat';

/* -------------------------------------------------------------------------- */
/* TYPES                                                                      */
/* -------------------------------------------------------------------------- */

export interface ServerDocBase extends DocBase {
  _id: string;
  _raw: {
    sourceFilePath: string;
    sourceFileName: string;
    sourceFileDir: string;
    contentType: string;
    flattenedPath: string;
  };
  type: string;
  title: string;
  slug: string;
  description?: string;
  excerpt?: string;
  date?: string;
  coverImage?: string;
  author?: string;
  tags?: string[];
  category?: string;
  draft?: boolean;
  featured?: boolean;
  body?: {
    raw: string;
    code: string;
  };
}

export type ServerGeneratedShape = {
  allDocuments: ServerDocBase[];
  allPosts: ServerDocBase[];
  allBooks: ServerDocBase[];
  allCanons: ServerDocBase[];
  allDownloads: ServerDocBase[];
  allShorts: ServerDocBase[];
  allEvents: ServerDocBase[];
  allPrints: ServerDocBase[];
  allResources: ServerDocBase[];
  allStrategies: ServerDocBase[];
};

/* -------------------------------------------------------------------------- */
/* UTILITIES                                                                  */
/* -------------------------------------------------------------------------- */

export function isServerSide(): boolean {
  return typeof window === 'undefined';
}

export function isEdgeRuntime(): boolean {
  return typeof EdgeRuntime !== 'undefined' || process.env.NEXT_RUNTIME === 'edge';
}

/* -------------------------------------------------------------------------- */
/* DATA LOADING                                                               */
/* -------------------------------------------------------------------------- */

// Cache for server-side data
let SERVER_CACHE: ServerGeneratedShape | null = null;
let SERVER_CACHE_TIMESTAMP = 0;
const SERVER_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function loadContentlayerData(): Promise<ServerGeneratedShape> {
  const now = Date.now();
  
  // Return cached data if valid
  if (SERVER_CACHE && now - SERVER_CACHE_TIMESTAMP < SERVER_CACHE_TTL) {
    return SERVER_CACHE;
  }
  
  try {
    // Try Contentlayer v2 first
    const v2Path = path.join(process.cwd(), '.contentlayer', 'generated');
    
    let rawData: any;
    
    if (fs.existsSync(path.join(v2Path, 'index.mjs'))) {
      const mod = await import(path.join(v2Path, 'index.mjs'));
      rawData = mod.default || mod;
    } else {
      // Fallback to Contentlayer's main export
      const mod = await import('contentlayer/generated');
      rawData = mod.default || mod;
    }
    
    // Transform to our ServerGeneratedShape format
    const allDocuments = getAllDocumentsSync(rawData);
    
    const transformedData: ServerGeneratedShape = {
      allDocuments,
      allPosts: (rawData.allPosts || []).map(normalizeDocument),
      allBooks: (rawData.allBooks || []).map(normalizeDocument),
      allCanons: (rawData.allCanons || []).map(normalizeDocument),
      allDownloads: (rawData.allDownloads || []).map(normalizeDocument),
      allEvents: (rawData.allEvents || []).map(normalizeDocument),
      allShorts: (rawData.allShorts || []).map(normalizeDocument),
      allPrints: (rawData.allPrints || []).map(normalizeDocument),
      allResources: (rawData.allResources || []).map(normalizeDocument),
      allStrategies: (rawData.allStrategies || []).map(normalizeDocument),
    };
    
    SERVER_CACHE = transformedData;
    SERVER_CACHE_TIMESTAMP = now;
    
    console.log(`[Contentlayer] Loaded ${allDocuments.length} documents into server cache`);
    return transformedData;
    
  } catch (error) {
    console.warn('[Contentlayer] Failed to load generated data:', error);
    
    // Return empty structure on error
    const emptyData: ServerGeneratedShape = {
      allDocuments: [],
      allPosts: [],
      allBooks: [],
      allCanons: [],
      allDownloads: [],
      allEvents: [],
      allShorts: [],
      allPrints: [],
      allResources: [],
      allStrategies: [],
    };
    
    SERVER_CACHE = emptyData;
    SERVER_CACHE_TIMESTAMP = now;
    
    return emptyData;
  }
}

function normalizeDocument(doc: any): ServerDocBase {
  return {
    _id: doc._id || `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    _raw: {
      sourceFilePath: doc._raw?.sourceFilePath || `content/${doc.type || 'unknown'}/${doc.slug || 'unknown'}.mdx`,
      sourceFileName: doc._raw?.sourceFileName || `${doc.slug || 'unknown'}.mdx`,
      sourceFileDir: doc._raw?.sourceFileDir || `content/${doc.type || 'unknown'}`,
      contentType: doc._raw?.contentType || doc.type || 'document',
      flattenedPath: doc._raw?.flattenedPath || `${doc.type || 'document'}/${doc.slug || 'unknown'}`,
    },
    type: doc.type || 'document',
    title: doc.title || 'Untitled',
    slug: doc.slug || 'untitled',
    description: doc.description,
    excerpt: doc.excerpt,
    date: doc.date,
    coverImage: doc.coverImage,
    author: doc.author,
    tags: doc.tags || [],
    category: doc.category,
    draft: doc.draft || false,
    featured: doc.featured || false,
    body: doc.body,
    // Copy any additional fields
    ...doc,
  };
}

/* -------------------------------------------------------------------------- */
/* PUBLIC API                                                                 */
/* -------------------------------------------------------------------------- */

export async function getContentlayerData(): Promise<ServerGeneratedShape> {
  if (!isServerSide()) {
    throw new Error('getContentlayerData can only be called on the server');
  }
  
  return loadContentlayerData();
}

export function getContentlayerDataSync(): ServerGeneratedShape {
  if (!isServerSide()) {
    throw new Error('getContentlayerDataSync can only be called on the server');
  }
  
  // Return cached data if available
  if (SERVER_CACHE) {
    return SERVER_CACHE;
  }
  
  try {
    const v2Path = path.join(process.cwd(), '.contentlayer', 'generated');
    
    let rawData: any;
    
    if (fs.existsSync(path.join(v2Path, 'index.mjs'))) {
      // Clear require cache for hot reload
      const modulePath = path.join(v2Path, 'index.mjs');
      delete require.cache[modulePath];
      const mod = require(modulePath);
      rawData = mod.default || mod;
    } else {
      // Fallback
      const mod = require('contentlayer/generated');
      rawData = mod.default || mod;
    }
    
    const allDocuments = getAllDocumentsSync(rawData);
    
    const data: ServerGeneratedShape = {
      allDocuments,
      allPosts: (rawData.allPosts || []).map(normalizeDocument),
      allBooks: (rawData.allBooks || []).map(normalizeDocument),
      allCanons: (rawData.allCanons || []).map(normalizeDocument),
      allDownloads: (rawData.allDownloads || []).map(normalizeDocument),
      allEvents: (rawData.allEvents || []).map(normalizeDocument),
      allShorts: (rawData.allShorts || []).map(normalizeDocument),
      allPrints: (rawData.allPrints || []).map(normalizeDocument),
      allResources: (rawData.allResources || []).map(normalizeDocument),
      allStrategies: (rawData.allStrategies || []).map(normalizeDocument),
    };
    
    SERVER_CACHE = data;
    SERVER_CACHE_TIMESTAMP = Date.now();
    
    return data;
  } catch (error) {
    console.warn('[Contentlayer] Failed to load generated data sync:', error);
    
    const emptyData: ServerGeneratedShape = {
      allDocuments: [],
      allPosts: [],
      allBooks: [],
      allCanons: [],
      allDownloads: [],
      allEvents: [],
      allShorts: [],
      allPrints: [],
      allResources: [],
      allStrategies: [],
    };
    
    SERVER_CACHE = emptyData;
    return emptyData;
  }
}

export function getAllDocumentsSync(data: any): ServerDocBase[] {
  const allDocs: ServerDocBase[] = [];
  
  if (data.allBooks) allDocs.push(...data.allBooks.map(normalizeDocument));
  if (data.allCanons) allDocs.push(...data.allCanons.map(normalizeDocument));
  if (data.allDownloads) allDocs.push(...data.allDownloads.map(normalizeDocument));
  if (data.allEvents) allDocs.push(...data.allEvents.map(normalizeDocument));
  if (data.allPosts) allDocs.push(...data.allPosts.map(normalizeDocument));
  if (data.allPrints) allDocs.push(...data.allPrints.map(normalizeDocument));
  if (data.allResources) allDocs.push(...data.allResources.map(normalizeDocument));
  if (data.allShorts) allDocs.push(...data.allShorts.map(normalizeDocument));
  if (data.allStrategies) allDocs.push(...data.allStrategies.map(normalizeDocument));
  
  // Also check for direct allDocuments array
  if (data.allDocuments && Array.isArray(data.allDocuments)) {
    allDocs.push(...data.allDocuments.map(normalizeDocument));
  }
  
  // Remove duplicates by _id
  const seen = new Set();
  return allDocs.filter(doc => {
    if (seen.has(doc._id)) return false;
    seen.add(doc._id);
    return true;
  });
}

/* -------------------------------------------------------------------------- */
/* ADDITIONAL UTILITY FUNCTIONS                                               */
/* -------------------------------------------------------------------------- */

export async function getPublishedDocuments(type?: string): Promise<ServerDocBase[]> {
  const data = await getContentlayerData();
  
  let documents = data.allDocuments.filter((doc: ServerDocBase) => !doc.draft);
  
  if (type) {
    documents = documents.filter((doc: ServerDocBase) => doc.type === type);
  }
  
  return documents;
}

export async function getDocumentBySlug(
  slug: string,
  type?: string
): Promise<ServerDocBase | null> {
  const data = await getContentlayerData();
  
  const document = data.allDocuments.find((doc: ServerDocBase) => {
    const slugMatch = doc.slug === slug;
    return type ? slugMatch && doc.type === type : slugMatch;
  });
  
  return document || null;
}

export async function getAllSlugs(type?: string): Promise<string[]> {
  const data = await getContentlayerData();
  
  let documents = data.allDocuments;
  if (type) {
    documents = documents.filter((doc: ServerDocBase) => doc.type === type);
  }
  
  return documents.map((doc: ServerDocBase) => doc.slug);
}

/* -------------------------------------------------------------------------- */
/* CACHE MANAGEMENT                                                           */
/* -------------------------------------------------------------------------- */

export function clearServerCache(): void {
  SERVER_CACHE = null;
  SERVER_CACHE_TIMESTAMP = 0;
  console.log('[Contentlayer] Server cache cleared');
}

export function getCacheInfo(): {
  hasCache: boolean;
  timestamp: number;
  age: number;
  documentCount: number;
} {
  const now = Date.now();
  return {
    hasCache: !!SERVER_CACHE,
    timestamp: SERVER_CACHE_TIMESTAMP,
    age: SERVER_CACHE_TIMESTAMP ? now - SERVER_CACHE_TIMESTAMP : 0,
    documentCount: SERVER_CACHE?.allDocuments.length || 0,
  };
}

/* -------------------------------------------------------------------------- */
/* TYPE-SPECIFIC GETTERS                                                      */
/* -------------------------------------------------------------------------- */

export async function getAllPosts() {
  const data = await getContentlayerData();
  return data.allPosts || [];
}

export async function getAllBooks() {
  const data = await getContentlayerData();
  return data.allBooks || [];
}

export async function getAllCanons() {
  const data = await getContentlayerData();
  return data.allCanons || [];
}

export async function getAllDownloads() {
  const data = await getContentlayerData();
  return data.allDownloads || [];
}

export async function getAllEvents() {
  const data = await getContentlayerData();
  return data.allEvents || [];
}

export async function getAllShorts() {
  const data = await getContentlayerData();
  return data.allShorts || [];
}

export async function getAllPrints() {
  const data = await getContentlayerData();
  return data.allPrints || [];
}

export async function getAllResources() {
  const data = await getContentlayerData();
  return data.allResources || [];
}

export async function getAllStrategies() {
  const data = await getContentlayerData();
  return data.allStrategies || [];
}

/* -------------------------------------------------------------------------- */
/* DEFAULT EXPORT                                                             */
/* -------------------------------------------------------------------------- */

const contentlayerCompatServerApi = {
  // Core data access
  getContentlayerData,
  getContentlayerDataSync,
  getAllDocumentsSync,
  getPublishedDocuments,
  getDocumentBySlug,
  getAllSlugs,
  
  // Type-specific getters
  getAllPosts,
  getAllBooks,
  getAllCanons,
  getAllDownloads,
  getAllEvents,
  getAllShorts,
  getAllPrints,
  getAllResources,
  getAllStrategies,
  
  // Utilities
  isServerSide,
  isEdgeRuntime,
  
  // Cache management
  clearServerCache,
  getCacheInfo,
  
  // Type exports
  ServerDocBase,
  ServerGeneratedShape,
};

export default contentlayerCompatServerApi;