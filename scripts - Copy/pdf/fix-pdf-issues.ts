// scripts/pdf/fix-pdf-issues.ts
import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';

export async function fixEmptyPDFs() {
  const downloadsDir = path.join(process.cwd(), 'public/downloads');
  const files = await fs.readdir(downloadsDir);
  
  for (const file of files.filter(f => f.endsWith('.pdf'))) {
    const filePath = path.join(downloadsDir, file);
    const stats = await fs.stat(filePath);
    
    // Check if file is empty (less than 1KB)
    if (stats.size < 1024) {
      console.log(`⚠️  Empty PDF found: ${file}`);
      
      // Try to regenerate from source
      const docName = file.replace('.pdf', '');
      try {
        execSync(`pnpm pdf:generate --tier=premium --doc=${docName}`, { stdio: 'inherit' });
        console.log(`✅ Regenerated: ${file}`);
      } catch (error) {
        console.error(`❌ Failed to regenerate ${file}:`, error);
      }
    }
  }
}

export async function removePlaceholderPDFs() {
  const placeholderPattern = /placeholder|dummy|sample|empty/i;
  const downloadsDir = path.join(process.cwd(), 'public/downloads');
  const files = await fs.readdir(downloadsDir);
  
  for (const file of files.filter(f => f.endsWith('.pdf'))) {
    const filePath = path.join(downloadsDir, file);
    const content = await fs.readFile(filePath, 'utf8');
    
    if (placeholderPattern.test(content)) {
      console.log(`🗑️  Removing placeholder PDF: ${file}`);
      await fs.unlink(filePath);
    }
  }
}