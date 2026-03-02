import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');

const downloadSources = [
  {
    dir: 'public/downloads',
    baseUrl: '/downloads',
    output: 'content/downloads/generated/public'
  },
  {
    dir: 'lib/pdf',
    baseUrl: '/lib/pdf',
    output: 'content/downloads/generated/library'
  }
];

function generateMDFrontmatter(file, relativePath, baseUrl) {
  const stats = fs.statSync(file);
  const name = path.basename(file, path.extname(file));
  const ext = path.extname(file).slice(1);
  
  return `---
title: "${name.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}"
description: "Download asset"
author: Abraham of London
date: "${stats.mtime.toISOString().split('T')[0]}"
type: Download
docKind: Resource
tags:
  - download
  - ${ext}
fileType: ${ext}
fileSize: "${(stats.size / 1024).toFixed(0)}KB"
downloadUrl: "${baseUrl}/${path.basename(file)}"
sourceLocation: "${relativePath}"
---
`;
}

for (const source of downloadSources) {
  const sourcePath = path.join(projectRoot, source.dir);
  if (!fs.existsSync(sourcePath)) continue;
  
  const outputDir = path.join(projectRoot, source.output);
  fs.mkdirSync(outputDir, { recursive: true });
  
  const files = fs.readdirSync(sourcePath);
  
  for (const file of files) {
    const fullPath = path.join(sourcePath, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isFile() && !file.startsWith('.')) {
      const name = path.basename(file, path.extname(file));
      const outputFile = path.join(outputDir, `${name}.mdx`);
      
      const frontmatter = generateMDFrontmatter(fullPath, source.dir, source.baseUrl);
      fs.writeFileSync(outputFile, frontmatter);
      console.log(`Generated: ${outputFile}`);
    }
  }
}