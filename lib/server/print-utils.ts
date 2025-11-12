// lib/print-utils.ts - PRODUCTION SAFE VERSION
import { allPrints, type Print } from "contentlayer/generated";

// Type-safe fallback for Print type
interface SafePrint {
  _id: string;
  title: string;
  slug: string;
  date: string;
  url: string;
  excerpt?: string;
  tags?: string[];
  coverImage?: string;
  [key: string]: any;
}

/**
 * Safely get all print documents with comprehensive error handling
 */
export function getAllPrintDocuments(): SafePrint[] {
  try {
    if (typeof allPrints === 'undefined') {
      console.warn('⚠️ ContentLayer prints data is undefined - returning empty array');
      return [];
    }

    if (!Array.isArray(allPrints)) {
      console.error('❌ ContentLayer prints is not an array:', typeof allPrints);
      return [];
    }

    // Enhanced duplicate prevention
    const seenSlugs = new Set();
    const safePrints: SafePrint[] = [];

    allPrints.forEach(print => {
      // Validate basic structure
      const isValid = print && 
                     typeof print === 'object' &&
                     typeof print._id === 'string' &&
                     typeof print.title === 'string' &&
                     typeof print.slug === 'string' &&
                     typeof print.date === 'string' &&
                     typeof print.url === 'string';

      if (!isValid) {
        console.warn('🚨 Filtering out invalid print:', print);
        return;
      }

      // Check for duplicates
      if (seenSlugs.has(print.slug)) {
        console.warn(`🚨 DUPLICATE SLUG FOUND: ${print.slug} - "${print.title}"`);
        return;
      }

      seenSlugs.add(print.slug);
      safePrints.push(print as SafePrint);
    });

    console.log(`✅ Found ${safePrints.length} unique prints (from ${allPrints.length} total)`);

    // Sort by date (newest first) with error handling
    return safePrints.sort((a, b) => {
      try {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      } catch (error) {
        console.warn(`📅 Date sorting error for prints "${a.title}" and "${b.title}"`);
        return 0;
      }
    });

  } catch (error) {
    console.error('💥 Critical error in getAllPrintDocuments:', error);
    return [];
  }
}

/**
 * Safely get all print slugs for static generation
 */
export function getAllPrintSlugs(): string[] {
  try {
    const prints = getAllPrintDocuments();
    const slugs = prints.map(doc => doc.slug).filter(Boolean);

    console.log(`🖨️ Generated ${slugs.length} valid print slugs`);
    return slugs;

  } catch (error) {
    console.error('💥 Error generating print slugs:', error);
    return [];
  }
}

/**
 * Safely get a print document by slug with fallbacks
 */
export function getPrintDocumentBySlug(slug: string): SafePrint | null {
  try {
    if (!slug || typeof slug !== 'string') {
      console.warn('⚠️ Invalid slug provided to getPrintDocumentBySlug:', slug);
      return null;
    }

    if (slug === 'untitled') {
      console.warn('🚫 Attempted to access "untitled" slug - returning null');
      return null;
    }

    const prints = getAllPrintDocuments();
    const print = prints.find(doc => doc.slug === slug);

    if (!print) {
      console.warn(`🔍 Print document not found for slug: "${slug}"`);
      return null;
    }

    return print;

  } catch (error) {
    console.error(`💥 Error finding print with slug "${slug}":`, error);
    return null;
  }
}

/**
 * Generate static paths for print pages
 */
export function getPrintPaths() {
  try {
    const slugs = getAllPrintSlugs();
    const paths = slugs.map(slug => ({ params: { slug } }));

    console.log(`🛣️ Generated ${paths.length} unique print paths`);
    return paths;

  } catch (error) {
    console.error('💥 Error generating print paths:', error);
    return [];
  }
}

// Export types for use in other files
export type { SafePrint as PrintDocument };