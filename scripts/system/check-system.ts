// scripts/system/check-systems.ts — SOVEREIGN AUDIT ENGINE
import os from 'os';
import fs from 'fs';
import path from 'path';

/**
 * INSTITUTIONAL READINESS AUDIT
 * Verifies the underlying hardware and software infrastructure 
 * before processing the Abraham of London Portfolio.
 */

interface Requirement {
  name: string;
  check: () => boolean;
  message: string;
}

function checkRequirements() {
  const requirements: Requirement[] = [
    {
      name: 'Node.js Runtime',
      check: () => {
        const version = process.versions.node;
        const major = parseInt(version.split('.')[0]);
        // Next.js 16/2026 standards require Node 20+ for stability
        return major >= 20;
      },
      message: 'Node.js 20+ required for Next.js 16 stability.'
    },
    {
      name: 'System Memory',
      check: () => {
        const totalMem = os.totalmem() / (1024 * 1024 * 1024);
        return totalMem >= 3.5; // Adjusted to allow for 4GB virtualized CI environments
      },
      message: '4GB+ RAM required for large MDX portfolio builds.'
    },
    {
      name: 'Content Engine',
      check: () => {
        try {
          // Verify contentlayer2 exists in the dependency tree
          const pkg = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'));
          return !!(pkg.dependencies.contentlayer2 || pkg.devDependencies.contentlayer2);
        } catch {
          return false;
        }
      },
      message: 'Contentlayer2 not detected in package.json.'
    },
    {
      name: 'Institutional Registry',
      check: () => {
        const contentPath = path.join(process.cwd(), 'content');
        return fs.existsSync(contentPath) && fs.readdirSync(contentPath).length > 0;
      },
      message: 'Content registry missing or empty.'
    },
    {
      name: 'Database Schema',
      check: () => {
        const prismaPath = path.join(process.cwd(), 'prisma/schema.prisma');
        return fs.existsSync(prismaPath);
      },
      message: 'Prisma schema definition not found.'
    },
    {
      name: 'Disk Write Permission',
      check: () => {
        try {
          const testFile = path.join(process.cwd(), '.health-test');
          fs.writeFileSync(testFile, 'ok');
          fs.unlinkSync(testFile);
          return true;
        } catch {
          return false;
        }
      },
      message: 'Write permissions denied on project root.'
    }
  ];
  
  console.log('🏛️  [AUDIT] Abraham of London System Health Check\n');
  
  let allPassed = true;
  const results: string[] = [];
  
  requirements.forEach(req => {
    const passed = req.check();
    const status = passed ? '✅' : '❌';
    results.push(`${status} ${req.name.padEnd(20)} : ${passed ? 'VALIDATED' : req.message}`);
    if (!passed) allPassed = false;
  });

  console.log(results.join('\n'));
  
  if (!allPassed) {
    console.error('\n🚨 [CRITICAL] System environment failed verification.');
    console.error('🛡️  Abraham of London: Build aborted to prevent data corruption.');
    process.exit(1);
  }
  
  console.log('\n✨ [AUDIT_PASSED] Environment authorized for production build.');
}

checkRequirements();