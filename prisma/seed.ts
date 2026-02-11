#!/usr/bin/env tsx
/* prisma/seed.ts — THE SOVEREIGN ARCHIVE INITIALIZATION [V4.0.3] */

import { PrismaClient, MemberRole, MemberTier, MemberStatus, Classification } from '@prisma/client';
import { config } from 'dotenv';
import path from 'path';
import fs from 'fs';
import { hashEmail, encryptDocument } from '../lib/security';

config({ path: path.resolve(process.cwd(), '.env') });
const prisma = new PrismaClient();
const REGISTRY_PATH = path.resolve(process.cwd(), 'public/assets/downloads/_generated.registry.json');

async function seed() {
  console.log('\x1b[35m🚀 INITIALIZING SOVEREIGN ARCHIVE...\x1b[0m');
  const startTime = Date.now();

  try {
    // 1. SYSTEM CONFIGURATION (New Model Support)
    console.log('⚙️ Configuring System...');
    const configs = [
      { key: 'app.version', value: '1.2.0', type: 'string' },
      { key: 'security.mode', value: 'AES-256-GCM', type: 'string' }
    ];

    for (const cfg of configs) {
      await prisma.systemConfig.upsert({
        where: { key: cfg.key },
        update: { value: cfg.value },
        create: { key: cfg.key, value: cfg.value, type: cfg.type },
      });
    }

    // 2. DIRECTORATE ELEVATION (Fixed to match Schema exactly)
    const adminEmail = process.env.INITIAL_ADMIN_EMAIL || 'info@abrahamoflondon.org';
    const adminEmailHash = hashEmail(adminEmail);
    
    console.log('🔑 ELEVATING DIRECTORATE ACCESS...');
    const adminMember = await prisma.innerCircleMember.upsert({
      where: { emailHash: adminEmailHash },
      update: { 
        role: MemberRole.ADMIN, 
        status: MemberStatus.active 
      },
      create: {
        emailHash: adminEmailHash,
        email: adminEmail, 
        name: 'Director',
        role: MemberRole.ADMIN,
        status: MemberStatus.active,
        tier: MemberTier.private // Uses the 'private' tier from your enum
      },
    });

    // 3. REGISTRY IMPORT
    if (fs.existsSync(REGISTRY_PATH)) {
      const registry = JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8'));
      const assets = registry.entries || [];
      console.log(`📦 Processing ${assets.length} assets from registry.`);

      for (const asset of assets) {
        let contentToStore = asset.description || asset.title;
        let securityMetadata: any = { 
          sha256: asset.sha256,
          fileSize: asset.fileSizeLabel,
          isEncrypted: false 
        };

        // Determine if encryption is required
        if (asset.tier === 'architect' || asset.tier === 'private') {
          const encrypted = encryptDocument(contentToStore);
          contentToStore = encrypted.content;
          securityMetadata.iv = encrypted.iv;
          securityMetadata.authTag = encrypted.authTag;
          securityMetadata.isEncrypted = true;
        }

        await prisma.contentMetadata.upsert({
          where: { slug: asset.id },
          update: {
            title: asset.title,
            content: contentToStore,
            metadata: securityMetadata,
            classification: asset.tier === 'architect' ? Classification.RESTRICTED : Classification.PUBLIC
          },
          create: {
            slug: asset.id,
            title: asset.title,
            content: contentToStore,
            metadata: securityMetadata,
            classification: asset.tier === 'architect' ? Classification.RESTRICTED : Classification.PUBLIC
          }
        });
      }
    } else {
      console.log('\x1b[33m⚠️ No registry found. Assets will not be seeded.\x1b[0m');
    }

    console.log(`\x1b[32m✅ ARCHIVE SYNC COMPLETE [${Date.now() - startTime}ms]\x1b[0m`);
  } catch (error) {
    console.error('\x1b[31m❌ SEED FAILURE:\x1b[0m', error);
  } finally {
    await prisma.$disconnect();
  }
}

seed();