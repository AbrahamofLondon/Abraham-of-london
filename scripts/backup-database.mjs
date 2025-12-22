#!/usr/bin/env node
/**
 * Database Backup Script
 * Creates backups of both PostgreSQL and SQLite databases
 */

// Load environment variables from .env file
import { config } from 'dotenv';
import { resolve } from 'path';
const envPath = resolve(process.cwd(), '.env');
config({ path: envPath });

// Show debug info
console.log('🔍 Checking environment...');
console.log('Current directory:', process.cwd());
console.log('Looking for .env at:', envPath);
console.log('DATABASE_URL loaded:', !!process.env.DATABASE_URL);
if (process.env.DATABASE_URL) {
  // Mask password in output for security
  const maskedUrl = process.env.DATABASE_URL.replace(/:[^:@]*@/, ':****@');
  console.log('DATABASE_URL value:', maskedUrl);
}
console.log('');

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync, writeFileSync, copyFileSync, readdirSync, statSync, unlinkSync } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Detect database type from connection string
function detectDatabaseType(url) {
  if (!url) return 'unknown';
  
  const lowerUrl = url.toLowerCase();
  
  if (lowerUrl.startsWith('postgresql://') || lowerUrl.startsWith('postgres://')) {
    return 'postgres';
  } else if (lowerUrl.startsWith('file:') || lowerUrl.endsWith('.db') || lowerUrl.includes('.sqlite')) {
    return 'sqlite';
  } else if (lowerUrl.startsWith('mysql://') || lowerUrl.startsWith('mariadb://')) {
    return 'mysql';
  }
  
  return 'unknown';
}

// Parse PostgreSQL DATABASE_URL to extract connection details
function parsePostgresUrl(url) {
  try {
    // Format: postgresql://user:password@host:port/database
    const urlObj = new URL(url);
    
    return {
      type: 'postgres',
      user: urlObj.username,
      password: urlObj.password,
      host: urlObj.hostname,
      port: urlObj.port || '5432',
      database: urlObj.pathname.slice(1), // Remove leading slash
      url: url
    };
  } catch (error) {
    throw new Error(`Invalid PostgreSQL DATABASE_URL format: ${error.message}`);
  }
}

// Parse SQLite DATABASE_URL to extract file path
function parseSqliteUrl(url) {
  try {
    let filePath = url.trim();
    
    // Handle file:// or file: format
    if (filePath.startsWith('file://')) {
      filePath = filePath.substring(7);
    } else if (filePath.startsWith('file:')) {
      filePath = filePath.substring(5);
    }
    
    // Remove leading slashes if present
    while (filePath.startsWith('/') || filePath.startsWith('\\')) {
      filePath = filePath.substring(1);
    }
    
    // If path is relative, make it absolute from project root
    if (!filePath.startsWith('/') && !filePath.match(/^[A-Za-z]:[\\\/]/)) {
      filePath = join(rootDir, filePath);
    }
    
    return {
      type: 'sqlite',
      filePath: filePath,
      url: url
    };
  } catch (error) {
    throw new Error(`Invalid SQLite DATABASE_URL format: ${error.message}`);
  }
}

// Generate backup filename with timestamp
function generateBackupFilename(database, dbType) {
  const now = new Date();
  const timestamp = now.toISOString()
    .replace(/:/g, '-')
    .replace(/\..+/, '')
    .replace('T', '_');
  
  if (dbType === 'sqlite') {
    const dbName = database.split('/').pop().split('\\').pop().replace('.db', '');
    return `${dbName}_backup_${timestamp}.db`;
  } else {
    return `${database}_backup_${timestamp}.sql`;
  }
}

// Create PostgreSQL backup using pg_dump
async function createPostgresBackup(dbConfig, backupPath) {
  console.log('🔄 Creating PostgreSQL backup using pg_dump...\n');
  
  try {
    // Set password environment variable for pg_dump
    const env = {
      ...process.env,
      PGPASSWORD: dbConfig.password
    };
    
    // Construct pg_dump command
    const pgDumpCmd = [
      'pg_dump',
      `-h ${dbConfig.host}`,
      `-p ${dbConfig.port}`,
      `-U ${dbConfig.user}`,
      `-d ${dbConfig.database}`,
      `--file="${backupPath}"`,
      '--format=plain',
      '--no-owner',
      '--no-acl',
      '--verbose'
    ].join(' ');
    
    console.log(`📤 Executing: pg_dump -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.user} -d ${dbConfig.database}`);
    console.log(`💾 Output file: ${backupPath}\n`);
    
    const { stdout, stderr } = await execAsync(pgDumpCmd, { env });
    
    if (stderr && !stderr.includes('password')) {
      console.log('ℹ️  pg_dump output:', stderr);
    }
    
    return true;
  } catch (error) {
    console.error('❌ pg_dump failed, trying fallback method...\n');
    
    // Fallback: Try using Prisma for schema export
    try {
      return await createPrismaBackup(backupPath);
    } catch (prismaError) {
      throw new Error(`All PostgreSQL backup methods failed: ${error.message}. Fallback: ${prismaError.message}`);
    }
  }
}

