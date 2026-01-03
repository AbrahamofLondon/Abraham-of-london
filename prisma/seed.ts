#!/usr/bin/env tsx
// prisma/seed.ts
// Production-grade database seeder with idempotent operations

import { PrismaClient, Prisma } from '@prisma/client';
import { config } from 'dotenv';
import path from 'path';
import { createHash } from 'crypto';

config({ path: path.resolve(process.cwd(), '.env') });

const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

// Helper functions
function hashEmail(email: string): string {
  return createHash('sha256').update(email.toLowerCase().trim()).digest('hex');
}

function generateKeyHash(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

async function seed() {
  console.log('🚀 Starting database seed...');
  const startTime = Date.now();

  try {
    // ==================== SYSTEM CONFIGURATION ====================
    console.log('📝 Seeding system configuration...');
    
    const systemConfigs = [
      {
        key: 'app.version',
        value: JSON.stringify('1.0.0'),
        type: 'string',
        description: 'Application version',
        isPublic: true,
      },
      {
        key: 'security.rate_limit.default',
        value: JSON.stringify(100),
        type: 'number',
        description: 'Default API rate limit per hour',
      },
      {
        key: 'content.default_tier',
        value: JSON.stringify('free'),
        type: 'string',
        description: 'Default content access tier',
      },
      {
        key: 'email.smtp_enabled',
        value: JSON.stringify(false),
        type: 'boolean',
        description: 'SMTP email service enabled',
      },
      {
        key: 'analytics.retention_days',
        value: JSON.stringify(365),
        type: 'number',
        description: 'Days to retain analytics data',
      },
    ];

    for (const config of systemConfigs) {
      await prisma.systemConfig.upsert({
        where: { key: config.key },
        update: config,
        create: config,
      });
    }

    // ==================== INITIAL ADMIN MEMBER ====================
    console.log('👑 Creating initial admin member...');
    
    const adminEmail = process.env.INITIAL_ADMIN_EMAIL || 'admin@abrahamoflondon.com';
    const adminEmailHash = hashEmail(adminEmail);
    
    const adminMember = await prisma.innerCircleMember.upsert({
      where: { emailHash: adminEmailHash },
      update: {
        name: 'System Administrator',
        tier: 'admin',
        status: 'active',
        isVerified: true,
      },
      create: {
        emailHash: adminEmailHash,
        emailHashPrefix: adminEmailHash.substring(0, 10),
        email: adminEmail,
        name: 'System Administrator',
        tier: 'admin',
        status: 'active',
        isVerified: true,
        joinedAt: new Date(),
        preferences: JSON.stringify({
          theme: 'dark',
          notifications: true,
          language: 'en',
        }),
      },
    });

    // ==================== ADMIN API KEY ====================
    console.log('🔑 Creating admin API key...');
    
    const adminApiKey = process.env.INITIAL_ADMIN_API_KEY || 'admin-' + Date.now();
    const keyHash = generateKeyHash(adminApiKey);
    
    await prisma.innerCircleKey.upsert({
      where: { keyHash },
      update: {
        status: 'active',
        lastUsedAt: new Date(),
      },
      create: {
        memberId: adminMember.id,
        keyHash,
        keySuffix: adminApiKey.slice(-8),
        keyType: 'admin',
        status: 'active',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        metadata: JSON.stringify({
          description: 'Initial admin key',
          generatedBy: 'seed',
          permissions: ['*'],
        }),
      },
    });

    // ==================== SAMPLE CONTENT ====================
    console.log('📚 Creating sample content metadata...');
    
    const sampleContent = [
      {
        slug: 'legacy-architecture-canvas',
        title: 'The Legacy Architecture Canvas',
        description: 'Heirloom-grade fillable PDF for designing sovereign legacies',
        contentType: 'PDF',
        tierRequirement: 'architect',
        requiresAuth: true,
        category: 'legacy',
        tags: JSON.stringify(['legacy', 'governance', 'canvas', 'premium']),
        totalDownloads: 0,
        uniqueDownloaders: 0,
        publishedAt: new Date(),
      },
      {
        slug: 'ultimate-purpose-of-man',
        title: 'The Ultimate Purpose of Man',
        description: 'Definitive editorial examining the structural logic of human purpose.',
        contentType: 'PDF',
        tierRequirement: 'member',
        requiresAuth: false,
        category: 'theology',
        tags: JSON.stringify(['purpose', 'philosophy', 'editorial']),
        totalDownloads: 0,
        uniqueDownloaders: 0,
        publishedAt: new Date(),
      },
      {
        slug: 'strategic-foundations',
        title: 'Strategic Foundations',
        description: 'Core frameworks for institutional thinking and leadership.',
        contentType: 'PDF',
        tierRequirement: 'member',
        requiresAuth: false,
        category: 'leadership',
        tags: JSON.stringify(['strategy', 'framework', 'leadership']),
        totalDownloads: 0,
        uniqueDownloaders: 0,
        publishedAt: new Date(),
      },
    ];

    for (const content of sampleContent) {
      await prisma.contentMetadata.upsert({
        where: { slug: content.slug },
        update: content,
        create: content,
      });
    }

    // ==================== INITIAL AUDIT LOG ====================
    console.log('📋 Creating initial audit log...');
    
    await prisma.systemAuditLog.create({
      data: {
        actorType: 'SYSTEM',
        actorId: adminMember.id,
        actorEmail: adminEmail,
        actorName: 'System Administrator',
        action: 'DATABASE_SEED',
        resourceType: 'SYSTEM',
        resourceId: 'seed',
        status: 'SUCCESS',
        severity: 'LOW',
        metadata: {
          seedVersion: '1.0.0',
          timestamp: new Date().toISOString(),
          environment: process.env.NODE_ENV,
        },
        category: 'SYSTEM',
        subCategory: 'MAINTENANCE',
      },
    });

    // ==================== CACHE ENTRIES ====================
    console.log('💾 Creating cache entries...');
    
    const cacheEntries = [
      {
        key: 'content:list:all',
        namespace: 'content',
        value: JSON.stringify({ cached: true, timestamp: Date.now() }),
        expiresAt: new Date(Date.now() + 3600000), // 1 hour
        tags: JSON.stringify(['content', 'list']),
        hits: 0,
      },
      {
        key: 'members:count',
        namespace: 'analytics',
        value: JSON.stringify({ count: 1, timestamp: Date.now() }),
        expiresAt: new Date(Date.now() + 300000), // 5 minutes
        tags: JSON.stringify(['analytics', 'members']),
        hits: 0,
      },
    ];

    for (const entry of cacheEntries) {
      await prisma.cacheEntry.upsert({
        where: { key: entry.key },
        update: entry,
        create: entry,
      });
    }

    const duration = Date.now() - startTime;
    console.log(`✅ Database seed completed in ${duration}ms`);
    
    // Summary
    const summary = await prisma.$transaction([
      prisma.innerCircleMember.count(),
      prisma.innerCircleKey.count(),
      prisma.contentMetadata.count(),
      prisma.systemConfig.count(),
      prisma.cacheEntry.count(),
    ]);

    console.log('\n📊 Seed Summary:');
    console.log(`   Members: ${summary[0]}`);
    console.log(`   API Keys: ${summary[1]}`);
    console.log(`   Content Items: ${summary[2]}`);
    console.log(`   Config Entries: ${summary[3]}`);
    console.log(`   Cache Entries: ${summary[4]}`);

  } catch (error) {
    console.error('❌ Database seed failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Execute seed
if (require.main === module) {
  seed()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('💥 Fatal seed error:', error);
      process.exit(1);
    });
}

export { seed };