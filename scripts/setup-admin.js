// scripts/setup-admin.js
const { hash } = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function setupAdminUser() {
  const username = process.argv[2] || 'admin';
  const password = process.argv[3] || 'admin123';
  const email = process.argv[4] || 'admin@abrahamoflondon.com';
  const role = process.argv[5] || 'superadmin';

  if (!password || password.length < 8) {
    console.error('Password must be at least 8 characters');
    process.exit(1);
  }

  try {
    const passwordHash = await hash(password, 12);
    
    const adminUser = await prisma.adminUser.create({
      data: {
        username,
        passwordHash,
        email,
        role,
        permissions: JSON.stringify([
          'admin:read',
          'admin:write',
          'users:manage',
          'content:manage',
          'analytics:view'
        ]),
        status: 'active',
        emailVerifiedAt: new Date(),
        passwordChangedAt: new Date()
      }
    });

    console.log('✅ Admin user created successfully:');
    console.log(`   Username: ${adminUser.username}`);
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Role: ${adminUser.role}`);
    console.log(`   ID: ${adminUser.id}`);
    console.log('\n⚠️  IMPORTANT: Change the password immediately after first login!');
    
  } catch (error) {
    console.error('❌ Failed to create admin user:', error.message);
    if (error.code === 'P2002') {
      console.error('   A user with that username or email already exists.');
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

setupAdminUser();