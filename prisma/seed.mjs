// prisma/seed.mjs
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');
  
  // Clear existing data (optional)
  console.log('🧹 Clearing existing data...');
  try {
    await prisma.$executeRaw`DELETE FROM inner_circle_members`;
    await prisma.$executeRaw`DELETE FROM inner_circle_keys`;
    await prisma.$executeRaw`DELETE FROM content_metadata`;
    console.log('✅ Cleared existing data');
  } catch (error) {
    console.log('ℹ️  No existing data to clear (or tables empty)');
  }
  
  // Create sample Inner Circle Members
  console.log('\n👤 Creating sample members...');
  const members = [
    {
      emailHash: 'sample_member_1_' + Date.now(),
      emailHashPrefix: 'mem1_',
      name: 'Alex Johnson',
      status: 'active',
      tier: 'premium'
    },
    {
      emailHash: 'sample_member_2_' + Date.now(),
      emailHashPrefix: 'mem2_',
      name: 'Sarah Williams',
      status: 'active',
      tier: 'standard'
    },
    {
      emailHash: 'sample_admin_' + Date.now(),
      emailHashPrefix: 'admin_',
      name: 'System Administrator',
      status: 'active',
      tier: 'admin'
    }
  ];
  
  for (const memberData of members) {
    const member = await prisma.innerCircleMember.create({
      data: memberData
    });
    console.log(`✅ Created member: ${member.name}`);
    
    // Create a key for each member
    await prisma.innerCircleKey.create({
      data: {
        memberId: member.id,
        keyHash: `key_${member.emailHashPrefix}${Date.now()}_${Math.random().toString(36).substr(2, 8)}`,
        keySuffix: member.emailHashPrefix.replace('_', ''),
        status: 'active',
        keyType: member.tier === 'admin' ? 'admin' : 'standard'
      }
    });
    console.log(`  🔑 Created access key`);
  }
  
  // Create sample content
  console.log('\n📄 Creating sample content...');
  const contentItems = [
    {
      slug: 'business-frameworks-2024',
      title: 'Business Strategy Frameworks 2024',
      contentType: 'pdf',
      totalDownloads: 125,
      viewCount: 500,
      tags: JSON.stringify(['strategy', 'business', 'frameworks']),
      metadata: JSON.stringify({
        pages: 42,
        fileSize: '2.4MB',
        category: 'Business',
        published: '2024-01-15'
      })
    },
    {
      slug: 'leadership-playbook',
      title: 'Modern Leadership Playbook',
      contentType: 'pdf',
      totalDownloads: 89,
      viewCount: 320,
      tags: JSON.stringify(['leadership', 'management', 'guide']),
      metadata: JSON.stringify({
        pages: 36,
        fileSize: '1.8MB',
        category: 'Leadership',
        published: '2024-02-20'
      })
    },
    {
      slug: 'innovation-methodologies',
      title: 'Innovation Methodologies Guide',
      contentType: 'pdf',
      totalDownloads: 67,
      viewCount: 210,
      tags: JSON.stringify(['innovation', 'methodology', 'research']),
      metadata: JSON.stringify({
        pages: 28,
        fileSize: '1.5MB',
        category: 'Innovation',
        published: '2024-03-10'
      })
    }
  ];
  
  for (const content of contentItems) {
    await prisma.contentMetadata.create({
      data: content
    });
    console.log(`✅ Created content: ${content.title}`);
  }
  
  // Create sample audit logs
  console.log('\n📋 Creating sample audit logs...');
  await prisma.systemAuditLog.create({
    data: {
      actorType: 'system',
      action: 'database_seed',
      resourceType: 'database',
      resourceId: 'seed_' + Date.now(),
      status: 'success',
      severity: 'low',
      category: 'setup',
      metadata: JSON.stringify({
        seedVersion: '1.0',
        timestamp: new Date().toISOString(),
        itemsCreated: {
          members: members.length,
          keys: members.length,
          content: contentItems.length
        }
      })
    }
  });
  
  console.log('\n🎉 Database seeding completed!');
  console.log('\n📊 Summary:');
  console.log(`   👥 Members: ${members.length}`);
  console.log(`   🔑 Access Keys: ${members.length}`);
  console.log(`   📄 Content Items: ${contentItems.length}`);
  console.log(`   📋 Audit Logs: 1`);
}

main()
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });