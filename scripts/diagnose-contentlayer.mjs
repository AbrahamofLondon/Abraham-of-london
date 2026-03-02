#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const contentDir = path.join(process.cwd(), 'content');
const generatedDir = path.join(process.cwd(), '.contentlayer/generated');

console.log('🔍 Contentlayer Diagnostics');
console.log('=' .repeat(50));

// Check content directory structure
console.log('\n📁 Content Directory Structure:');
function printTree(dir, indent = '  ') {
  const items = fs.readdirSync(dir, { withFileTypes: true });
  items.forEach(item => {
    if (item.name.startsWith('.') || item.name === 'node_modules') return;
    
    if (item.isDirectory()) {
      const subdir = path.join(dir, item.name);
      const files = fs.readdirSync(subdir).filter(f => f.endsWith('.mdx') || f.endsWith('.md'));
      console.log(`${indent}${item.name}/ (${files.length} files)`);
      printTree(subdir, indent + '  ');
    }
  });
}

printTree(contentDir);

// Check print files specifically
console.log('\n📄 Print Files Analysis:');
const printDir = path.join(contentDir, 'prints');
if (fs.existsSync(printDir)) {
  const printFiles = fs.readdirSync(printDir).filter(f => f.endsWith('.mdx'));
  console.log(`Found ${printFiles.length} print files:`);
  
  printFiles.forEach(file => {
    const filePath = path.join(printDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Extract frontmatter
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (frontmatterMatch) {
      const frontmatter = frontmatterMatch[1];
      console.log(`\n  ${file}:`);
      console.log(`    Lines: ${content.split('\n').length}`);
      console.log(`    Has frontmatter: YES`);
      
      // Check for type field
      if (frontmatter.includes('type:')) {
        const typeMatch = frontmatter.match(/type:\s*["']?([^"\'\n]+)["']?/);
        console.log(`    Type field: ${typeMatch ? typeMatch[1] : 'found but malformed'}`);
      } else {
        console.log(`    Type field: MISSING`);
      }
      
      // Check for date field
      if (frontmatter.includes('date:')) {
        const dateMatch = frontmatter.match(/date:\s*["']?([^"\'\n]+)["']?/);
        console.log(`    Date field: ${dateMatch ? dateMatch[1] : 'found but malformed'}`);
      } else {
        console.log(`    Date field: MISSING`);
      }
    } else {
      console.log(`\n  ${file}:`);
      console.log(`    ERROR: No frontmatter found!`);
    }
  });
} else {
  console.log('❌ Prints directory not found!');
}

// Check generated content
console.log('\n📦 Generated Content Analysis:');
if (fs.existsSync(generatedDir)) {
  const generatedDirs = fs.readdirSync(generatedDir);
  console.log(`Generated directories: ${generatedDirs.length}`);
  
  generatedDirs.forEach(dir => {
    const dirPath = path.join(generatedDir, dir);
    if (fs.statSync(dirPath).isDirectory()) {
      const jsonFiles = fs.readdirSync(dirPath).filter(f => f.endsWith('.json'));
      console.log(`  ${dir}/: ${jsonFiles.length} JSON files`);
      
      // Read first file to check structure
      if (jsonFiles.length > 0) {
        const sampleFile = path.join(dirPath, jsonFiles[0]);
        try {
          const data = JSON.parse(fs.readFileSync(sampleFile, 'utf8'));
          console.log(`    Sample: ${data.title || 'No title'} (type: ${data.type || 'No type'})`);
        } catch (err) {
          console.log(`    ERROR reading JSON: ${err.message}`);
        }
      }
    }
  });
} else {
  console.log('❌ .contentlayer/generated directory not found!');
}

console.log('\n✅ Diagnostics complete.');
