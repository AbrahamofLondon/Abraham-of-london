/* scripts/audit-briefs.mjs */
import { PrismaClient } from '@prisma/client';
import { allBriefs } from '../.contentlayer/generated/index.mjs';
import chalk from 'chalk';

const prisma = new PrismaClient();

async function auditPortfolio() {
  console.log(chalk.blue.bold(`\n--- Starting Intelligence Portfolio Audit (75 Briefs Expected) ---\n`));

  const results = {
    total: allBriefs.length,
    passed: 0,
    failed: 0,
    missingMetadata: [],
    brokenLinks: []
  };

  for (const brief of allBriefs) {
    const slug = brief._raw.flattenedPath.split('/').pop();
    process.stdout.write(chalk.gray(`Checking [${slug}]... `));

    // 1. Verify Prisma Metadata Existence
    const metadata = await prisma.contentMetadata.findFirst({
      where: { 
        OR: [
          { slug: slug },
          { slug: brief._raw.flattenedPath }
        ]
      }
    });

    if (!metadata) {
      console.log(chalk.red('FAIL: Metadata Missing'));
      results.missingMetadata.push(slug);
      results.failed++;
      continue;
    }

    // 2. Scan MDX for Internal Links
    const internalLinkRegex = /href=["'](\/vault\/briefs\/[^"']+)["']/g;
    const content = brief.body.raw;
    let match;
    let briefLinksClean = true;

    while ((match = internalLinkRegex.exec(content)) !== null) {
      const linkedSlug = match[1].split('/').pop();
      const linkExists = allBriefs.some(b => b._raw.flattenedPath.endsWith(linkedSlug));
      
      if (!linkExists) {
        results.brokenLinks.push({ from: slug, to: linkedSlug });
        briefLinksClean = false;
      }
    }

    if (!briefLinksClean) {
      console.log(chalk.yellow('WARN: Broken Internal Links'));
      results.failed++;
    } else {
      console.log(chalk.green('OK'));
      results.passed++;
    }
  }

  // --- FINAL REPORT ---
  console.log(chalk.blue.bold(`\n--- Audit Report ---`));
  console.log(`Total Briefs Scanned: ${results.total}`);
  console.log(chalk.green(`Passed: ${results.passed}`));
  console.log(chalk.red(`Failed/Incomplete: ${results.failed}`));

  if (results.missingMetadata.length > 0) {
    console.log(chalk.red.bold(`\nMissing Prisma Metadata:`));
    results.missingMetadata.forEach(s => console.log(` - ${s}`));
  }

  if (results.brokenLinks.length > 0) {
    console.log(chalk.yellow.bold(`\nBroken Cross-References:`));
    results.brokenLinks.forEach(link => console.log(` - In [${link.from}]: Points to non-existent [${link.to}]`));
  }

  await prisma.$disconnect();
  
  if (results.failed > 0) process.exit(1);
  console.log(chalk.green.bold('\nPortfolio integrity verified. Deployment ready.'));
}

auditPortfolio().catch(err => {
  console.error(err);
  process.exit(1);
});