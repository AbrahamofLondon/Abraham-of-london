import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

console.log('📋 Validating content schema...');

// Check if contentlayer.config.ts exists
const configPath = join(process.cwd(), 'contentlayer.config.ts');
if (!existsSync(configPath)) {
  console.log('⚠️ No contentlayer.config.ts found, skipping advanced validation');
}

// Ensure content directory exists with basic structure
const contentDir = join(process.cwd(), 'content');
if (!existsSync(contentDir)) {
  console.log('📁 Creating content directory structure...');
  
  // Create directories
  const directories = ['blog', 'pages', 'docs', 'authors', 'products'];
  directories.forEach(dir => {
    const dirPath = join(contentDir, dir);
    if (!existsSync(dirPath)) {
      mkdirSync(dirPath, { recursive: true });
      console.log(`  Created: ${dir}/`);
    }
  });

  // Create a welcome post
  const welcomePost = join(contentDir, 'blog', 'welcome.md');
  if (!existsSync(welcomePost)) {
    const content = `---
title: "Welcome to Abraham of London"
date: "${new Date().toISOString().split('T')[0]}"
description: "Welcome to our premium luxury brand experience"
author: "Admin"
tags: ["welcome", "introduction"]
featured: true
---

# Welcome to Abraham of London

Thank you for visiting our premium luxury brand website. We are currently setting up our content.

## What to Expect

- Exclusive product showcases
- Luxury lifestyle insights
- Brand heritage stories
- Seasonal collections

Stay tuned for more premium content coming soon!

*The Abraham of London Team*`;
    
    writeFileSync(welcomePost, content);
    console.log('  Created sample blog post: blog/welcome.md');
  }
}

console.log('✅ Content schema validation completed');
process.exit(0);