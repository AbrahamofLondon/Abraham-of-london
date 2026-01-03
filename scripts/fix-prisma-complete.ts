#!/usr/bin/env tsx
// scripts/fix-prisma-complete.ts
// Complete fix for Prisma 7.2.0 issues

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Backup original schema
function backupSchema() {
  const schemaPath = path.resolve(process.cwd(), 'prisma/schema.prisma');
  const backupPath = path.resolve(process.cwd(), 'prisma/schema.backup.prisma');
  
  if (fs.existsSync(schemaPath)) {
    fs.copyFileSync(schemaPath, backupPath);
    console.log(`📋 Backed up schema to: prisma/schema.backup.prisma`);
  }
}

// Create minimal working schema
function createMinimalSchema() {
  const schemaPath = path.resolve(process.cwd(), 'prisma/schema.prisma');
  
  const minimalSchema = `// prisma/schema.prisma
// Prisma 7.2.0 compatible schema
// Generated: ${new Date().toISOString()}

generator client {
  provider = "prisma-client-js"
  binaryTargets = ["native"]
}

datasource db {
  provider = "sqlite"
  // URL configured in prisma/config.ts
}

// ==================== BASIC MODELS ====================

model DownloadAuditEvent {
  id          String   @id @default(cuid())
  slug        String   @db.VarChar(255)
  contentType String   @default("download") @map("content_type") @db.VarChar(50)
  memberId    String?  @map("member_id") @db.VarChar(36)
  fileName    String?  @map("file_name") @db.VarChar(512)
  fileSize    BigInt?  @map("file_size")
  email       String?  @db.VarChar(320)
  emailHash   String?  @map("email_hash") @db.VarChar(128)
  sessionId   String?  @map("session_id") @db.VarChar(128)
  userAgent   String?  @map("user_agent") @db.Text
  ipAddress   String?  @map("ip_address") @db.VarChar(45)
  countryCode String?  @map("country_code") @db.VarChar(2)
  referrer    String?  @db.Text
  success     Boolean  @default(true)
  createdAt   DateTime @default(now()) @map("created_at")
  processedAt DateTime? @map("processed_at")

  @@index([slug], name: "idx_download_slug")
  @@index([createdAt], name: "idx_download_created_at")
  @@index([emailHash], name: "idx_download_email_hash")
  @@map("download_audit_events")
}

model InnerCircleMember {
  id              String   @id @default(uuid()) @db.VarChar(36)
  emailHash       String   @unique @map("email_hash") @db.VarChar(128)
  emailHashPrefix String   @map("email_hash_prefix") @db.VarChar(10)
  email           String?  @unique @db.VarChar(320)
  name            String?  @db.VarChar(200)
  status          String   @default("active") @db.VarChar(20)
  tier            String   @default("standard") @db.VarChar(20)
  isVerified      Boolean  @default(false) @map("is_verified")
  lastSeenAt      DateTime @default(now()) @map("last_seen_at")
  loginCount      Int      @default(0) @map("login_count")
  preferences     String?  @db.Text
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  @@index([status], name: "idx_member_status")
  @@index([tier], name: "idx_member_tier")
  @@index([createdAt], name: "idx_member_created")
  @@map("inner_circle_members")
}

model ContentMetadata {
  id                String    @id @default(cuid())
  slug              String    @unique @db.VarChar(255)
  title             String    @db.VarChar(200)
  description       String?   @db.Text
  contentType       String    @map("content_type") @db.VarChar(50)
  tierRequirement   String?   @map("tier_requirement") @db.VarChar(20)
  requiresAuth      Boolean   @default(false) @map("requires_auth")
  filePath          String?   @map("file_path") @db.VarChar(512)
  fileSize          BigInt?   @map("file_size")
  totalDownloads    Int       @default(0) @map("total_downloads")
  uniqueDownloaders Int       @default(0) @map("unique_downloaders")
  viewCount         Int       @default(0) @map("view_count")
  category          String?   @db.VarChar(100)
  tags              String?   @db.Text
  publishedAt       DateTime? @map("published_at")
  createdAt         DateTime  @default(now()) @map("created_at")
  updatedAt         DateTime  @updatedAt @map("updated_at")

  @@index([slug], name: "idx_content_slug")
  @@index([contentType], name: "idx_content_type")
  @@index([category], name: "idx_content_category")
  @@index([publishedAt], name: "idx_content_published")
  @@map("content_metadata")
}

model SystemAuditLog {
  id           String   @id @default(cuid())
  actorType    String   @map("actor_type") @db.VarChar(50)
  actorId      String?  @map("actor_id") @db.VarChar(36)
  actorEmail   String?  @map("actor_email") @db.VarChar(320)
  action       String   @db.VarChar(100)
  resourceType String   @map("resource_type") @db.VarChar(100)
  resourceId   String?  @map("resource_id") @db.VarChar(36)
  status       String   @default("success") @db.VarChar(20)
  severity     String   @default("low") @db.VarChar(20)
  ipAddress    String?  @map("ip_address") @db.VarChar(45)
  userAgent    String?  @map("user_agent") @db.Text
  metadata     Json?
  category     String?  @db.VarChar(50)
  createdAt    DateTime @default(now()) @map("created_at")

  @@index([actorType], name: "idx_audit_actor_type")
  @@index([action], name: "idx_audit_action")
  @@index([status], name: "idx_audit_status")
  @@index([createdAt], name: "idx_audit_created")
  @@map("system_audit_logs")
}
`;
  
  fs.writeFileSync(schemaPath, minimalSchema, 'utf-8');
  console.log(`✅ Created minimal working schema`);
}

