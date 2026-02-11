#!/usr/bin/env tsx
/* prisma/seed.ts — THE SOVEREIGN ARCHIVE INITIALIZATION [V4.0.0] */

import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';
import path from 'path';
import fs from 'fs';
import { hashEmail, encryptDocument } from '../lib/security';

// Initialize environment variables for institutional security
config({ path: path.resolve(process.cwd(), '.env') });

const prisma = new PrismaClient();
const REGISTRY_PATH = path.join(process.cwd(), 'public/assets/downloads/_generated.registry.json');

async function seed() {
  console.log('\x1b[35m🚀 INITIALIZING SOVEREIGN ARCHIVE [V4.0.0]...\x1b[0m');
  const startTime = Date.now();

  try {
    // 1. SYSTEM CONFIGURATION & CIPHER LOCK
    const systemConfigs = [
      { key: 'app.version', value: '1.2.0', type: 'string', description: 'Sovereign OS Version', isPublic: true },
      { key: 'security.encryption_mode', value: 'AES-256-GCM', type: 'string', description: 'Active Cipher' },
      { key: 'archive.status', value: 'OPERATIONAL', type: 'string', description: 'Portfolio State', isPublic: true }
    ];

    for (const cfg of systemConfigs) {
      await prisma.systemConfig.upsert({
        where: { key: cfg.key },
        update: cfg,
        create: cfg,
      });
    }

    // 2. DIRECTORATE ELEVATION (Admin Provisioning)
    const adminEmail = process.env.INITIAL_ADMIN_EMAIL || 'info@abrahamoflondon.org';
    const adminEmailHash = hashEmail(adminEmail);
    
    console.log('\x1b[36m🔑 ELEVATING DIRECTORATE ACCESS...\x1b[0m');
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

    // 3. REGISTRY INTEGRATION (Dynamic Asset Loading)
    let assetsToProcess = [];
    
    if (fs.existsSync(REGISTRY_PATH)) {
      console.log('\x1b[32m🧾 REGISTRY DETECTED: Importing generated brief metadata...\x1b[0m');
      const registryData = JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8'));
      assetsToProcess = registryData.entries.map((e: any) => ({
        slug: e.id,
        title: e.title,
        classification: e.tier === 'architect' ? 'Restricted' : 'Public',
        rawContent: e.description,
        metadata: {
          category: e.category,
          tier: e.tier,
          outputPath: e.outputPathWeb,
          fileSize: e.fileSizeLabel,
          sha256: e.sha256,
          version: e.version
        }
      }));
    } else {
      console.log('\x1b[33m⚠️ REGISTRY NOT FOUND: Falling back to manual seed defaults...\x1b[0m');
      assetsToProcess = [
        {
          slug: 'frontier-resilience-01',
          title: 'Institutional Resilience in Frontier Markets',
          classification: 'Restricted',
          rawContent: 'Primary MGMT intelligence for frontier institutional strategy.',
          metadata: { category: 'strategy', tier: 'architect' }
        }
      ];
    }

    console.log(`📚 PROCESSING ${assetsToProcess.length} CANON ASSETS...`);

    for (const asset of assetsToProcess) {
      let contentToStore = asset.rawContent;
      let securityMetadata = {};

      // 4. SECURITY GATE: Classification-based Encryption
      if (asset.classification === 'Restricted' || asset.classification === 'Private') {
        const encrypted = encryptDocument(asset.rawContent);
        contentToStore = encrypted.content;
        securityMetadata = {
          iv: encrypted.iv,
          authTag: encrypted.authTag,
          isEncrypted: true,
          cipher: 'AES-256-GCM'
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

    // 5. SYSTEM AUDIT LOGGING
    await prisma.systemAuditLog.create({
      data: {
        actorType: 'SYSTEM',
        actorId: adminMember.id,
        actorEmail: adminEmail,
        action: 'DATABASE_SEED_COMPLETE',
        resourceType: 'PORTFOLIO',
        resourceId: 'SEED_V4_INSTITUTIONAL',
        status: 'SUCCESS',
        severity: 'info',
        metadata: JSON.stringify({ 
          assetsProcessed: assetsToProcess.length,
          runtimeMs: Date.now() - startTime
        }),
      },
    });

    console.log(`\x1b[32m✅ ARCHIVE SYNC COMPLETE [${Date.now() - startTime}ms]\x1b[0m`);

  } catch (error) {
    console.error('\x1b[31m❌ SEED FAILURE:\x1b[0m', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seed();