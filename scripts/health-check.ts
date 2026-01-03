#!/usr/bin/env node
/**
 * Application Health Check Script
 * Performs comprehensive health checks on the application
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, readFileSync } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const checks = {
  passed: [],
  failed: [],
  warnings: [],
  skipped: []
};

async function checkNodeVersion() {
  console.log('🔍 Checking Node.js version...');
  
  try {
    const packageJson = JSON.parse(
      readFileSync(join(rootDir, 'package.json'), 'utf-8')
    );
    
    const requiredVersion = packageJson.engines?.node;
    if (!requiredVersion) {
      checks.warnings.push('No Node.js version requirement specified in package.json');
      console.log('⚠️  No version requirement specified\n');
      return;
    }
    
    const currentVersion = process.version;
    const versionMatch = currentVersion.match(/^v(\d+)\./);
    const majorVersion = versionMatch ? parseInt(versionMatch[1]) : 0;
    
    // Parse required version (e.g., ">=20 <22")
    const minMatch = requiredVersion.match(/>=(\d+)/);
    const maxMatch = requiredVersion.match(/<(\d+)/);
    
    const minVersion = minMatch ? parseInt(minMatch[1]) : 0;
    const maxVersion = maxMatch ? parseInt(maxMatch[1]) : Infinity;
    
    if (majorVersion >= minVersion && majorVersion < maxVersion) {
      checks.passed.push(`Node.js version ${currentVersion} is compatible`);
      console.log(`✅ Node.js ${currentVersion} (required: ${requiredVersion})\n`);
    } else {
      checks.failed.push(`Node.js version ${currentVersion} does not meet requirements: ${requiredVersion}`);
      console.log(`❌ Node.js ${currentVersion} does not meet requirements: ${requiredVersion}\n`);
    }
  } catch (error) {
    checks.failed.push(`Failed to check Node.js version: ${error.message}`);
    console.log(`❌ Failed to check Node.js version: ${error.message}\n`);
  }
}

async function checkPackageManager() {
  console.log('🔍 Checking package manager...');
  
  try {
    const packageJson = JSON.parse(
      readFileSync(join(rootDir, 'package.json'), 'utf-8')
    );
    
    const requiredPM = packageJson.packageManager;
    if (!requiredPM) {
      checks.warnings.push('No package manager specified in package.json');
      console.log('⚠️  No package manager specified\n');
      return;
    }
    
    const [pmName, pmVersion] = requiredPM.split('@');
    
    try {
      const { stdout } = await execAsync(`${pmName} --version`);
      const installedVersion = stdout.trim();
      
      checks.passed.push(`Package manager ${pmName}@${installedVersion} is available`);
      console.log(`✅ ${pmName}@${installedVersion} (required: ${pmVersion})\n`);
    } catch (error) {
      checks.failed.push(`Required package manager ${pmName} is not installed`);
      console.log(`❌ ${pmName} is not installed\n`);
    }
  } catch (error) {
    checks.failed.push(`Failed to check package manager: ${error.message}`);
    console.log(`❌ Failed to check package manager: ${error.message}\n`);
  }
}

async function checkDependencies() {
  console.log('🔍 Checking dependencies...');
  
  const nodeModulesPath = join(rootDir, 'node_modules');
  
  if (!existsSync(nodeModulesPath)) {
    checks.failed.push('node_modules directory not found - dependencies not installed');
    console.log('❌ Dependencies not installed (node_modules missing)\n');
    return;
  }
  
  const lockfilePath = join(rootDir, 'pnpm-lock.yaml');
  
  if (!existsSync(lockfilePath)) {
    checks.warnings.push('pnpm-lock.yaml not found - lockfile missing');
    console.log('⚠️  Lockfile not found\n');
  } else {
    checks.passed.push('Dependencies installed and lockfile present');
    console.log('✅ Dependencies installed\n');
  }
}

async function checkDatabaseConnection() {
  console.log('🔍 Checking database connection...');
  
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    checks.skipped.push('Database check skipped - DATABASE_URL not configured');
    console.log('⚠️  DATABASE_URL not configured (skipped)\n');
    return;
  }
  
  try {
    // Try to import Prisma client
    const prismaPath = join(rootDir, 'node_modules/@prisma/client/index.js');
    
    if (!existsSync(prismaPath)) {
      checks.warnings.push('Prisma client not found - run "pnpm prisma generate"');
      console.log('⚠️  Prisma client not generated\n');
      return;
    }
    
    checks.passed.push('Database configuration present');
    console.log('✅ Database configured (connection not tested)\n');
  } catch (error) {
    checks.warnings.push(`Database check warning: ${error.message}`);
    console.log(`⚠️  Database check warning: ${error.message}\n`);
  }
}

async function checkContentLayer() {
  console.log('🔍 Checking Contentlayer...');
  
  const contentLayerPath = join(rootDir, '.contentlayer');
  
  if (!existsSync(contentLayerPath)) {
    checks.warnings.push('Contentlayer not built - run "pnpm content:build"');
    console.log('⚠️  Contentlayer not built\n');
    return;
  }
  
  const generatedPath = join(contentLayerPath, 'generated');
  if (existsSync(generatedPath)) {
    checks.passed.push('Contentlayer built successfully');
    console.log('✅ Contentlayer built\n');
  } else {
    checks.warnings.push('Contentlayer directory exists but generated files missing');
    console.log('⚠️  Contentlayer incomplete\n');
  }
}

async function checkEnvironmentVariables() {
  console.log('🔍 Checking environment variables...');
  
  const criticalVars = [
    'DATABASE_URL',
    'NEXTAUTH_URL',
    'NEXTAUTH_SECRET',
  ];
  
  const missing = criticalVars.filter(varName => !process.env[varName]);
  
  if (missing.length === 0) {
    checks.passed.push('All critical environment variables present');
    console.log('✅ Critical environment variables present\n');
  } else {
    checks.failed.push(`Missing critical environment variables: ${missing.join(', ')}`);
    console.log(`❌ Missing critical variables: ${missing.join(', ')}\n`);
  }
}

async function checkBuildArtifacts() {
  console.log('🔍 Checking build artifacts...');
  
  const nextPath = join(rootDir, '.next');
  
  if (!existsSync(nextPath)) {
    checks.warnings.push('Build artifacts not found - run "pnpm build"');
    console.log('⚠️  Not built yet (development mode OK)\n');
    return;
  }
  
  const buildManifest = join(nextPath, 'build-manifest.json');
  if (existsSync(buildManifest)) {
    checks.passed.push('Build artifacts present');
    console.log('✅ Build artifacts present\n');
  } else {
    checks.warnings.push('Build directory exists but build-manifest.json missing');
    console.log('⚠️  Build incomplete\n');
  }
}

async function checkGitRepository() {
  console.log('🔍 Checking Git repository...');
  
  const gitPath = join(rootDir, '.git');
  
  if (!existsSync(gitPath)) {
    checks.warnings.push('Not a Git repository');
    console.log('⚠️  Not a Git repository\n');
    return;
  }
  
  try {
    const { stdout: branch } = await execAsync('git rev-parse --abbrev-ref HEAD');
    const { stdout: status } = await execAsync('git status --porcelain');
    
    const uncommittedChanges = status.trim().split('\n').filter(line => line.trim()).length;
    
    checks.passed.push(`Git repository on branch: ${branch.trim()}`);
    console.log(`✅ Git repository (branch: ${branch.trim()})`);
    
    if (uncommittedChanges > 0) {
      checks.warnings.push(`${uncommittedChanges} uncommitted changes`);
      console.log(`⚠️  ${uncommittedChanges} uncommitted changes\n`);
    } else {
      console.log('✅ No uncommitted changes\n');
    }
  } catch (error) {
    checks.warnings.push('Git check failed - may not be a valid repository');
    console.log('⚠️  Git check failed\n');
  }
}

async function checkDiskSpace() {
  console.log('🔍 Checking disk space...');
  
  try {
    // This is platform-specific, we'll keep it simple
    const { stdout } = await execAsync(
      process.platform === 'win32' 
        ? 'wmic logicaldisk get size,freespace,caption'
        : 'df -h .'
    );
    
    checks.passed.push('Disk space check completed');
    console.log('✅ Disk space available (details not parsed)\n');
  } catch (error) {
    checks.skipped.push('Disk space check not available on this platform');
    console.log('⚠️  Disk space check skipped\n');
  }
}

async function checkTypescriptConfig() {
  console.log('🔍 Checking TypeScript configuration...');
  
  const tsconfigPath = join(rootDir, 'tsconfig.json');
  
  if (!existsSync(tsconfigPath)) {
    checks.failed.push('tsconfig.json not found');
    console.log('❌ tsconfig.json not found\n');
    return;
  }
  
  try {
    const tsconfig = JSON.parse(readFileSync(tsconfigPath, 'utf-8'));
    
    if (tsconfig.compilerOptions) {
      checks.passed.push('TypeScript configuration valid');
      console.log('✅ TypeScript configuration valid\n');
    } else {
      checks.warnings.push('TypeScript configuration missing compilerOptions');
      console.log('⚠️  TypeScript configuration incomplete\n');
    }
  } catch (error) {
    checks.failed.push(`TypeScript configuration invalid: ${error.message}`);
    console.log(`❌ TypeScript configuration invalid: ${error.message}\n`);
  }
}

async function printSummary() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 HEALTH CHECK SUMMARY');
  console.log('='.repeat(60) + '\n');
  
  console.log(`✅ Passed: ${checks.passed.length}`);
  console.log(`❌ Failed: ${checks.failed.length}`);
  console.log(`⚠️  Warnings: ${checks.warnings.length}`);
  console.log(`⏭️  Skipped: ${checks.skipped.length}\n`);
  
  if (checks.failed.length > 0) {
    console.log('❌ Failed Checks:');
    checks.failed.forEach(msg => console.log(`   - ${msg}`));
    console.log('');
  }
  
  if (checks.warnings.length > 0) {
    console.log('⚠️  Warnings:');
    checks.warnings.forEach(msg => console.log(`   - ${msg}`));
    console.log('');
  }
  
  const healthScore = Math.round(
    (checks.passed.length / (checks.passed.length + checks.failed.length + checks.warnings.length)) * 100
  );
  
  console.log(`📈 Health Score: ${healthScore}%\n`);
  
  if (checks.failed.length > 0) {
    console.log('❌ HEALTH CHECK FAILED\n');
    console.log('Please address the failed checks before deploying to production.\n');
    return 1;
  } else if (checks.warnings.length > 0) {
    console.log('⚠️  HEALTH CHECK PASSED WITH WARNINGS\n');
    console.log('Consider addressing warnings for optimal operation.\n');
    return 0;
  } else {
    console.log('✅ HEALTH CHECK PASSED\n');
    console.log('Application is healthy and ready!\n');
    return 0;
  }
}

async function runHealthCheck() {
  console.log('🏥 Starting Application Health Check...\n');
  console.log('='.repeat(60) + '\n');
  
  await checkNodeVersion();
  await checkPackageManager();
  await checkDependencies();
  await checkTypescriptConfig();
  await checkEnvironmentVariables();
  await checkDatabaseConnection();
  await checkContentLayer();
  await checkBuildArtifacts();
  await checkGitRepository();
  await checkDiskSpace();
  
  const exitCode = await printSummary();
  process.exit(exitCode);
}

// Run health check
runHealthCheck().catch(error => {
  console.error('❌ Health check failed with error:', error.message);
  console.error(error.stack);
  process.exit(1);
});
