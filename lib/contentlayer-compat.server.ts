// lib/contentlayer-compat.server.ts
import fs from 'fs';
import path from 'path';

export interface DocBase {
  // ... same interface as before
}

export async function getContentlayerData() {
  try {
    // Try Contentlayer v2 first
    const v2Path = path.join(process.cwd(), '.contentlayer', 'generated');
    
    if (fs.existsSync(path.join(v2Path, 'index.mjs'))) {
      const mod = await import(path.join(v2Path, 'index.mjs'));
      return mod.default || mod;
    }
    
    // Fallback to Contentlayer's main export
    const mod = await import('contentlayer/generated');
    return mod.default || mod;
  } catch (error) {
    console.warn('[ContentLayer] Failed to load generated data:', error);
    return {
      allBooks: [],
      allCanons: [],
      allDownloads: [],
      allEvents: [],
      allPosts: [],
      allPrints: [],
      allResources: [],
      allShorts: [],
      allStrategies: [],
      allDocuments: [],
    };
  }
}

export function getAllDocumentsSync(data: any) {
  const allDocs = [];
  
  if (data.allBooks) allDocs.push(...data.allBooks);
  if (data.allCanons) allDocs.push(...data.allCanons);
  if (data.allDownloads) allDocs.push(...data.allDownloads);
  if (data.allEvents) allDocs.push(...data.allEvents);
  if (data.allPosts) allDocs.push(...data.allPosts);
  if (data.allPrints) allDocs.push(...data.allPrints);
  if (data.allResources) allDocs.push(...data.allResources);
  if (data.allShorts) allDocs.push(...data.allShorts);
  if (data.allStrategies) allDocs.push(...data.allStrategies);
  
  return allDocs;
}

// Add synchronous version for build time
export function getContentlayerDataSync() {
  try {
    const v2Path = path.join(process.cwd(), '.contentlayer', 'generated');
    
    if (fs.existsSync(path.join(v2Path, 'index.mjs'))) {
      // Clear require cache for hot reload
      delete require.cache[path.join(v2Path, 'index.mjs')];
      const mod = require(path.join(v2Path, 'index.mjs'));
      return mod.default || mod;
    }
    
    // Fallback
    const mod = require('contentlayer/generated');
    return mod.default || mod;
  } catch (error) {
    console.warn('[ContentLayer] Failed to load generated data sync:', error);
    return {
      allBooks: [],
      allCanons: [],
      allDownloads: [],
      allEvents: [],
      allPosts: [],
      allPrints: [],
      allResources: [],
      allShorts: [],
      allStrategies: [],
      allDocuments: [],
    };
  }
}