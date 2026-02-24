import "server-only";

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

import { getPDFById } from './pdf/registry';

/**
 * INSTITUTIONAL PDF GENERATION ENGINE (v2.3)
 * Optimized for Parallel Vault Sync, Safe-Healing Buffers, and Virtual Registry.
 * Fixed: TypeScript null-pointer safety for production builds.
 */
export async function generatePDF(
  id: string, 
  force: boolean = false,
  contentOverride?: string 
): Promise<{ success: boolean; path?: string; error?: string; cached?: boolean }> {
  
  // 1. Intelligent Registry Fallback
  // We fetch the config and immediately provide a fallback to ensure 'config' is never undefined.
  const registryConfig = getPDFById(id);
  
  const config = registryConfig || {
    id: id,
    title: id.replace(/-/g, ' ').toUpperCase(),
    outputPath: `/briefs/${id}.pdf`,
    category: 'General',
  };

  // If it's a virtual config, we log it and inject the date (casting to any to bypass strict PDFConfig interface)
  if (!registryConfig) {
    console.warn(`⚠️ [PDF_GEN]: Asset "${id}" not in registry. Generating virtual config.`);
    (config as any).date = new Date().toISOString();
  }

  try {
    // Determine source path (defaulting to briefs, but extensible for vault)
    const mdxPath = path.join(process.cwd(), 'content/briefs', `${id}.mdx`);
    
    // Line 40 Fix: TypeScript now knows config.outputPath exists
    const outputPath = path.join(
      process.cwd(), 
      'public', 
      config.outputPath.replace(/^\//, '')
    );
    
    // 2. Source Verification
    if (!fs.existsSync(mdxPath) && !contentOverride) {
      return { success: false, error: `Source MDX missing at ${mdxPath} and no override provided.` };
    }

    // 3. Content Acquisition
    let contentBody: string;
    if (contentOverride) {
      contentBody = contentOverride;
    } else {
      const fileContent = fs.readFileSync(mdxPath, 'utf8');
      const parsed = matter(fileContent);
      contentBody = parsed.content;
    }

    // 4. Cache Check Logic
    if (!force && !contentOverride && fs.existsSync(outputPath)) {
      const stats = fs.statSync(outputPath);
      const mdxStats = fs.statSync(mdxPath);
      
      // If the PDF is newer than the MDX, skip regeneration
      if (stats.mtime > mdxStats.mtime) {
        return { success: true, path: config.outputPath, cached: true };
      }
    }

    // 5. Ensure Directory Integrity
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    // 6. Dynamic Imports for Sovereign Rendering (Reduces bundle size in serverless)
    const [React, ReactPDF, { BriefDocument }] = await Promise.all([
      import('react'),
      import('@react-pdf/renderer'),
      import('./pdf-templates/BriefDocument')
    ]);

    // 7. Render
    const pdfElement = React.createElement(BriefDocument as any, { 
      config: config,
      content: contentBody.trim() 
    });

    // Write to public directory
    await ReactPDF.default.renderToFile(
      pdfElement as React.ReactElement<any>, 
      outputPath
    );

    return { success: true, path: config.outputPath, cached: false };
    
  } catch (error: any) {
    console.error(`[PDF_GEN_ERROR]: ${id}`, error);
    return { success: false, error: error.message };
  }
}