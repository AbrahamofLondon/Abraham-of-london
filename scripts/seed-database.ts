// scripts/seed-database.ts
import { PrismaClient } from '@prisma/client';
import { createHash } from 'crypto';

// Helper function to hash emails
function hashEmail(email: string): string {
  return createHash('sha256')
    .update(email.toLowerCase().trim())
    .digest('hex');
}

// Create Prisma client with SQLite adapter
const prisma = new PrismaClient({
  adapter: {
    kind: 'sqlite',
    url: 'file:./prisma/dev.db',
  },
  log: ['info', 'warn'],
});

async function main() {
  console.log('🌱 Starting database seed for Abraham of London...');
  
  try {
    // 1. Seed System Configurations
    console.log('⚙️  Creating system configurations...');
    const systemConfigs = [
      {
        key: 'app.name',
        value: JSON.stringify('Abraham of London'),
        type: 'string',
        category: 'general',
        description: 'Application name',
        isPublic: true,
      },
      {
        key: 'app.version',
        value: JSON.stringify('1.0.0'),
        type: 'string',
        category: 'general',
        description: 'Application version',
        isPublic: false,
      },
      {
        key: 'app.description',
        value: JSON.stringify('Platform for business insights and leadership content'),
        type: 'string',
        category: 'general',
        description: 'Application description',
        isPublic: true,
      },
      {
        key: 'security.require_auth',
        value: JSON.stringify(false),
        type: 'boolean',
        category: 'security',
        description: 'Require authentication for content access',
        isPublic: false,
      },
      {
        key: 'features.enable_downloads',
        value: JSON.stringify(true),
        type: 'boolean',
        category: 'features',
        description: 'Enable download functionality',
        isPublic: false,
      },
    ];

    for (const config of systemConfigs) {
      const result = await prisma.systemConfig.upsert({
        where: { key: config.key },
        update: config,
        create: config,
      });
      console.log(`✅ Config: ${result.key}`);
    }

    // 2. Seed Inner Circle Members
    console.log('👥 Creating inner circle members...');
    const members = [
      {
        email: 'admin@abrahamoflondon.com',
        name: 'System Administrator',
        tier: 'admin',
        status: 'active',
      },
      {
        email: 'editor@abrahamoflondon.com',
        name: 'Content Editor',
        tier: 'premium',
        status: 'active',
      },
      {
        email: 'member@abrahamoflondon.com',
        name: 'Premium Member',
        tier: 'premium',
        status: 'active',
      },
      {
        email: 'viewer@abrahamoflondon.com',
        name: 'Basic Viewer',
        tier: 'standard',
        status: 'active',
      },
    ];

    for (const memberData of members) {
      const emailHash = hashEmail(memberData.email);
      const emailHashPrefix = emailHash.substring(0, 8);
      
      const result = await prisma.innerCircleMember.upsert({
        where: { emailHash },
        update: {
          name: memberData.name,
          status: memberData.status as any,
          tier: memberData.tier as any,
          lastSeenAt: new Date(),
        },
        create: {
          emailHash,
          emailHashPrefix,
          name: memberData.name,
          email: memberData.email,
          status: memberData.status as any,
          tier: memberData.tier as any,
          loginCount: 1,
          lastSeenAt: new Date(),
        },
      });
      console.log(`✅ Member: ${result.name} (${result.tier})`);
    }

    // 3. Seed Content Metadata
    console.log('📚 Creating content metadata...');
    const contentItems = [
      {
        slug: 'welcome-to-inner-circle',
        title: 'Welcome to the Inner Circle',
        contentType: 'guide',
        description: 'Getting started guide for new members',
        tags: JSON.stringify(['welcome', 'guide', 'introduction']),
        metadata: JSON.stringify({  // Use JSON.stringify instead of object
        script: 'seed-database.ts',
        timestamp: new Date().toISOString(),
        recordsCreated: {
        systemConfigs: systemConfigs.length,
        members: members.length,
        contentItems: contentItems.length,
       },
     }),
        slug: 'business-strategy-2024',
        title: 'Advanced Business Strategy for 2024',
        contentType: 'ebook',
        description: 'Comprehensive guide to modern business strategies',
        tags: JSON.stringify(['business', 'strategy', '2024', 'advanced']),
        metadata: JSON.stringify({
          author: 'Abraham of London',
          published: true,
          wordCount: 15000,
          readingTime: '60 min',
          difficulty: 'advanced',
          downloads: 0,
        }),
      },
      {
        slug: 'leadership-framework',
        title: 'Modern Leadership Framework',
        contentType: 'whitepaper',
        description: 'Framework for effective leadership in the digital age',
        tags: JSON.stringify(['leadership', 'framework', 'management']),
        metadata: JSON.stringify({
          author: 'Abraham of London',
          published: true,
          wordCount: 8000,
          readingTime: '30 min',
          difficulty: 'intermediate',
        }),
      },
      {
        slug: 'digital-transformation',
        title: 'Digital Transformation Roadmap',
        contentType: 'template',
        description: 'Step-by-step template for digital transformation',
        tags: JSON.stringify(['digital', 'transformation', 'template', 'roadmap']),
        metadata: JSON.stringify({
          author: 'Abraham of London',
          published: true,
          wordCount: 5000,
          readingTime: '20 min',
          difficulty: 'intermediate',
        }),
      },
    ];

    for (const content of contentItems) {
      const result = await prisma.contentMetadata.upsert({
        where: { slug: content.slug },
        update: content,
        create: content,
      });
      console.log(`✅ Content: ${result.title}`);
    }

    // 4. Create Inner Circle Keys for members
    console.log('🔑 Creating access keys...');
    const adminMember = await prisma.innerCircleMember.findFirst({
      where: { tier: 'admin' },
    });

    if (adminMember) {
      const key = await prisma.innerCircleKey.create({
        data: {
          memberId: adminMember.id,
          keyHash: hashEmail('admin-key-' + Date.now()),
          keySuffix: 'adminkey',
          status: 'active',
          totalUnlocks: 0,
          keyType: 'admin',
          metadata: JSON.stringify({
            createdBy: 'seed-script',
            permissions: ['all'],
          }),
        },
      });
      console.log(`✅ Admin key created: ${key.keySuffix}`);
    }

    // 5. Create sample audit log
    console.log('📋 Creating audit log entry...');
    await prisma.systemAuditLog.create({
      data: {
        actorType: 'system',
        actorId: 'seed-script',
        actorEmail: 'system@abrahamoflondon.com',
        action: 'database.seed.complete',
        resourceType: 'database',
        resourceId: 'all',
        status: 'success',
        severity: 'low',
        metadata: {
          script: 'seed-database.ts',
          timestamp: new Date().toISOString(),
          recordsCreated: {
            systemConfigs: systemConfigs.length,
            members: members.length,
            contentItems: contentItems.length,
          },
        },
        category: 'system',
        subCategory: 'maintenance',
      },
    });
    console.log('✅ Audit log created');

    console.log('\n✨ ===================================== ✨');
    console.log('🎉 SEED COMPLETED SUCCESSFULLY!');
    console.log('✨ ===================================== ✨');
    console.log('\n📊 Summary:');
    console.log(`   ⚙️  System Configs: ${systemConfigs.length}`);
    console.log(`   👥 Members: ${members.length}`);
    console.log(`   📚 Content Items: ${contentItems.length}`);
    console.log(`   🔑 Access Keys: 1`);
    console.log(`   📋 Audit Logs: 1`);
    console.log('\n🚀 Database is ready for development!');

  } catch (error: any) {
    console.error('\n❌ SEED FAILED:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

main()
  .finally(async () => {
    await prisma.$disconnect();
    console.log('\n🔌 Database connection closed');
  });