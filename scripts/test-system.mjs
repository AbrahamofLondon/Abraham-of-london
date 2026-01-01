// scripts/test-system.mjs
import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

// Load environment
config({ path: path.join(rootDir, '.env') });
config({ path: path.join(rootDir, '.env.local') });

const prisma = new PrismaClient();

async function testSystem() {
  console.log('🧪 Testing Abraham of London System\n');
  
  // Test 1: Database Connection
  console.log('1️⃣  Testing Database Connection...');
  try {
    await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Database connection successful');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return;
  }
  
  // Test 2: List Tables
  console.log('\n2️⃣  Checking Database Tables...');
  try {
    const tables = await prisma.$queryRaw`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%' 
      ORDER BY name
    `;
    
    if (tables.length > 0) {
      console.log(`✅ Found ${tables.length} tables:`);
      tables.forEach(table => console.log(`   - ${table.name}`));
    } else {
      console.log('❌ No tables found in database');
    }
  } catch (error) {
    console.error('❌ Failed to list tables:', error.message);
  }
  
  // Test 3: Check Sample Data
  console.log('\n3️⃣  Checking Sample Data...');
  try {
    const memberCount = await prisma.innerCircleMember.count();
    const keyCount = await prisma.innerCircleKey.count();
    const contentCount = await prisma.contentMetadata.count();
    
    console.log(`✅ Members: ${memberCount}`);
    console.log(`✅ Access Keys: ${keyCount}`);
    console.log(`✅ Content Items: ${contentCount}`);
    
    if (memberCount === 0) {
      console.log('⚠️  No members found. Run: node prisma/seed.mjs');
    }
  } catch (error) {
    console.error('❌ Failed to check data:', error.message);
  }
  
  // Test 4: Environment Variables
  console.log('\n4️⃣  Checking Environment...');
  const requiredVars = ['DATABASE_URL', 'NODE_ENV', 'NEXT_PUBLIC_SITE_URL'];
  let allGood = true;
  
  for (const key of requiredVars) {
    const value = process.env[key];
    if (value) {
      console.log(`✅ ${key}: [SET]`);
    } else {
      console.log(`❌ ${key}: MISSING`);
      allGood = false;
    }
  }
  
  console.log('\n📊 System Status Summary:');
  if (allGood) {
    console.log('✅ System is ready!');
    console.log('\n🚀 Start the application with: npm run dev');
  } else {
    console.log('⚠️  System needs configuration');
  }
}

testSystem()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });