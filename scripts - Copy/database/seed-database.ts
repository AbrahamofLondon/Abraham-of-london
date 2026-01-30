/* scripts/database/seed-database.ts */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');
  
  // Clear existing data (optional)
  console.log('🧹 Clearing existing data...');
  try {
    // Clear in correct order (respect foreign key constraints)
    const tables = [
      'download_audit_events',
      'short_interactions', 
      'strategy_room_intakes',
      'inner_circle_keys',
      'inner_circle_members',
      'api_rate_limits',
      'content_metadata',
      'system_audit_logs',
      'sessions',
      'cache_entries',
      'system_configs',
      'failed_jobs',
      'maintenance_logs'
    ];

    // Using raw SQL to clear tables
    for (const table of tables) {
      try {
        await prisma.$executeRawUnsafe(`DELETE FROM ${table}`);
        console.log(`  ✅ Cleared ${table}`);
      } catch (error) {
        console.log(`  ℹ️  Could not clear ${table} (might not exist yet)`);
      }
    }
    
    console.log('✅ Cleared existing data');
  } catch (error) {
    console.log('ℹ️  Error clearing data:', error.message);
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
  
  const createdMembers = [];
  for (const memberData of members) {
    const member = await prisma.innerCircleMember.create({
      data: memberData
    });
    createdMembers.push(member);
    console.log(`✅ Created member: ${member.name} (${member.tier})`);
    
    // Create a key for each member
    await prisma.innerCircleKey.create({
      data: {
        memberId: member.id,
        keyHash: `key_${member.emailHashPrefix}${Date.now()}_${Math.random().toString(36).substring(2, 10)}`,
        keySuffix: member.emailHashPrefix.replace('_', ''),
        status: 'active',
        keyType: member.tier === 'admin' ? 'admin' : 'standard',
        totalUnlocks: 0
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
      uniqueDownloaders: 85,
      viewCount: 500,
      shareCount: 45,
      likeCount: 120,
      commentCount: 23,
      rating: 4.7,
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
      uniqueDownloaders: 67,
      viewCount: 320,
      shareCount: 32,
      likeCount: 95,
      commentCount: 18,
      rating: 4.5,
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
      uniqueDownloaders: 52,
      viewCount: 210,
      shareCount: 28,
      likeCount: 78,
      commentCount: 12,
      rating: 4.3,
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

  // Create sample system configs
  console.log('\n⚙️ Creating system configurations...');
  const configs = [
    {
      key: 'site_title',
      value: JSON.stringify('Abraham of London'),
      type: 'string',
      category: 'general',
      description: 'Website title',
      isPublic: true
    },
    {
      key: 'maintenance_mode',
      value: JSON.stringify(false),
      type: 'boolean',
      category: 'system',
      description: 'Maintenance mode status',
      isPublic: false
    },
    {
      key: 'rate_limit_requests',
      value: JSON.stringify(100),
      type: 'number',
      category: 'security',
      description: 'Maximum requests per window',
      isPublic: false
    }
  ];

  for (const config of configs) {
    await prisma.systemConfig.create({
      data: config
    });
    console.log(`✅ Created config: ${config.key}`);
  }
  
  console.log('\n🎉 Database seeding completed!');
  console.log('\n📊 Summary:');
  console.log(`   👥 Members: ${members.length}`);
  console.log(`   🔑 Access Keys: ${members.length}`);
  console.log(`   📄 Content Items: ${contentItems.length}`);
  console.log(`   ⚙️ Configurations: ${configs.length}`);
  console.log(`   📋 Audit Logs: 1`);
  
  console.log('\n🔗 Database URL:', process.env.DATABASE_URL);
}

main()
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });