#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

async function checkCorruptedFiles() {
  console.log('🔍 Checking for corrupted TypeScript files...');
  
  try {
    const tsFiles = await glob('**/*.ts', { 
      ignore: [
        '**/node_modules/**', 
        '**/dist/**', 
        '**/.next/**',
        '**/__tests__/**',
        '**/*.d.ts'  // Ignore declaration files
      ],
      cwd: rootDir,
      absolute: true
    });
    
    let corruptedCount = 0;
    
    for (const file of tsFiles) {
      const content = fs.readFileSync(file, 'utf8');
      
      // More specific check: look for DOCTYPE or HTML tags at the beginning of the file
      // This avoids false positives on valid TypeScript files
      const first200Chars = content.slice(0, 200).toLowerCase();
      
      if (first200Chars.includes('<!doctype html>') || 
          first200Chars.includes('<html') ||
          first200Chars.includes('<head>') ||
          first200Chars.includes('<body')) {
        
        // Double-check: if it also has TypeScript keywords, it might be a false positive
        const hasTypeScriptKeywords = /import|export|function|class|interface|type|const|let/.test(content.slice(0, 500));
        
        if (!hasTypeScriptKeywords) {
          console.error(`❌ Corrupted TypeScript file detected: ${path.relative(rootDir, file)}`);
          console.error(`   First 100 chars: ${content.slice(0, 100).replace(/\n/g, ' ').substring(0, 100)}...`);
          corruptedCount++;
        } else {
          // This is a valid TypeScript file that happens to contain HTML strings
          console.log(`⚠️  Skipping false positive: ${path.relative(rootDir, file)} (contains HTML in strings but looks like valid TS)`);
        }
      }
    }
    
    if (corruptedCount > 0) {
      console.error(`\n❌ Found ${corruptedCount} corrupted TypeScript files. Build aborted.`);
      process.exit(1);
    } else {
      console.log('✅ All TypeScript files are valid');
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ Error checking files:', error);
    process.exit(1);
  }
}

checkCorruptedFiles();