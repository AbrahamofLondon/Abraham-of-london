import os from 'os';
import fs from 'fs';
import path from 'path';

function checkRequirements() {
  const requirements = [
    {
      name: 'Node.js',
      check: () => {
        const version = process.versions.node;
        const major = parseInt(version.split('.')[0]);
        return major >= 18;
      },
      message: 'Node.js 18+ required'
    },
    {
      name: 'Memory',
      check: () => {
        const totalMem = os.totalmem() / (1024 * 1024 * 1024);
        return totalMem >= 4;
      },
      message: '4GB+ RAM recommended'
    },
    {
      name: 'TypeScript',
      check: () => {
        try {
          require.resolve('typescript');
          return true;
        } catch {
          return false;
        }
      },
      message: 'TypeScript not installed'
    },
    {
      name: 'Prisma',
      check: () => {
        const prismaPath = path.join(process.cwd(), 'prisma/schema.prisma');
        return fs.existsSync(prismaPath);
      },
      message: 'Prisma schema not found'
    }
  ];
  
  console.log('🔍 System Requirements Check\n');
  
  let allPassed = true;
  
  requirements.forEach(req => {
    const passed = req.check();
    console.log(`${passed ? '✅' : '❌'} ${req.name}: ${passed ? 'OK' : req.message}`);
    if (!passed) allPassed = false;
  });
  
  if (!allPassed) {
    console.error('\n❌ System requirements not met');
    process.exit(1);
  }
  
  console.log('\n✅ All requirements met');
}

checkRequirements();