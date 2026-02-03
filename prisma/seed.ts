#!/usr/bin/env tsx
/* prisma/seed.ts — THE SOVEREIGN ARCHIVE INITIALIZATION [V2.7.1] */

import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';
import path from 'path';
import { createHash } from 'crypto';

// Initialize environment variables
config({ path: path.resolve(process.cwd(), '.env') });

const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

/**
 * Security: SHA-256 hashing for Inner Circle anonymity.
 */
function hashEmail(email: string): string {
  return createHash('sha256').update(email.toLowerCase().trim()).digest('hex');
}

async function seed() {
  console.log('🚀 INITIALIZING SOVEREIGN ARCHIVE...');
  const startTime = Date.now();

  try {
    // 1. SYSTEM CONFIGURATION
    console.log('⚙️ CONFIGURING SYSTEM PARAMETERS...');
    const systemConfigs = [
      { key: 'app.version', value: '1.0.0', type: 'string', description: 'Sovereign OS Version', isPublic: true },
      { key: 'security.tier_clearance', value: 'Level 3', type: 'string', description: 'Active security protocol' },
      { key: 'portfolio.total_assets', value: '75', type: 'number', description: 'Target brief count' }
    ];

    for (const cfg of systemConfigs) {
      await prisma.systemConfig.upsert({
        where: { key: cfg.key },
        update: cfg,
        create: cfg,
      });
    }

    // 2. INITIAL ADMIN ELEVATION
    // Target: info@abrahamoflondon.org
    const adminEmail = process.env.INITIAL_ADMIN_EMAIL || 'info@abrahamoflondon.org';
    const adminEmailHash = hashEmail(adminEmail);
    
    console.log('🔑 ELEVATING DIRECTORATE ACCESS...');
    const adminMember = await prisma.innerCircleMember.upsert({
      where: { emailHash: adminEmailHash },
      update: { status: 'active', tier: 'admin', role: 'ADMIN' },
      create: {
        emailHash: adminEmailHash,
        emailHashPrefix: adminEmailHash.substring(0, 10),
        email: adminEmail, 
        name: 'Director',
        tier: 'admin',
        role: 'ADMIN',
        status: 'active',
        loginCount: 1,
      },
    });

    // 3. THE 75 INTELLIGENCE BRIEFS
    console.log('📚 GENERATING PORTFOLIO: 75 ASSETS...');
    
    const foundationalBriefs = [
      {
        slug: 'legacy-architecture-canvas',
        title: 'The Legacy Architecture Canvas',
        contentType: 'PDF',
        version: '1.2.0',
        classification: 'Level 3',
        tags: JSON.stringify(['legacy', 'governance']),
        metadata: JSON.stringify({ category: 'Special Ops' })
      },
      {
        slug: 'ultimate-purpose-of-man',
        title: 'The Ultimate Purpose of Man',
        contentType: 'PDF',
        version: '1.0.1',
        classification: 'Level 1',
        tags: JSON.stringify(['philosophy', 'editorial']),
        metadata: JSON.stringify({ category: 'Theology' })
      }
    ];

    const generatedBriefs = Array.from({ length: 73 }).map((_, i) => {
      const idNum = 100 + i;
      return {
        slug: `intelligence-brief-${idNum}`,
        title: `Intelligence Brief ${idNum}: Global Strategic Analysis`,
        contentType: 'PDF',
        version: '1.0.0',
        classification: i % 10 === 0 ? 'Level 3' : 'Level 2',
        tags: JSON.stringify(['strategy', 'intelligence', '2026']),
        metadata: JSON.stringify({ category: i % 2 === 0 ? 'Geopolitical' : 'Economic', index: idNum })
      };
    });

    const allBriefs = [...foundationalBriefs, ...generatedBriefs];

    for (const brief of allBriefs) {
      await prisma.contentMetadata.upsert({
        where: { slug: brief.slug },
        update: brief,
        create: brief,
      });
    }

    // 4. SYSTEM AUDIT LOG
console.log('📝 RECORDING INITIALIZATION AUDIT...');
await prisma.systemAuditLog.create({
  data: {
    actorType: 'SYSTEM',
    actorId: adminMember.id,
    actorEmail: adminEmail, // Required by schema
    action: 'DATABASE_SEED_COMPLETE',
    resourceType: 'PORTFOLIO',
    resourceId: 'INITIAL_SEED', // Required by schema
    status: 'SUCCESS',
    severity: 'info',
    metadata: JSON.stringify({ 
      count: allBriefs.length, 
      schemaVersion: '2.7.0' 
    }), // Required by schema
  },
});

    const duration = Date.now() - startTime;
    console.log(`✅ PORTFOLIO SYNC COMPLETE: ${allBriefs.length} ASSETS READY. [${duration}ms]`);

  } catch (error) {
    console.error('❌ SEED FAILURE:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seed();