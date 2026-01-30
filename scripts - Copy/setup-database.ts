#!/usr/bin/env node
import { exec } from 'child_process';
import { promisify } from 'util';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs/promises';
import { PrismaClient } from '@prisma/client';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

// Load environment variables
config({ path: path.join(rootDir, '.env') });
config({ path: path.join(rootDir, '.env.local') });

const execAsync = promisify(exec);

async function runCommand(command, description) {
  console.log(`\n🔧 ${description}...`);
  try {
    const { stdout, stderr } = await execAsync(command, { cwd: rootDir });
    if (stdout) console.log(stdout);
    if (stderr && !stderr.includes('warning')) console.error(stderr);
    return true;
  } catch (error) {
    console.error(`❌ Failed: ${error.message}`);
    return false;
  }
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function createSqliteDatabase() {
  console.log('💾 Creating SQLite database...');
  
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('❌ DATABASE_URL is not set in environment variables');
    console.log('\n💡 Please update your .env.local file with:');
    console.log('   DATABASE_URL="file:./dev.db"');
    return false;
  }
  
  // Extract the database file path from DATABASE_URL
  const dbMatch = dbUrl.match(/file:(.+)/);
  if (!dbMatch) {
    console.error('❌ Invalid SQLite DATABASE_URL format. Should be: file:./path/to/db');
    return false;
  }
  
  const dbPath = path.join(rootDir, dbMatch[1]);
  const dbDir = path.dirname(dbPath);
  
  try {
    // Create directory if it doesn't exist
    await fs.mkdir(dbDir, { recursive: true });
    
    // Create an empty database file if it doesn't exist
    if (!await fileExists(dbPath)) {
      await fs.writeFile(dbPath, '');
      console.log(`✅ Created SQLite database: ${dbPath}`);
    } else {
      console.log(`✅ SQLite database already exists: ${dbPath}`);
    }
    
    return true;
  } catch (error) {
    console.error(`❌ Failed to create SQLite database: ${error.message}`);
    return false;
  }
}

async function testDatabaseConnection() {
  console.log('\n🔗 Testing database connection...');
  
  try {
    const prisma = new PrismaClient();
    
    // Try a simple query to test connection
    await prisma.$queryRaw`SELECT 1 as test`;
    
    console.log('✅ Database connection successful');
    await prisma.$disconnect();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    
    // Check if it's a missing table error (which is OK for fresh setup)
    if (error.message.includes('no such table') || error.message.includes('does not exist')) {
      console.log('ℹ️  Database is empty (no tables yet). This is normal for a fresh setup.');
      return true;
    }
    
    return false;
  }
}

async function createBasicSeed() {
  try {
    const prisma = new PrismaClient();
    
    // Check if we already have data
    const memberCount = await prisma.innerCircleMember.count();
    
    if (memberCount > 0) {
      console.log(`ℹ️  Database already has ${memberCount} members. Skipping seed.`);
      await prisma.$disconnect();
      return;
    }
    
    // Create a test inner circle member
    const testMember = await prisma.innerCircleMember.create({
      data: {
        emailHash: 'test_hash_' + Date.now(),
        emailHashPrefix: 'test_',
        name: 'Test Member',
        status: 'active',
        tier: 'standard'
      }
    });
    
    console.log('👤 Created test member:', testMember.id);
    
    // Create a test key
    await prisma.innerCircleKey.create({
      data: {
        memberId: testMember.id,
        keyHash: 'test_key_hash_' + Date.now(),
        keySuffix: 'test',
        status: 'active',
        keyType: 'standard'
      }
    });
    
    console.log('🔑 Created test key');
    
    // Create some content metadata
    await prisma.contentMetadata.create({
      data: {
        slug: 'test-content',
        title: 'Test Content',
        contentType: 'pdf',
        totalDownloads: 0
      }
    });
    
    console.log('📄 Created test content metadata');
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Failed to create basic seed:', error.message);
  }
}

