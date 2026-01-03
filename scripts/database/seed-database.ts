import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');
  
  const seedData = {
    users: [
      {
        email: 'admin@abrahamoflondon.org',
        name: 'System Admin',
        role: 'ADMIN'
      }
    ]
  };
  
  for (const user of seedData.users) {
    const exists = await prisma.user.findUnique({
      where: { email: user.email }
    });
    
    if (!exists) {
      await prisma.user.create({
        data: user
      });
      console.log(`✅ Created user: ${user.email}`);
    }
  }
  
  console.log('✅ Database seeded successfully');
}

main()
  .catch(error => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });