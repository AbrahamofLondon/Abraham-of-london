// scripts/fix-prisma-permissions.mjs
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

console.log('🔧 Fixing Prisma Windows file permissions...');

async function fixPermissions() {
  const prismaClientDir = path.join(rootDir, 'node_modules', '.prisma', 'client');
  
  try {
    // Check if directory exists
    await fs.access(prismaClientDir);
    
    // List files that might be locked
    const files = await fs.readdir(prismaClientDir);
    
    console.log('Found Prisma client files:', files.length);
    
    // Try to touch each file to release locks
    for (const file of files) {
      if (file.endsWith('.node') || file.endsWith('.node.tmp')) {
        const filePath = path.join(prismaClientDir, file);
        try {
          const stats = await fs.stat(filePath);
          await fs.utimes(filePath, stats.atime, new Date());
          console.log(`✅ Fixed: ${file}`);
        } catch (error) {
          console.log(`⚠️  Could not fix ${file}: ${error.message}`);
        }
      }
    }
    
    console.log('\n✅ Prisma file permissions fixed.');
    console.log('Try running: npx prisma generate');
    
  } catch (error) {
    console.log('⚠️  Could not access Prisma client directory:', error.message);
  }
}

fixPermissions().catch(console.error);