async function setupDatabase() {
  console.log('🗄️  Setting up database for Abraham of London\n');
  
  // Check if Prisma schema exists
  const prismaSchemaPath = path.join(rootDir, 'prisma', 'schema.prisma');
  if (!await fileExists(prismaSchemaPath)) {
    console.error('❌ Prisma schema not found at:', prismaSchemaPath);
    console.log('\n💡 Please create a Prisma schema first:');
    console.log('   1. Create prisma/schema.prisma');
    console.log('   2. Define your database models');
    console.log('   3. Run this script again');
    return;
  }
  
  console.log('📋 Database configuration:');
  console.log(`   Type: SQLite`);
  
  // Step 1: Create SQLite database file
  const dbCreated = await createSqliteDatabase();
  if (!dbCreated) {
    console.error('❌ Failed to create database');
    return;
  }
  
  // Step 2: Generate Prisma Client
  console.log('\n1️⃣  Generating Prisma Client...');
  const prismaGenerateSuccess = await runCommand(
    'npx prisma generate',
    'Generating Prisma Client'
  );
  
  if (!prismaGenerateSuccess) {
    console.error('❌ Failed to generate Prisma Client');
    return;
  }
  
  // Step 3: Run database migrations
  console.log('\n2️⃣  Applying database schema...');
  const migrateSuccess = await runCommand(
    'npx prisma db push --accept-data-loss',
    'Pushing schema to database'
  );
  
  if (!migrateSuccess) {
    console.error('❌ Failed to push schema to database');
    console.log('\n💡 Try running manually:');
    console.log('   npx prisma db push');
    return;
  }
  
  // Step 4: Test database connection
  const connectionSuccess = await testDatabaseConnection();
  if (!connectionSuccess) {
    console.error('❌ Database connection test failed');
    return;
  }
  
  // Step 5: Check if seed file exists
  const seedPath = path.join(rootDir, 'prisma', 'seed.js');
  const seedMjsPath = path.join(rootDir, 'prisma', 'seed.ts');
  const seedTsPath = path.join(rootDir, 'prisma', 'seed.ts');
  
  let seedFile = null;
  if (await fileExists(seedPath)) seedFile = seedPath;
  else if (await fileExists(seedMjsPath)) seedFile = seedMjsPath;
  else if (await fileExists(seedTsPath)) seedFile = seedTsPath;
  
  if (seedFile) {
    console.log(`\n3️⃣  Running database seed (${path.basename(seedFile)})...`);
    const seedSuccess = await runCommand(
      `node ${seedFile}`,
      'Seeding database'
    );
    
    if (!seedSuccess) {
      console.error('❌ Failed to seed database');
    }
  } else {
    console.log('\n3️⃣  Creating basic seed data...');
    await createBasicSeed();
  }
  
  // Step 6: Generate Prisma types (again to ensure they're fresh)
  console.log('\n4️⃣  Finalizing setup...');
  await runCommand('npx prisma generate', 'Generating types');
  
  console.log('\n🎉 Database setup complete!');
  
  // Show database info
  try {
    const prisma = new PrismaClient();
    const tables = await prisma.$queryRaw`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `;
    
    console.log('\n📊 Database tables created:');
    if (tables && Array.isArray(tables) && tables.length > 0) {
      tables.forEach(table => {
        console.log(`   - ${table.name}`);
      });
    } else {
      console.log('   No tables found (this might be an issue)');
    }
    
    await prisma.$disconnect();
  } catch (error) {
    // Ignore errors here, just informative
    console.log('   Could not list tables (database might be empty)');
  }
  
  console.log('\n📋 Next steps:');
  console.log('   1. Start development server: npm run dev');
  console.log('   2. Open Prisma Studio: npx prisma studio');
  console.log('   3. View database file: ./dev.db');
  
  console.log('\n💡 Database location:');
  const dbUrl = process.env.DATABASE_URL || 'file:./dev.db';
  const dbPath = path.join(rootDir, dbUrl.replace('file:', '').trim());
  console.log(`   ${dbPath}`);
}

// Run the setup
setupDatabase().catch(error => {
  console.error('❌ Database setup failed:', error);
  process.exit(1);
});
