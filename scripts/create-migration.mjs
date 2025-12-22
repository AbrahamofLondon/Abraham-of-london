#!/usr/bin/env node
/**
 * Migration Creation Script
 * Helper script to create and manage database migrations safely
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import readline from 'readline';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

// Check if Prisma is configured
function checkPrismaSetup() {
  const schemaPath = join(rootDir, 'prisma/schema.prisma');
  
  if (!existsSync(schemaPath)) {
    console.log('❌ Prisma schema not found at prisma/schema.prisma\n');
    console.log('Please run: pnpm prisma init\n');
    return false;
  }
  
  return true;
}

// Check for uncommitted changes in schema
async function checkUncommittedChanges() {
  try {
    const { stdout } = await execAsync('git status --porcelain prisma/schema.prisma');
    return stdout.trim().length > 0;
  } catch {
    // Not a git repo or git not available
    return false;
  }
}

// Get migration name from user
async function getMigrationName() {
  const name = await question('\n📝 Enter migration name (e.g., "add_user_roles"): ');
  
  if (!name || name.trim().length === 0) {
    console.log('❌ Migration name cannot be empty\n');
    return null;
  }
  
  // Sanitize migration name
  const sanitized = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
  
  if (sanitized !== name.trim()) {
    console.log(`\n💡 Sanitized name: ${sanitized}`);
    const confirm = await question('Use this name? (y/n): ');
    if (confirm.toLowerCase() !== 'y') {
      return null;
    }
  }
  
  return sanitized;
}

// Show schema diff preview
async function showSchemaDiff() {
  console.log('\n🔍 Checking for schema changes...\n');
  
  try {
    const { stdout, stderr } = await execAsync('pnpm prisma migrate diff --from-schema-datamodel prisma/schema.prisma --to-schema-datasource prisma/schema.prisma --script');
    
    if (stdout && stdout.trim().length > 0) {
      console.log('Schema changes detected:\n');
      console.log(stdout);
      return true;
    } else {
      console.log('⚠️  No schema changes detected\n');
      return false;
    }
  } catch (error) {
    // Command might not be available in older Prisma versions
    console.log('⚠️  Could not preview changes (requires Prisma 4.6+)\n');
    return true; // Assume there are changes
  }
}

// Create migration
async function createMigration(name, options = {}) {
  console.log('\n🔄 Creating migration...\n');
  
  try {
    const args = ['prisma', 'migrate', 'dev', '--name', name];
    
    if (options.createOnly) {
      args.push('--create-only');
    }
    
    if (options.skipGenerate) {
      args.push('--skip-generate');
    }
    
    const command = `pnpm ${args.join(' ')}`;
    console.log(`Executing: ${command}\n`);
    
    const { stdout, stderr } = await execAsync(command);
    
    console.log(stdout);
    if (stderr) {
      console.log(stderr);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Migration creation failed:', error.message);
    if (error.stdout) console.log(error.stdout);
    if (error.stderr) console.log(error.stderr);
    return false;
  }
}

// Validate migration file
function validateMigration(name) {
  console.log('\n🔍 Validating migration...\n');
  
  const migrationsDir = join(rootDir, 'prisma/migrations');
  
  if (!existsSync(migrationsDir)) {
    console.log('❌ Migrations directory not found\n');
    return false;
  }
  
  // Find the migration directory (it will have a timestamp prefix)
  const fs = require('fs');
  const dirs = fs.readdirSync(migrationsDir)
    .filter(d => d.endsWith(name))
    .sort()
    .reverse();
  
  if (dirs.length === 0) {
    console.log(`❌ Migration directory not found for: ${name}\n`);
    return false;
  }
  
  const migrationDir = join(migrationsDir, dirs[0]);
  const migrationFile = join(migrationDir, 'migration.sql');
  
  if (!existsSync(migrationFile)) {
    console.log(`❌ Migration SQL file not found: ${migrationFile}\n`);
    return false;
  }
  
  // Check migration file content
  const content = readFileSync(migrationFile, 'utf-8');
  
  if (content.trim().length === 0) {
    console.log('⚠️  Warning: Migration file is empty\n');
    return true; // Empty migrations are sometimes valid
  }
  
  console.log(`✅ Migration file created: ${migrationFile}`);
  console.log(`   Size: ${content.length} bytes\n`);
  
  // Show migration content
  console.log('Migration SQL:');
  console.log('─'.repeat(60));
  console.log(content);
  console.log('─'.repeat(60) + '\n');
  
  return true;
}

// Create backup before migration
async function createPreMigrationBackup() {
  console.log('💾 Creating pre-migration backup...\n');
  
  try {
    await execAsync('pnpm db:backup');
    console.log('✅ Backup created successfully\n');
    return true;
  } catch (error) {
    console.log('⚠️  Could not create backup:', error.message);
    console.log('   Continuing anyway...\n');
    return false;
  }
}

// Main migration creation workflow
async function runMigrationWorkflow() {
  console.log('🗄️  Database Migration Creator\n');
  console.log('='.repeat(60) + '\n');
  
  // Check Prisma setup
  if (!checkPrismaSetup()) {
    process.exit(1);
  }
  
  console.log('✅ Prisma schema found\n');
  
  // Check for uncommitted changes
  const hasUncommitted = await checkUncommittedChanges();
  if (hasUncommitted) {
    console.log('⚠️  Warning: You have uncommitted changes to schema.prisma');
    const proceed = await question('   Continue anyway? (y/n): ');
    if (proceed.toLowerCase() !== 'y') {
      console.log('\n❌ Migration cancelled\n');
      rl.close();
      process.exit(0);
    }
  }
  
  // Show schema diff
  const hasChanges = await showSchemaDiff();
  if (!hasChanges) {
    const proceed = await question('Continue creating migration anyway? (y/n): ');
    if (proceed.toLowerCase() !== 'y') {
      console.log('\n❌ Migration cancelled\n');
      rl.close();
      process.exit(0);
    }
  }
  
  // Get migration name
  const migrationName = await getMigrationName();
  if (!migrationName) {
    console.log('\n❌ Migration cancelled\n');
    rl.close();
    process.exit(1);
  }
  
  // Ask about options
  console.log('\n⚙️  Migration options:\n');
  const createOnly = await question('Create migration file only (don\'t apply)? (y/n): ');
  
  let shouldBackup = false;
  if (createOnly.toLowerCase() !== 'y') {
    shouldBackup = await question('Create database backup before migrating? (y/n): ');
  }
  
  console.log('');
  
  // Create backup if requested
  if (shouldBackup.toLowerCase() === 'y') {
    await createPreMigrationBackup();
  }
  
  // Create migration
  const options = {
    createOnly: createOnly.toLowerCase() === 'y',
    skipGenerate: false
  };
  
  const success = await createMigration(migrationName, options);
  
  if (!success) {
    console.log('\n❌ Migration creation failed\n');
    rl.close();
    process.exit(1);
  }
  
  // Validate migration
  validateMigration(migrationName);
  
  // Final summary
  console.log('='.repeat(60));
  console.log('✅ MIGRATION CREATED SUCCESSFULLY\n');
  console.log(`Migration name: ${migrationName}\n`);
  
  if (options.createOnly) {
    console.log('⚠️  Migration file created but not applied');
    console.log('   To apply: pnpm prisma migrate dev');
    console.log('   To apply in production: pnpm db:migrate:deploy\n');
  } else {
    console.log('✅ Migration applied to database');
    console.log('   To deploy to production: pnpm db:migrate:deploy\n');
  }
  
  console.log('💡 Next steps:');
  console.log('1. Review the migration SQL file');
  console.log('2. Test the migration in development');
  console.log('3. Commit the migration files to git');
  console.log('4. Deploy to production when ready\n');
  
  rl.close();
  process.exit(0);
}

// Parse command line arguments
const args = process.argv.slice(2);
const help = args.includes('--help') || args.includes('-h');

if (help) {
  console.log('Database Migration Creator\n');
  console.log('Usage: node scripts/create-migration.mjs [options]\n');
  console.log('Options:');
  console.log('  -h, --help    Show this help message\n');
  console.log('This script guides you through creating a Prisma migration safely.\n');
  console.log('Examples:');
  console.log('  pnpm migrations:create');
  console.log('  node scripts/create-migration.mjs\n');
  process.exit(0);
}

// Run migration workflow
runMigrationWorkflow().catch(error => {
  console.error('❌ Migration script failed:', error.message);
  console.error(error.stack);
  rl.close();
  process.exit(1);
});