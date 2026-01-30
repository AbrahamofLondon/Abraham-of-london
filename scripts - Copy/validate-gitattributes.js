#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const gitattributesPath = path.join(process.cwd(), '.gitattributes');
const content = fs.readFileSync(gitattributesPath, 'utf8');

const lines = content.split('\n').filter(line => line.trim() && !line.startsWith('#'));

console.log('🔍 Validating .gitattributes...\n');

// Check for common issues
const issues = [];

// Check for LF normalization
if (!content.includes('text=auto eol=lf')) {
  issues.push('❌ Missing: * text=auto eol=lf');
}

// Check for export-ignore on build artifacts
const buildDirs = ['.next', 'node_modules', '.contentlayer'];
buildDirs.forEach(dir => {
  const pattern = `${dir}/ export-ignore`;
  if (!content.includes(pattern)) {
    issues.push(`❌ Missing: ${pattern}`);
  }
});

// Check for binary declarations
const binaryExtensions = ['.png', '.jpg', '.pdf', '.zip'];
binaryExtensions.forEach(ext => {
  if (!content.includes(`*${ext} binary`)) {
    issues.push(`❌ Missing: *${ext} binary`);
  }
});

if (issues.length === 0) {
  console.log('✅ .gitattributes is properly configured');
  console.log(`📊 Total rules: ${lines.length}`);
} else {
  console.log('⚠️ Issues found:');
  issues.forEach(issue => console.log(`  ${issue}`));
  console.log(`\n📊 Total rules: ${lines.length}`);
}

// Show statistics
const categories = {
  'text files': content.match(/\*\.\w+ text eol=lf/g)?.length || 0,
  'binary files': content.match(/\*\.\w+ binary/g)?.length || 0,
  'directories': content.match(/\/ export-ignore/g)?.length || 0,
  'comments': content.match(/#.*$/gm)?.length || 0,
};

console.log('\n📈 Statistics:');
Object.entries(categories).forEach(([name, count]) => {
  console.log(`  ${name}: ${count}`);
});