// scripts/seed-alternative.ts
import { PrismaClient } from '@prisma/client';
import { createHash } from 'crypto';

function hashEmail(email: string): string {
  return createHash('sha256')
    .update(email.toLowerCase().trim())
    .digest('hex');
}

// Try with minimal configuration
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');
  
  try {
    // Just create one simple record to test
    const config = await prisma.systemConfig.create({
      data: {
        key: 'test.key',
        value: JSON.stringify('test value'),
        type: 'string',
        description: 'Test entry',
      },
    });
    
    console.log('✅ Created:', config.key);
    console.log('🎉 Basic seed worked!');
    
    // Now try to create more if basic worked
    console.log('Trying to create more data...');
    
    // Create a member
    const emailHash = hashEmail('test@abrahamoflondon.com');
    const member = await prisma.innerCircleMember.create({
      data: {
        emailHash,
        emailHashPrefix: emailHash.substring(0, 8),
        name: 'Test User',
        status: 'active',
        tier: 'standard',
        loginCount: 1,
      },
    });
    
    console.log('✅ Created member:', member.name);
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    
    // If it's an adapter issue, try a different approach
    if (error.message.includes('adapter')) {
      console.log('Trying alternative approach...');
      await tryAlternative();
    }
  }
}

async function tryAlternative() {
  // Use raw SQL to insert data
  const sqlite3 = require('sqlite3').verbose();
  const { open } = require('sqlite');
  
  const db = await open({
    filename: './prisma/dev.db',
    driver: sqlite3.Database,
  });
  
  // Insert system config
  await db.run(
    `INSERT OR IGNORE INTO system_configs (id, key, value, type, description) 
     VALUES (?, ?, ?, ?, ?)`,
    ['test-id-1', 'app.test', JSON.stringify('test'), 'string', 'Test config']
  );
  
  console.log('✅ Inserted data with raw SQL');
  await db.close();
}

main()
  .finally(() => {
    prisma.$disconnect();
    console.log('🔌 Disconnected');
  });