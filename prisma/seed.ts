#!/usr/bin/env tsx
/* prisma/seed.ts — THE SOVEREIGN ARCHIVE INITIALIZATION */

import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';
import path from 'path';
import { createHash } from 'crypto';

config({ path: path.resolve(process.cwd(), '.env') });

const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

// Security: High-fidelity hashing for Inner Circle anonymity
function hashEmail(email: string): string {
  return createHash('sha256').update(email.toLowerCase().trim()).digest('hex');
}

function generateKeyHash(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

async function seed() {
  console.log('🚀 INITIALIZING SOVEREIGN ARCHIVE...');
  const startTime = Date.now();

  try {
    // 1. SYSTEM CONFIGURATION
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
    const adminEmail = process.env.INITIAL_ADMIN_EMAIL || 'admin@abrahamoflondon.com';
    const adminEmailHash = hashEmail(adminEmail);
    
    const adminMember = await prisma.innerCircleMember.upsert({
      where: { emailHash: adminEmailHash },
      update: { status: 'active', tier: 'admin' },
      create: {
        emailHash: adminEmailHash,
        emailHashPrefix: adminEmailHash.substring(0, 10),
        email: adminEmail,
        name: 'Director',
        tier: 'admin',
        status: 'active',
        loginCount: 1,
      },
    });

    // 3. THE 75 INTELLIGENCE BRIEFS (CONTENT METADATA)
    console.log('📚 GENERATING PORTFOLIO: 75 ASSETS...');
    
    // Core foundational briefs
    const foundationalBriefs = [
      {
        slug: 'legacy-architecture-canvas',
        title: 'The Legacy Architecture Canvas',
        contentType: 'PDF',
        tags: JSON.stringify(['legacy', 'governance']),
        metadata: JSON.stringify({ category: 'Special Ops', classification: 'Level 3' })
      },
      {
        slug: 'ultimate-purpose-of-man',
        title: 'The Ultimate Purpose of Man',
        contentType: 'PDF',
        tags: JSON.stringify(['philosophy', 'editorial']),
        metadata: JSON.stringify({ category: 'Theology', classification: 'Level 1' })
      }
    ];

    // Systematic generation of the remaining briefs to reach 75
    const generatedBriefs = Array.from({ length: 73 }).map((_, i) => ({
      slug: `intelligence-brief-${100 + i}`,
      title: `Intelligence Brief ${100 + i}: Global Strategic Analysis`,
      contentType: 'PDF',
      tags: JSON.stringify(['strategy', 'intelligence', '2026']),
      metadata: JSON.stringify({ 
        category: i % 2 === 0 ? 'Geopolitical' : 'Economic', 
        classification: i % 10 === 0 ? 'Level 3' : 'Level 2' 
      })
    }));

    const allBriefs = [...foundationalBriefs, ...generatedBriefs];

    for (const brief of allBriefs) {
      await prisma.contentMetadata.upsert({
        where: { slug: brief.slug },
        update: brief,
        create: brief,
      });
    }

    // 4. INITIAL SYSTEM AUDIT LOG
    await prisma.systemAuditLog.create({
      data: {
        actorType: 'SYSTEM',
        actorId: adminMember.id,
        actorEmail: adminEmail,
        action: 'DATABASE_SEED_COMPLETE',
        resourceType: 'PORTFOLIO',
        status: 'SUCCESS',
        severity: 'info',
        metadata: JSON.stringify({ count: allBriefs.length, timestamp: new Date().toISOString() }),
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