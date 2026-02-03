import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { globSync } from 'glob';

console.log('🧪 [ENRICHMENT] Starting Metadata Autocompletion...');

const files = globSync('content/**/*.{md,mdx}');
let patchedCount = 0;

files.forEach(filePath => {
  const fileContent = readFileSync(filePath, 'utf8');
  const { data, content } = matter(fileContent);
  let changed = false;

  // 1. Auto-generate Description if missing
  if (!data.description || data.description.trim() === '') {
    const plainText = content
      .replace(/[#*`]/g, '') // Remove Markdown syntax
      .replace(/\n+/g, ' ')  // Collapse newlines
      .trim()
      .substring(0, 157);
    
    data.description = plainText + '...';
    changed = true;
  }

  // 2. Auto-generate Tags if missing
  if (!data.tags || !Array.isArray(data.tags) || data.tags.length === 0) {
    data.tags = ['intel', 'institutional-brief'];
    changed = true;
  }

  if (changed) {
    const updatedContent = matter.stringify(content, data);
    writeFileSync(filePath, updatedContent);
    patchedCount++;
  }
});

console.log(`✅ [ENRICHMENT] Complete. Patched ${patchedCount} files.`);