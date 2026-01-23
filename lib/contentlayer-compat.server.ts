/**
 * lib/contentlayer-compat.server.ts
 * RECONCILED INSTITUTIONAL SERVER-SIDE DATA ENGINE
 */
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
  // @ts-ignore
  return typeof EdgeRuntime !== 'undefined' || process.env.NEXT_RUNTIME === 'edge';
}

// Cache for server-side data
let SERVER_CACHE: ServerGeneratedShape | null = null;
let SERVER_CACHE_TIMESTAMP = 0;
const SERVER_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/* -------------------------------------------------------------------------- */
/* NORMALIZATION                                                              */
/* -------------------------------------------------------------------------- */

function normalizeDocument(doc: any): ServerDocBase {
  const type = doc.type || doc._type || 'document';
  const slug = doc.slug || doc._raw?.flattenedPath?.split('/').pop() || 'untitled';
  
  return {
    ...doc, // Preserves all fields including body.code
    _id: doc._id || `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    _raw: {
      sourceFilePath: doc._raw?.sourceFilePath || `content/${type}/${slug}.mdx`,
      sourceFileName: doc._raw?.sourceFileName || `${slug}.mdx`,
      sourceFileDir: doc._raw?.sourceFileDir || `content/${type}`,
      contentType: doc._raw?.contentType || 'mdx',
      flattenedPath: doc._raw?.flattenedPath || `${type}/${slug}`,
    },
    type: type,
    title: doc.title || 'Untitled Transmission',
    slug: slug,
    tags: Array.isArray(doc.tags) ? doc.tags : [],
    draft: !!doc.draft,
    featured: !!doc.featured,
  };
}

export function getAllDocumentsSync(data: any): ServerDocBase[] {
  const allDocs: ServerDocBase[] = [];
  
  const collections = [
    'allBooks', 'allCanons', 'allDownloads', 'allEvents', 
    'allPosts', 'allPrints', 'allResources', 'allShorts', 'allStrategies'
  ];

  collections.forEach(key => {
    if (data[key] && Array.isArray(data[key])) {
      allDocs.push(...data[key].map(normalizeDocument));
    }
  });
  
  if (data.allDocuments && Array.isArray(data.allDocuments)) {
    allDocs.push(...data.allDocuments.map(normalizeDocument));
  }
  
  // Deduplicate by flattened path to ensure unique route mapping
  const seen = new Set();
  return allDocs.filter(doc => {
    const key = doc._raw.flattenedPath;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/* -------------------------------------------------------------------------- */
/* DATA LOADING (ASYNC & SYNC)                                                */
/* -------------------------------------------------------------------------- */

async function loadContentlayerData(): Promise<ServerGeneratedShape> {
  const now = Date.now();
  if (SERVER_CACHE && now - SERVER_CACHE_TIMESTAMP < SERVER_CACHE_TTL) {
    return SERVER_CACHE;
  }
  
  try {
    const v2Path = path.join(process.cwd(), '.contentlayer', 'generated');
    let rawData: any;
    
    if (fs.existsSync(path.join(v2Path, 'index.mjs'))) {
      const mod = await import(path.join(v2Path, 'index.mjs'));
      rawData = mod.default || mod;
    } else {
      const mod = await import('contentlayer/generated');
      rawData = mod.default || mod;
    }
    
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
    return transformedData;
  } catch (error) {
    console.warn('[Contentlayer] Async load failed, falling back to sync:', error);
    return getContentlayerDataSync();
  }
}

/**
 * INSTITUTIONAL SYNC GETTER
 * Force-loads data for Pages Router compatibility.
 */
export function getContentlayerDataSync(): ServerGeneratedShape {
  if (!isServerSide()) {
    throw new Error('getContentlayerDataSync can only be called on the server');
  }

  if (SERVER_CACHE) return SERVER_CACHE;
  
  try {
    const v2Path = path.join(process.cwd(), '.contentlayer', 'generated');
    const indexPath = path.join(v2Path, 'index.mjs');
    let rawData: any;

    if (fs.existsSync(indexPath)) {
      // In development, we clear the require cache to capture content changes
      if (process.env.NODE_ENV !== 'production') {
        delete require.cache[require.resolve(indexPath)];
      }
      rawData = require(indexPath);
      rawData = rawData.default || rawData;
    } else {
      rawData = require('contentlayer/generated');
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
    console.error('[Contentlayer] Critical Load Failure:', error);
    return {
      allDocuments: [], allPosts: [], allBooks: [], allCanons: [],
      allDownloads: [], allEvents: [], allShorts: [], allPrints: [],
      allResources: [], allStrategies: []
    };
  }
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

export async function getPublishedDocuments(type?: string): Promise<ServerDocBase[]> {
  const data = await getContentlayerData();
  let documents = data.allDocuments.filter((doc) => !doc.draft);
  if (type) documents = documents.filter((doc) => doc.type === type);
  return documents;
}

export async function getDocumentBySlug(slug: string, type?: string): Promise<ServerDocBase | null> {
  const data = await getContentlayerData();
  return data.allDocuments.find((doc) => {
    const slugMatch = doc.slug === slug;
    return type ? slugMatch && doc.type === type : slugMatch;
  }) || null;
}

/* -------------------------------------------------------------------------- */
/* CACHE MANAGEMENT                                                           */
/* -------------------------------------------------------------------------- */

export function clearServerCache(): void {
  SERVER_CACHE = null;
  SERVER_CACHE_TIMESTAMP = 0;
}

export async function getAllPosts() { const d = await getContentlayerData(); return d.allPosts; }
export async function getAllBooks() { const d = await getContentlayerData(); return d.allBooks; }
export async function getAllCanons() { const d = await getContentlayerData(); return d.allCanons; }
export async function getAllDownloads() { const d = await getContentlayerData(); return d.allDownloads; }
export async function getAllEvents() { const d = await getContentlayerData(); return d.allEvents; }
export async function getAllShorts() { const d = await getContentlayerData(); return d.allShorts; }
export async function getAllPrints() { const d = await getContentlayerData(); return d.allPrints; }
export async function getAllResources() { const d = await getContentlayerData(); return d.allResources; }
export async function getAllStrategies() { const d = await getContentlayerData(); return d.allStrategies; }

const contentlayerCompatServerApi = {
  getContentlayerData,
  getContentlayerDataSync,
  getAllDocumentsSync,
  getPublishedDocuments,
  getDocumentBySlug,
  clearServerCache,
  getAllPosts,
  getAllBooks,
  getAllCanons,
  getAllDownloads,
  getAllEvents,
  getAllShorts,
  getAllPrints,
  getAllResources,
  getAllStrategies,
  isServerSide,
  isEdgeRuntime
};

export default contentlayerCompatServerApi;