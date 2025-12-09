#!/usr/bin/env node
import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');
const contentDir = join(rootDir, 'content');

const requiredFields = {
  'canon': ['title', 'date'],
  'events': ['title', 'date'],
  'downloads': ['title', 'date'],
  'resources': ['title', 'date'],
  'blog': ['title', 'date'],
  'books': ['title', 'date']
};

async function validateFile(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    const { data, excerpt } = matter(content);
    
    const errors = [];
    const warnings = [];
    
    // Check for required fields based on directory
    const dirName = filePath.split('/').find(part => part in requiredFields);
    if (dirName && requiredFields[dirName]) {
      for (const field of requiredFields[dirName]) {
        if (!data[field]) {
          errors.push(`Missing required field: ${field}`);
        }
      }
    }
    
    // Check date format
    if (data.date) {
      if (typeof data.date !== 'string' || !data.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        errors.push(`Invalid date format: ${data.date}. Use YYYY-MM-DD`);
      }
    }
    
    // Check for potential YAML issues
    if (content.includes('---') && content.split('---').length < 3) {
      errors.push('Malformed YAML frontmatter');
    }
    
    return {
      path: filePath.replace(contentDir + '/', ''),
      valid: errors.length === 0,
      errors,
      warnings
    };
  } catch (error) {
    return {
      path: filePath.replace(contentDir + '/', ''),
      valid: false,
      errors: [`Parse error: ${error.message}`],
      warnings: []
    };
  }
}

async function walkDir(dir) {
  let results = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    
    if (entry.isDirectory()) {
      results = results.concat(await walkDir(fullPath));
    } else if (entry.name.match(/\.(md|mdx)$/)) {
      results.push(fullPath);
    }
  }
  
  return results;
}

async function main() {
  console.log('Validating content files...\n');
  
  const files = await walkDir(contentDir);
  const results = [];
  
  for (const file of files) {
    const result = await validateFile(file);
    results.push(result);
  }
  
  const validFiles = results.filter(r => r.valid);
  const invalidFiles = results.filter(r => !r.valid);
  
  console.log(`📊 Summary:`);
  console.log(`✅ Valid files: ${validFiles.length}`);
  console.log(`❌ Invalid files: ${invalidFiles.length}\n`);
  
  if (invalidFiles.length > 0) {
    console.log('Invalid files:');
    for (const file of invalidFiles) {
      console.log(`\n📄 ${file.path}:`);
      file.errors.forEach(error => console.log(`  ❗ ${error}`));
      file.warnings.forEach(warning => console.log(`  ⚠️  ${warning}`));
    }
    process.exit(1);
  } else {
    console.log('🎉 All content files are valid!');
    process.exit(0);
  }
}

main().catch(console.error);