// Create backup using Prisma if pg_dump is not available
async function createPrismaBackup(backupPath) {
  console.log('🔄 Creating backup using Prisma...\n');
  console.log('⚠️  Note: This is a schema export, not a full data backup.\n');
  
  try {
    // Export Prisma schema
    const { stdout } = await execAsync('pnpm prisma db pull --print');
    
    writeFileSync(backupPath, stdout);
    console.log('✅ Schema exported successfully\n');
    
    return true;
  } catch (error) {
    throw new Error(`Prisma backup failed: ${error.message}`);
  }
}

// Create SQLite backup
async function createSqliteBackup(dbConfig, backupPath) {
  console.log('🔄 Creating SQLite backup...\n');
  
  try {
    // Check if source file exists
    if (!existsSync(dbConfig.filePath)) {
      throw new Error(`SQLite database file not found: ${dbConfig.filePath}`);
    }
    
    console.log(`📂 Source database: ${dbConfig.filePath}`);
    console.log(`💾 Backup destination: ${backupPath}\n`);
    
    // Copy the SQLite database file
    copyFileSync(dbConfig.filePath, backupPath);
    
    // Optional: Run VACUUM to optimize the backup
    try {
      const { execSync } = await import('child_process');
      execSync(`sqlite3 "${backupPath}" "VACUUM;"`);
      console.log('✅ Database optimized with VACUUM\n');
    } catch (vacuumError) {
      console.log('ℹ️  SQLite VACUUM not available (sqlite3 command not found)\n');
    }
    
    return true;
  } catch (error) {
    throw new Error(`SQLite backup failed: ${error.message}`);
  }
}

// Check if pg_dump is available
async function isPgDumpAvailable() {
  try {
    await execAsync('pg_dump --version');
    return true;
  } catch {
    return false;
  }
}

// Check if sqlite3 command is available
async function isSqlite3Available() {
  try {
    await execAsync('sqlite3 --version');
    return true;
  } catch {
    return false;
  }
}

// Verify backup file
function verifyBackup(backupPath, dbType) {
  console.log('🔍 Verifying backup file...\n');
  
  if (!existsSync(backupPath)) {
    throw new Error('Backup file was not created');
  }
  
  const stats = statSync(backupPath);
  const fileSizeKB = (stats.size / 1024).toFixed(2);
  const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
  
  console.log(`✅ Backup file created successfully`);
  console.log(`   Type: ${dbType.toUpperCase()}`);
  console.log(`   Size: ${fileSizeKB} KB (${fileSizeMB} MB)`);
  console.log(`   Path: ${backupPath}\n`);
  
  if (stats.size < 100 && dbType === 'postgres') {
    console.log('⚠️  Warning: Backup file is very small. It may be incomplete.\n');
  }
  
  if (dbType === 'sqlite' && stats.size < 1024) {
    console.log('⚠️  Warning: SQLite backup is very small. It may be empty.\n');
  }
  
  return true;
}

// Clean old backups (keep last N backups)
async function cleanOldBackups(backupDir, keepCount = 5, dbType) {
  console.log(`🧹 Cleaning old ${dbType.toUpperCase()} backups (keeping last ${keepCount})...\n`);
  
  try {
    let extension;
    if (dbType === 'sqlite') {
      extension = '.db';
    } else if (dbType === 'postgres') {
      extension = '.sql';
    } else {
      extension = '';
    }
    
    const files = readdirSync(backupDir)
      .filter(f => f.endsWith(extension))
      .map(f => ({
        name: f,
        path: join(backupDir, f),
        time: statSync(join(backupDir, f)).mtime.getTime()
      }))
      .sort((a, b) => b.time - a.time);
    
    if (files.length <= keepCount) {
      console.log(`ℹ️  Currently ${files.length} backup(s), no cleanup needed\n`);
      return;
    }
    
    const toDelete = files.slice(keepCount);
    console.log(`🗑️  Deleting ${toDelete.length} old backup(s):`);
    
    for (const file of toDelete) {
      unlinkSync(file.path);
      console.log(`   - ${file.name}`);
    }
    
    console.log('');
  } catch (error) {
    console.log(`⚠️  Could not clean old backups: ${error.message}\n`);
  }
}

