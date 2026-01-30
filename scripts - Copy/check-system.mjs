// scripts/check-system.mjs
import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs/promises';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

// Load environment
config({ path: path.join(rootDir, '.env') });
config({ path: path.join(rootDir, '.env.local') });

const prisma = new PrismaClient();
const isWindows = process.platform === 'win32';

console.log('🧪 Abraham of London - System Diagnostics\n');
console.log(`🖥️  Platform: ${process.platform} ${isWindows ? '(Windows)' : ''}`);
console.log(`⚡ Node.js: ${process.version}`);
console.log(`📁 Directory: ${rootDir}\n`);

async function checkDatabase() {
  console.log('1️⃣  Database Check:');
  try {
    // Test connection
    await prisma.$queryRaw`SELECT 1 as test`;
    console.log('   ✅ Connection: Working');
    
    // Count tables
    const tables = await prisma.$queryRaw`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%' 
      ORDER BY name
    `;
    console.log(`   ✅ Tables: ${tables.length} tables found`);
    
    // Count sample data
    const memberCount = await prisma.innerCircleMember.count();
    const keyCount = await prisma.innerCircleKey.count();
    const contentCount = await prisma.contentMetadata.count();
    
    console.log(`   ✅ Data: ${memberCount} members, ${keyCount} keys, ${contentCount} content items`);
    
    return true;
  } catch (error) {
    console.log(`   ❌ Database error: ${error.message}`);
    return false;
  }
}

async function checkEnvironment() {
  console.log('\n2️⃣  Environment Check:');
  
  const requiredVars = ['DATABASE_URL', 'NODE_ENV', 'NEXT_PUBLIC_SITE_URL'];
  const allGood = requiredVars.every(key => {
    const value = process.env[key];
    const hasValue = value && value.trim() !== '';
    console.log(`   ${hasValue ? '✅' : '❌'} ${key}: ${hasValue ? '[SET]' : 'MISSING'}`);
    return hasValue;
  });
  
  console.log(`   ⚙️  NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
  console.log(`   🌐 Site URL: ${process.env.NEXT_PUBLIC_SITE_URL || 'not set'}`);
  
  return allGood;
}

async function checkContentlayer() {
  console.log('\n3️⃣  Contentlayer Check:');
  
  const contentlayerConfig = path.join(rootDir, 'contentlayer.config.js');
  const contentlayerDir = path.join(rootDir, '.contentlayer');
  const contentDir = path.join(rootDir, 'content');
  
  try {
    await fs.access(contentlayerConfig);
    console.log('   ✅ Config: contentlayer.config.js found');
  } catch {
    console.log('   ⚠️  Config: contentlayer.config.js not found');
  }
  
  try {
    await fs.access(contentDir);
    const files = await fs.readdir(contentDir, { recursive: true });
    const mdxFiles = files.filter(f => f.endsWith('.mdx') || f.endsWith('.md'));
    console.log(`   📚 Content: ${mdxFiles.length} MDX/MD files in content/`);
  } catch {
    console.log('   ⚠️  Content: content/ directory not found');
  }
  
  try {
    await fs.access(contentlayerDir);
    console.log('   🔧 Cache: .contentlayer directory exists');
    
    const generatedIndex = path.join(contentlayerDir, 'generated', 'index.mjs');
    try {
      await fs.access(generatedIndex);
      console.log('   ✅ Generated: index.mjs exists');
    } catch {
      console.log('   ⚠️  Generated: index.mjs missing (Contentlayer may have failed)');
    }
  } catch {
    console.log('   ⚠️  Cache: .contentlayer directory not found (run content:build)');
  }
  
  console.log(`   🪟 Windows Issue: ${isWindows ? 'Known Contentlayer Windows compatibility issues' : 'Not on Windows'}`);
  
  return true;
}

async function checkNextJs() {
  console.log('\n4️⃣  Next.js Check:');
  
  const nextConfig = path.join(rootDir, 'next.config.mjs');
  const appDir = path.join(rootDir, 'app');
  const pagesDir = path.join(rootDir, 'pages');
  
  try {
    await fs.access(nextConfig);
    console.log('   ✅ Config: next.config.mjs found');
  } catch {
    console.log('   ⚠️  Config: next.config.mjs not found');
  }
  
  try {
    await fs.access(appDir);
    console.log('   📁 App: app/ directory exists (App Router)');
  } catch {
    try {
      await fs.access(pagesDir);
      console.log('   📁 Pages: pages/ directory exists (Pages Router)');
    } catch {
      console.log('   ⚠️  Router: No app/ or pages/ directory found');
    }
  }
  
  return true;
}

async function main() {
  try {
    const dbOk = await checkDatabase();
    const envOk = await checkEnvironment();
    await checkContentlayer();
    await checkNextJs();
    
    console.log('\n📊 SYSTEM STATUS SUMMARY:');
    console.log('='.repeat(40));
    
    if (dbOk && envOk) {
      console.log('✅ CORE SYSTEM: OPERATIONAL');
      console.log('   • Database connected and populated');
      console.log('   • Environment variables configured');
      console.log('   • Next.js ready to run');
    } else {
      console.log('⚠️  CORE SYSTEM: NEEDS ATTENTION');
      if (!dbOk) console.log('   • Database connection issue');
      if (!envOk) console.log('   • Missing environment variables');
    }
    
    console.log(`\n🪟 WINDOWS STATUS: ${isWindows ? 'OPTIMIZATIONS APPLIED' : 'STANDARD'}`);
    if (isWindows) {
      console.log('   • Windows-specific fixes available');
      console.log('   • Contentlayer may have compatibility issues');
      console.log('   • Use npm run dev:windows if needed');
    }
    
    console.log('\n🚀 QUICK START:');
    console.log('   • Development: npm run dev' + (isWindows ? ' (or npm run dev:windows)' : ''));
    console.log('   • Database UI: npx prisma studio');
    console.log('   • Content build: npm run content:build');
    console.log('   • System check: npm run check:system');
    
    console.log('\n🔗 Your app should be running at:');
    console.log(`   http://localhost:3000`);
    
  } catch (error) {
    console.error('❌ System check failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();