// Create proper config file
function createConfigFile() {
  const configPath = path.resolve(process.cwd(), 'prisma/config.ts');
  
  const configContent = `import { defineConfig } from 'prisma';
import { config } from 'dotenv';
import path from 'path';

config({ path: path.resolve(process.cwd(), '.env') });

export default defineConfig({
  datasource: {
    provider: 'sqlite',
    url: process.env.DATABASE_URL || 'file:./dev.db',
  },
  // No preview features for now - add them back one by one if needed
  previewFeatures: [],
  schema: './prisma/schema.prisma',
});`;
  
  fs.writeFileSync(configPath, configContent, 'utf-8');
  console.log(`✅ Created prisma/config.ts`);
}

// Generate Prisma client
function generatePrismaClient() {
  try {
    console.log('🚀 Generating Prisma client...');
    
    // Use direct Prisma CLI without config first
    execSync('npx prisma generate', { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    console.log('✅ Prisma client generated successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to generate Prisma client');
    
    // Try alternative approach
    try {
      console.log('🔄 Trying alternative approach...');
      
      // Create a package.json in prisma directory with local config
      const prismaPkg = {
        name: "prisma-local",
        version: "1.0.0",
        scripts: {
          "generate": "prisma generate"
        },
        dependencies: {
          "@prisma/client": "^7.2.0",
          "prisma": "^7.2.0"
        }
      };
      
      const prismaDir = path.resolve(process.cwd(), 'prisma');
      fs.writeFileSync(
        path.join(prismaDir, 'package.json'),
        JSON.stringify(prismaPkg, null, 2)
      );
      
      // Generate from prisma directory
      execSync('npm run generate', {
        stdio: 'inherit',
        cwd: prismaDir
      });
      
      console.log('✅ Prisma client generated (alternative method)');
      return true;
    } catch (altError) {
      console.error('❌ Alternative method also failed');
      return false;
    }
  }
}

// Update package.json
function updatePackageJson() {
  const packagePath = path.resolve(process.cwd(), 'package.json');
  
  if (!fs.existsSync(packagePath)) {
    console.error('❌ package.json not found');
    return;
  }
  
  const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
  
  // Update scripts
  pkg.scripts = {
    ...pkg.scripts,
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev --name init",
    "prisma:studio": "prisma studio",
    "prisma:push": "prisma db push",
    "fix:prisma": "npx tsx scripts/fix-prisma-complete.ts",
    "postinstall": "echo 'Run npm run fix:prisma first, then npm run prisma:generate'",
    "prebuild": "npm run prisma:generate",
    "build": "cross-env NODE_OPTIONS=--max-old-space-size=4096 next build",
    "dev": "cross-env NODE_OPTIONS=--max-old-space-size=4096 next dev"
  };
  
  fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2), 'utf-8');
  console.log('✅ Updated package.json scripts');
}

// Create .env file if missing
function createEnvFile() {
  const envPath = path.resolve(process.cwd(), '.env');
  
  if (!fs.existsSync(envPath)) {
    const envContent = `# Database
DATABASE_URL="file:./dev.db"

# App
NODE_ENV="development"
PORT=3000

# Prisma
PRISMA_TELEMETRY_ENABLED=false
`;
    
    fs.writeFileSync(envPath, envContent, 'utf-8');
    console.log('✅ Created .env file');
  }
}

// Main function
async function main() {
  console.log('🔧 Starting Prisma 7.2.0 complete fix...');
  console.log('='.repeat(60));
  
  try {
    // 1. Backup existing schema
    backupSchema();
    
    // 2. Create minimal schema
    createMinimalSchema();
    
    // 3. Create config file
    createConfigFile();
    
    // 4. Create .env if missing
    createEnvFile();
    
    // 5. Update package.json
    updatePackageJson();
    
    console.log('='.repeat(60));
    console.log('✅ All files prepared');
    console.log('\n📋 Next steps:');
    console.log('1. Run: npm run prisma:generate');
    console.log('2. Run: npm run prisma:migrate');
    console.log('3. Run: npm run build');
    console.log('\n💡 If generation fails, try:');
    console.log('   - Delete node_modules/.prisma folder');
    console.log('   - Run: npx prisma generate');
    
  } catch (error) {
    console.error('❌ Error during fix:', error);
    process.exit(1);
  }
}

// Run if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch(console.error);
}