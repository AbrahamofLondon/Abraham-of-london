// lib/content-index.ts
import path from 'node:path';
import fs from 'fs';

const ROOT = process.cwd();

export function listValidSlugs(dirRel: string): string[] {
  try {
    const abs = path.join(ROOT, dirRel);
    
    if (!fs.existsSync(abs)) {
      console.warn(`[ContentIndex] Directory not found: ${dirRel}`);
      return [];
    }

    const entries = fs.readdirSync(abs, { withFileTypes: true })
      .filter(dirent => dirent.isFile() && dirent.name.endsWith('.mdx'))
      .map(dirent => dirent.name);

    if (entries.length === 0) {
      console.warn(`[ContentIndex] No MDX files found in: ${dirRel}`);
      return [];
    }

    const valid: string[] = [];
    const quarantined: Array<{ name: string; reason: string }> = [];

    for (const name of entries) {
      const full = path.join(abs, name);
      try {
        const check = safeReadMdx(full);
        if (check.ok) {
          valid.push(name.replace(/\.mdx$/, ''));
        } else {
          quarantined.push({ name, reason: check.reason || 'Unknown error' });
        }
      } catch (error) {
        quarantined.push({ 
          name, 
          reason: error instanceof Error ? error.message : 'Processing failed' 
        });
      }
    }

    const reportsDir = path.join(ROOT, '.reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const reportFile = path.join(
      reportsDir, 
      `${dirRel.replace(/[^a-zA-Z0-9]/g, '_')}-quarantine.json`
    );

    try {
      fs.writeFileSync(
        reportFile,
        JSON.stringify({ 
          directory: dirRel,
          scannedAt: new Date().toISOString(),
          totalFiles: entries.length,
          validCount: valid.length,
          quarantinedCount: quarantined.length,
          quarantined 
        }, null, 2)
      );
    } catch (writeError) {
      console.warn(`[ContentIndex] Failed to write report: ${writeError}`);
    }

    console.log(`[ContentIndex] ${dirRel}: ${valid.length}/${entries.length} valid files`);
    
    if (quarantined.length > 0) {
      console.warn(`[ContentIndex] ${quarantined.length} files quarantined in ${dirRel}`);
    }

    return valid;
  } catch (error) {
    console.error(`[ContentIndex] Critical error scanning ${dirRel}:`, error);
    return [];
  }
}

export function getContentBySlug(slug: string, dirRel: string) {
  try {
    const abs = path.join(ROOT, dirRel);
    const filePath = path.join(abs, `${slug}.mdx`);
    
    if (!fs.existsSync(filePath)) {
      return null;
    }

    const result = safeReadMdx(filePath);
    return result.ok ? result.data : null;
  } catch (error) {
    console.error(`[ContentIndex] Error loading ${slug} from ${dirRel}:`, error);
    return null;
  }
}

export function getAllValidContent(dirRel: string) {
  const slugs = listValidSlugs(dirRel);
  const content = [];
  
  for (const slug of slugs) {
    const item = getContentBySlug(slug, dirRel);
    if (item) {
      content.push(item);
    }
  }
  
  return content.sort((a, b) => {
    const dateA = a.date ? new Date(a.date).getTime() : 0;
    const dateB = b.date ? new Date(b.date).getTime() : 0;
    return dateB - dateA;
  });
}
