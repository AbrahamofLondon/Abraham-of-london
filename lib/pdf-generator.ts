import "server-only";

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

import { getPDFById } from './pdf/registry';

/**
 * INSTITUTIONAL PDF GENERATION ENGINE (v2.4)
 * Optimized for Parallel Vault Sync, Safe-Healing Buffers, and Virtual Registry.
 * Fixed: TypeScript null-pointer safety and cross-directory source resolution.
 */
export async function generatePDF(
  id: string, 
  force: boolean = false,
  contentOverride?: string 
): Promise<{ success: boolean; path?: string; error?: string; cached?: boolean }> {
  
  // 1. Intelligent Registry Fallback
  const registryConfig = getPDFById(id);
  
  const config = registryConfig || {
    id: id,
    title: id.replace(/-/g, ' ').toUpperCase(),
    outputPath: `/briefs/${id}.pdf`,
    category: 'General',
  };

  if (!registryConfig) {
    console.warn(`⚠️ [PDF_GEN]: Asset "${id}" not in registry. Generating virtual config.`);
    (config as any).date = new Date().toISOString();
  }

  try {
    // 2. Source Resolution (Check Briefs, then Vault)
    let mdxPath = path.join(process.cwd(), 'content/briefs', `${id}.mdx`);
    
    if (!fs.existsSync(mdxPath)) {
      mdxPath = path.join(process.cwd(), 'content/vault', `${id}.mdx`);
    }

    const outputPath = path.join(
      process.cwd(), 
      'public', 
      config.outputPath.replace(/^\//, '')
    );
    
    // 3. Source Verification
    if (!fs.existsSync(mdxPath) && !contentOverride) {
      return { success: false, error: `Source MDX missing for "${id}" and no override provided.` };
    }

    // 4. Content Acquisition
    let contentBody: string;
    if (contentOverride) {
      contentBody = contentOverride;
    } else {
      const fileContent = fs.readFileSync(mdxPath, 'utf8');
      const parsed = matter(fileContent);
      contentBody = parsed.content;
    }

    // 5. Cache Check Logic
    if (!force && !contentOverride && fs.existsSync(outputPath)) {
      const stats = fs.statSync(outputPath);
      const mdxStats = fs.statSync(mdxPath);
      
      if (stats.mtime > mdxStats.mtime) {
        return { success: true, path: config.outputPath, cached: true };
      }
    }

    // 6. Ensure Directory Integrity
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    // 7. Dynamic Imports for Sovereign Rendering
    const [React, ReactPDF, { BriefDocument }] = await Promise.all([
      import('react'),
      import('@react-pdf/renderer'),
      import('./pdf-templates/BriefDocument')
    ]);

    // 8. Render
    const pdfElement = React.createElement(BriefDocument as any, { 
      config: config,
      content: contentBody.trim() 
    });

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