import "server-only";
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { getPDFById } from './pdf/registry';

/**
 * INSTITUTIONAL PDF ORCHESTRATOR (v2.5)
 * Scans all content directories and outputs to public/downloads/
 */
export async function generatePDF(
  id: string, 
  force: boolean = false,
  contentOverride?: string 
): Promise<{ success: boolean; path?: string; error?: string; cached?: boolean }> {
  
  const registryConfig = getPDFById(id);
  
  // Defaulting output to public/downloads if not specified
  const config = registryConfig || {
    id: id,
    title: id.replace(/-/g, ' ').toUpperCase(),
    outputPath: `/downloads/briefs/${id}.pdf`,
    category: 'General',
  };

  if (!registryConfig) {
    (config as any).date = new Date().toISOString();
  }

  try {
    // 1. Omni-Directory Scan (Finding the MDX source)
    const sourceFolders = ['briefs', 'vault', 'blog', 'lexicon', 'strategy', 'resources'];
    let mdxPath = "";

    for (const folder of sourceFolders) {
      const checkPath = path.join(process.cwd(), 'content', folder, `${id}.mdx`);
      if (fs.existsSync(checkPath)) {
        mdxPath = checkPath;
        break;
      }
    }

    // 2. Output Path Alignment (Saving to public/downloads)
    const outputPath = path.join(
      process.cwd(), 
      'public', 
      config.outputPath.replace(/^\//, '')
    );
    
    if (!mdxPath && !contentOverride) {
      return { success: false, error: `Source not found in: ${sourceFolders.join(', ')}` };
    }

    // 3. Content Acquisition
    let contentBody: string;
    if (contentOverride) {
      contentBody = contentOverride;
    } else {
      const fileContent = fs.readFileSync(mdxPath, 'utf8');
      const { content } = matter(fileContent);
      contentBody = content;
    }

    // 4. Cache & Directory Integrity
    if (!force && fs.existsSync(outputPath)) {
      const stats = fs.statSync(outputPath);
      const mdxStats = fs.statSync(mdxPath);
      if (stats.mtime > mdxStats.mtime) return { success: true, path: config.outputPath, cached: true };
    }

    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    // 5. Rendering Engine (Dynamic Imports)
    const [React, ReactPDF, { BriefDocument }] = await Promise.all([
      import('react'),
      import('@react-pdf/renderer'),
      import('./pdf-templates/BriefDocument')
    ]);

    const pdfElement = React.createElement(BriefDocument as any, { 
      config: config,
      content: contentBody.trim() 
    });

    await ReactPDF.default.renderToFile(pdfElement as React.ReactElement<any>, outputPath);

    return { success: true, path: config.outputPath, cached: false };
    
  } catch (error: any) {
    console.error(`[PDF_GEN_ERROR]: ${id}`, error);
    return { success: false, error: error.message };
  }
}