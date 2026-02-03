#!/usr/bin/env tsx
/* prisma/seed.ts — THE SOVEREIGN ARCHIVE INITIALIZATION [V3.0.0] */

import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';
import path from 'path';
import { hashEmail, encryptDocument } from '../lib/security';

// Initialize environment variables
config({ path: path.resolve(process.cwd(), '.env') });

const prisma = new PrismaClient();

async function seed() {
  console.log('🚀 INITIALIZING SOVEREIGN ARCHIVE...');
  const startTime = Date.now();

  try {
    // 1. SYSTEM CONFIGURATION
    const systemConfigs = [
      { key: 'app.version', value: '1.1.0', type: 'string', description: 'Sovereign OS Version', isPublic: true },
      { key: 'security.encryption_mode', value: 'AES-256-GCM', type: 'string', description: 'Active Cipher' }
    ];

    for (const cfg of systemConfigs) {
      await prisma.systemConfig.upsert({
        where: { key: cfg.key },
        update: cfg,
        create: cfg,
      });
    }

    // 2. DIRECTORATE ELEVATION
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

    // 3. PORTFOLIO & CANON ASSETS
    // Example including your "Restricted" document
    const assets = [
      {
        slug: 'frontier-resilience-01',
        title: 'Institutional Resilience in Frontier Markets',
        classification: 'Restricted', // TRIGGER ENCRYPTION
        rawContent: 'This is highly sensitive intelligence regarding MGM models...',
        metadata: { series: 'Frontier Strategy', volume: 1 }
      },
      {
        slug: 'public-blog-post',
        title: 'Welcome to the Archive',
        classification: 'Public', // STAY PLAINTEXT
        rawContent: 'This is a public welcome message.',
        metadata: { series: 'Announcements' }
      }
    ];

    console.log(`📚 PROCESSING ${assets.length} ASSETS...`);

    for (const asset of assets) {
      let contentToStore = asset.rawContent;
      let securityMetadata = {};

      // Logic: Encryption for Restricted or Private assets
      if (asset.classification === 'Restricted' || asset.classification === 'Private') {
        console.log(`🔒 ENCRYPTING: ${asset.slug}`);
        const encrypted = encryptDocument(asset.rawContent);
        contentToStore = encrypted.content;
        securityMetadata = {
          iv: encrypted.iv,
          authTag: encrypted.authTag,
          isEncrypted: true
        };
      }

      await prisma.contentMetadata.upsert({
        where: { slug: asset.slug },
        update: {
          title: asset.title,
          classification: asset.classification,
          content: contentToStore,
          metadata: JSON.stringify({ ...asset.metadata, ...securityMetadata })
        },
        create: {
          slug: asset.slug,
          title: asset.title,
          classification: asset.classification,
          content: contentToStore,
          metadata: JSON.stringify({ ...asset.metadata, ...securityMetadata })
        }
      });
    }

    // 4. SYSTEM AUDIT LOG
    await prisma.systemAuditLog.create({
      data: {
        actorType: 'SYSTEM',
        actorId: adminMember.id,
        actorEmail: adminEmail,
        action: 'DATABASE_SEED_COMPLETE',
        resourceType: 'PORTFOLIO',
        resourceId: 'SEED_V3',
        status: 'SUCCESS',
        severity: 'info',
        metadata: JSON.stringify({ assetsProcessed: assets.length }),
      },
    });

    console.log(`✅ SYNC COMPLETE [${Date.now() - startTime}ms]`);

  } catch (error) {
    console.error('❌ SEED FAILURE:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seed();