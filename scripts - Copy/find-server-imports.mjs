// scripts/find-server-imports.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

async function findServerImports() {
  console.log('🔍 Scanning for imports of server modules...\n');
  
  // Check all .ts, .tsx, .js, .jsx files
  const files = await glob('**/*.{ts,tsx,js,jsx}', { 
    cwd: rootDir,
    ignore: ['node_modules/**', '.next/**', 'dist/**']
  });
  
  const issues = [];
  
  for (const file of files) {
    const content = fs.readFileSync(path.join(rootDir, file), 'utf8');
    
    // Pattern 1: Importing server modules from client barrels
    if (content.includes("from '@/lib/rate-limit'") || 
        content.includes('from "@/lib/rate-limit"')) {
      
      // Check what's being imported
      const importMatches = content.match(/import\s*{([^}]+)}\s*from\s*['"]@\/lib\/rate-limit['"]/);
      if (importMatches) {
        const importedItems = importMatches[1].split(',').map(s => s.trim()).filter(s => s);
        
        // These are server-only and problematic
        const serverItems = importedItems.filter(item => 
          ['RATE_LIMIT_CONFIGS', 'isRateLimited', 'withApiRateLimit', 
           'rateLimitForRequestIp', 'getClientIp', 'createRateLimitHeaders'].includes(item)
        );
        
        if (serverItems.length > 0) {
          issues.push({
            file,
            line: content.split('\n').findIndex(l => l.includes('@/lib/rate-limit')) + 1,
            imports: serverItems,
            fullLine: content.split('\n').find(l => l.includes('@/lib/rate-limit'))
          });
        }
      }
    }
    
    // Pattern 2: Direct imports of lib/server/* in client files
    if (!file.includes('/api/') && !file.includes('/server/')) {
      if (content.includes("from '@/lib/server/") || 
          content.includes('from "@/lib/server/')) {
        console.log(`⚠️  Possible server import in client file: ${file}`);
      }
    }
  }
  
  console.log('\n📊 SERVER MODULE IMPORTS FROM CLIENT BARREL:');
  if (issues.length === 0) {
    console.log('✅ No issues found!');
  } else {
    console.log(`Found ${issues.length} files that need fixing:\n`);
    issues.forEach(issue => {
      console.log(`📄 ${issue.file}:${issue.line}`);
      console.log(`   ${issue.fullLine}`);
      console.log(`   Server-only imports: ${issue.imports.join(', ')}`);
      console.log(`   → Should import from: @/lib/server/rateLimit\n`);
    });
  }
}

findServerImports();