// Backup PostgreSQL database
async function backupPostgresDatabase(databaseUrl) {
  console.log('🚀 Starting PostgreSQL backup\n');
  console.log('─'.repeat(60) + '\n');
  
  try {
    // Parse database URL
    const dbConfig = parsePostgresUrl(databaseUrl);
    console.log(`📊 Database: ${dbConfig.database}`);
    console.log(`🌐 Host: ${dbConfig.host}:${dbConfig.port}`);
    console.log(`👤 User: ${dbConfig.user}\n`);
    
    // Create backups directory
    const backupDir = join(rootDir, 'backups', 'postgres');
    if (!existsSync(backupDir)) {
      mkdirSync(backupDir, { recursive: true });
      console.log(`📁 Created backups directory: ${backupDir}\n`);
    }
    
    // Generate backup filename
    const backupFilename = generateBackupFilename(dbConfig.database, 'postgres');
    const backupPath = join(backupDir, backupFilename);
    
    // Check if pg_dump is available
    const hasPgDump = await isPgDumpAvailable();
    
    if (hasPgDump) {
      console.log('✅ pg_dump is available\n');
      await createPostgresBackup(dbConfig, backupPath);
    } else {
      console.log('⚠️  pg_dump not found, falling back to Prisma schema export\n');
      console.log('💡 For full backups, install PostgreSQL client tools:\n');
      console.log('  - Windows: Download from postgresql.org');
      console.log('  - macOS: brew install postgresql');
      console.log('  - Linux: sudo apt-get install postgresql-client\n');
      
      await createPrismaBackup(backupPath);
    }
    
    // Verify backup
    verifyBackup(backupPath, 'postgres');
    
    // Clean old backups
    await cleanOldBackups(backupDir, 5, 'postgres');
    
    console.log('─'.repeat(60));
    console.log('✅ POSTGRESQL BACKUP COMPLETED SUCCESSFULLY\n');
    console.log(`📦 Backup saved to: ${backupPath}\n`);
    
    // Show restore instructions
    console.log('🔧 To restore this PostgreSQL backup:');
    if (hasPgDump) {
      console.log(`   psql -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.user} -d ${dbConfig.database} < ${backupPath}\n`);
    } else {
      console.log(`   Use Prisma to apply the schema changes:\n   pnpm prisma db push\n`);
    }
    
    return backupPath;
  } catch (error) {
    console.log('─'.repeat(60));
    console.log('❌ POSTGRESQL BACKUP FAILED\n');
    throw error;
  }
}

// Backup SQLite database
async function backupSqliteDatabase(databaseUrl) {
  console.log('🚀 Starting SQLite backup\n');
  console.log('─'.repeat(60) + '\n');
  
  try {
    // Parse database URL
    const dbConfig = parseSqliteUrl(databaseUrl);
    console.log(`📂 Database file: ${dbConfig.filePath}\n`);
    
    // Create backups directory
    const backupDir = join(rootDir, 'backups', 'sqlite');
    if (!existsSync(backupDir)) {
      mkdirSync(backupDir, { recursive: true });
      console.log(`📁 Created backups directory: ${backupDir}\n`);
    }
    
    // Generate backup filename
    const dbName = dbConfig.filePath.split('/').pop().split('\\').pop();
    const backupFilename = generateBackupFilename(dbName, 'sqlite');
    const backupPath = join(backupDir, backupFilename);
    
    // Create backup
    await createSqliteBackup(dbConfig, backupPath);
    
    // Verify backup
    verifyBackup(backupPath, 'sqlite');
    
    // Clean old backups
    await cleanOldBackups(backupDir, 5, 'sqlite');
    
    console.log('─'.repeat(60));
    console.log('✅ SQLITE BACKUP COMPLETED SUCCESSFULLY\n');
    console.log(`📦 Backup saved to: ${backupPath}\n`);
    
    // Show restore instructions
    console.log('🔧 To restore this SQLite backup:');
    console.log(`   1. Stop your application`);
    console.log(`   2. Copy backup over original:`);
    console.log(`      cp "${backupPath}" "${dbConfig.filePath}"`);
    console.log(`   3. Restart your application\n`);
    
    return backupPath;
  } catch (error) {
    console.log('─'.repeat(60));
    console.log('❌ SQLITE BACKUP FAILED\n');
    throw error;
  }
}

