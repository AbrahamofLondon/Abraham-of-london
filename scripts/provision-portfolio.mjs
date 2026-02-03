/* scripts/provision-portfolio.mjs — SYSTEMATIC ASSET PROVISIONING */
import fs from 'fs';
import path from 'path';

const CONTENT_PATH = path.join(process.cwd(), 'content/briefs');
const TOTAL_BRIEFS = 75;

// Institutional Series Configuration
const SERIES_CONFIG = [
  { name: 'Frontier Resilience', prefix: 'FR' },
  { name: 'Sovereign Intelligence', prefix: 'SI' },
  { name: 'Institutional Alpha', prefix: 'IA' },
];

/**
 * GENERATE 75 INTELLIGENCE BRIEF PLACEHOLDERS
 */
async function provisionPortfolio() {
  console.log('--- INITIALIZING PORTFOLIO PROVISIONING ---');

  if (!fs.existsSync(CONTENT_PATH)) {
    fs.mkdirSync(CONTENT_PATH, { recursive: true });
    console.log(`[SYSTEM] Created directory: ${CONTENT_PATH}`);
  }

  for (let i = 1; i <= TOTAL_BRIEFS; i++) {
    const series = SERIES_CONFIG[(i - 1) % SERIES_CONFIG.length];
    const slug = `${series.prefix.toLowerCase()}-${String(i).padStart(3, '0')}`;
    const filename = `${slug}.mdx`;
    const filePath = path.join(CONTENT_PATH, filename);

    const frontmatter = `---
title: "${series.name} // Briefing ${String(i).padStart(3, '0')}"
subtitle: "Principled Analysis of Emerging Risk Patterns"
date: "${new Date().toISOString().split('T')[0]}"
excerpt: "Strategic assessment of current volatility and institutional response protocols for asset group ${series.prefix}."
coverImage: "/assets/images/briefs/placeholder-${(i % 5) + 1}.jpg"
published: false
featured: ${i <= 3}
category: "${series.name}"
tags: ["Intelligence", "${series.prefix}", "Analysis"]
author: "Abraham of London"
readTime: "8 min read"
classification: "Restricted"
series: "${series.name}"
volume: ${Math.ceil(i / 10)}
---

## I. Executive Summary

This briefing outlines the emerging patterns identified in the ${series.name} series. 
Current data suggests a pivot in regional stability.

<BriefAlert type="info">
  This is a provisioned placeholder for Intelligence Asset ${slug}. 
  Replace this content with verified analysis.
</BriefAlert>

## II. Strategic Assessment

Analysis of Node ${i} indicates:
1. Operational Latency is within normal parameters.
2. Signal-to-noise ratio in ${series.prefix} data streams remains high.

<DataNode label="Asset Code" value="${slug.toUpperCase()}" />
<DataNode label="Integrity" value="Verified" />
`;

    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, frontmatter);
      console.log(`[PROVISIONED] ${filename}`);
    } else {
      console.log(`[SKIPPED] ${filename} (Already Exists)`);
    }
  }

  console.log('--- PORTFOLIO PROVISIONING COMPLETE ---');
}

provisionPortfolio().catch(console.error);