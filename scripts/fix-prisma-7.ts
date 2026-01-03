#!/usr/bin/env tsx
// scripts/fix-prisma-7.ts
// Temporary fix for Prisma 7.2.0 compatibility issues

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

function fixPrismaSchema() {
  const schemaPath = path.resolve(process.cwd(), 'prisma/schema.prisma');
  
  if (!fs.existsSync(schemaPath)) {
    console.error('❌ Prisma schema not found at:', schemaPath);
    process.exit(1);
  }

  let schema = fs.readFileSync(schemaPath, 'utf-8');
  
  // Remove invalid preview features
  schema = schema.replace(
    /previewFeatures\s*=\s*\[.*?\]/g,
    'previewFeatures = ["relationJoins", "improvedQueryRaw"]'
  );
  
  // Ensure datasource doesn't have URL for Prisma 7+
  schema = schema.replace(
    /datasource\s+db\s*{[^}]*url\s*=\s*env\("DATABASE_URL"\)[^}]*}/g,
    `datasource db {
  provider = "sqlite"
  // URL configured in prisma/config.ts
}`
  );
  
  fs.writeFileSync(schemaPath, schema, 'utf-8');
  console.log('✅ Updated Prisma schema for Prisma 7.2.0');
  
  // Generate client
  try {
    console.log('🚀 Generating Prisma client...');
    execSync('npx prisma generate', { stdio: 'inherit' });
    console.log('✅ Prisma client generated successfully');
  } catch (error) {
    console.error('❌ Failed to generate Prisma client:', error);
    process.exit(1);
  }
}

function createConfigFile() {
  const configPath = path.resolve(process.cwd(), 'prisma/config.ts');
  
  if (!fs.existsSync(configPath)) {
    const configContent = `import { defineConfig } from 'prisma';
import { config } from 'dotenv';
import path from 'path';

config({ path: path.resolve(process.cwd(), '.env') });

export default defineConfig({
  datasource: {
    provider: 'sqlite',
    url: process.env.DATABASE_URL || 'file:./dev.db',
  },
  previewFeatures: ["relationJoins", "improvedQueryRaw"],
});`;
    
    fs.writeFileSync(configPath, configContent, 'utf-8');
    console.log('✅ Created prisma/config.ts');
  }
}

function updatePackageJson() {
  const packagePath = path.resolve(process.cwd(), 'package.json');
  const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
  
  pkg.scripts.postinstall = 'npx tsx scripts/fix-prisma-7.ts && prisma generate --config=prisma/config.ts';
  pkg.scripts['prisma:generate'] = 'prisma generate --config=prisma/config.ts';
  pkg.scripts['prisma:migrate'] = 'prisma migrate dev --config=prisma/config.ts --name init';
  
  fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2), 'utf-8');
  console.log('✅ Updated package.json scripts');
}

// Run fixes
console.log('🔧 Fixing Prisma 7.2.0 compatibility...');
createConfigFile();
fixPrismaSchema();
updatePackageJson();
console.log('🎉 All fixes applied successfully!');
console.log('\n📋 Next steps:');
console.log('1. Run: npm install');
console.log('2. Run: npm run prisma:migrate');
console.log('3. Run: npm run build');