// Main backup function
async function backupDatabase() {
  console.log('💾 Database Backup Utility\n');
  console.log('='.repeat(60) + '\n');
  
  // Check for DATABASE_URL
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.log('❌ DATABASE_URL environment variable not found\n');
    console.log('Please set DATABASE_URL in your .env file\n');
    console.log('Examples:');
    console.log('  PostgreSQL: postgresql://user:pass@localhost:5432/dbname');
    console.log('  SQLite: file:./dev.db or ./data.db\n');
    
    // List available environment variables for debugging
    console.log('📋 Available environment variables:');
    Object.keys(process.env)
      .filter(key => key.includes('DATABASE') || key.includes('DB'))
      .forEach(key => {
        const value = process.env[key];
        // Mask passwords in output
        const maskedValue = value.replace(/:[^:@]*@/, ':****@');
        console.log(`   ${key}=${maskedValue}`);
      });
    console.log('');
    
    process.exit(1);
  }
  
  // Detect database type
  const dbType = detectDatabaseType(databaseUrl);
  console.log(`📊 Detected database type: ${dbType.toUpperCase()}\n`);
  
  try {
    let backupPath;
    
    if (dbType === 'sqlite') {
      backupPath = await backupSqliteDatabase(databaseUrl);
    } else if (dbType === 'postgres') {
      backupPath = await backupPostgresDatabase(databaseUrl);
    } else if (dbType === 'mysql') {
      console.log('❌ MySQL support is not implemented yet');
      console.log('Please use PostgreSQL or SQLite for now\n');
      process.exit(1);
    } else {
      console.log('❌ Unknown or unsupported database type');
      console.log('Please use one of these formats:');
      console.log('  PostgreSQL: postgresql://user:pass@localhost:5432/dbname');
      console.log('  SQLite: file:./dev.db or ./data.db\n');
      process.exit(1);
    }
    
    console.log('='.repeat(60));
    console.log('🎉 BACKUP PROCESS COMPLETE\n');
    console.log(`✅ Backup location: ${backupPath}\n`);
    
    // Show disk usage (Windows compatible)
    try {
      console.log('💾 Backup file size:');
      const stats = statSync(backupPath);
      const fileSizeKB = (stats.size / 1024).toFixed(2);
      const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
      console.log(`   ${fileSizeKB} KB (${fileSizeMB} MB)\n`);
    } catch (diskError) {
      // Ignore disk usage errors
    }
    
    process.exit(0);
  } catch (error) {
    console.log('='.repeat(60));
    console.log('❌ BACKUP FAILED\n');
    console.error('Error:', error.message);
    
    if (dbType === 'postgres' && error.message.includes('pg_dump')) {
      console.log('\n💡 PostgreSQL Troubleshooting:');
      console.log('1. Ensure PostgreSQL client tools are installed');
      console.log('2. Verify DATABASE_URL is correct');
      console.log('3. Check database credentials and permissions');
      console.log('4. Ensure the database server is accessible');
      console.log('5. Try manual connection: psql -h host -p port -U user -d database\n');
    } else if (dbType === 'sqlite' && error.message.includes('SQLite')) {
      console.log('\n💡 SQLite Troubleshooting:');
      console.log('1. Verify the database file exists at the specified path');
      console.log('2. Check file permissions (read/write access)');
      console.log('3. Ensure the application is not currently writing to the database');
      console.log('4. Try manual backup: cp dev.db dev_backup.db\n');
    }
    
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const help = args.includes('--help') || args.includes('-h');

if (help) {
  console.log('Database Backup Utility\n');
  console.log('Supports both PostgreSQL and SQLite databases\n');
  console.log('Usage: node scripts/backup-database.mjs [options]\n');
  console.log('Options:');
  console.log('  -h, --help    Show this help message\n');
  console.log('Environment Variables:');
  console.log('  DATABASE_URL  Database connection string (required)\n');
  console.log('Supported formats:');
  console.log('  PostgreSQL: postgresql://user:password@host:port/database');
  console.log('  SQLite:     file:./dev.db or ./data.db');
  console.log('\nExamples:');
  console.log('  pnpm db:backup');
  console.log('  node scripts/backup-database.mjs\n');
  console.log('Backup locations:');
  console.log('  PostgreSQL: backups/postgres/');
  console.log('  SQLite:     backups/sqlite/\n');
  process.exit(0);
}

// Run backup
backupDatabase().catch(error => {
  console.error('❌ Backup script failed:', error.message);
  console.error(error.stack);
  process.exit(1);
});