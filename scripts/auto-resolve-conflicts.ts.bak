#!/usr/bin/env node
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { argv, cwd } from 'node:process';

/**
 * ABRAHAM OF LONDON - TOTAL RECONCILIATION ENGINE v3.1
 * Precise, global scan to eliminate all hidden conflict markers.
 */

const MODE = argv.includes("--theirs") ? "theirs" : "ours";
const IGNORE = new Set([
  "node_modules", ".next", ".contentlayer", ".git", ".turbo", ".cache", "dist", "public"
]);

const MARKER_PATTERN = /<{7}(?:[ \t].*)?\r?\n([\s\S]*?)\r?\n={7}\s*\r?\n([\s\S]*?)\r?\n>{7}(?:[ \t].*)?/g;

async function totalCrawl(dir: string): Promise<void> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      if (!IGNORE.has(entry.name)) await totalCrawl(fullPath);
      continue;
    }

    if (entry.name.endsWith('.bak') || entry.name.endsWith('.png') || entry.name.endsWith('.jpg')) continue;

    try {
      const content = await fs.readFile(fullPath, 'utf8');
      if (content.includes('<<<<<<<')) {
        const output = content.replace(MARKER_PATTERN, (_, ours, theirs) => {
          return MODE === "ours" ? ours : theirs;
        });
        
        await fs.copyFile(fullPath, `${fullPath}.bak`);
        await fs.writeFile(fullPath, output, 'utf8');
        console.log(`⚖️  PRECISELY RESOLVED: ${path.relative(cwd(), fullPath)}`);
      }
    } catch (e) {
      // Skip binary/locked files
    }
  }
}

async function run() {
  console.log(`🚀 ENGAGING TOTAL RECONCILIATION [MODE: ${MODE.toUpperCase()}]...`);
  await totalCrawl(cwd());
  console.log(`✅ SCAN COMPLETE.`);
}

run().catch(console.error);