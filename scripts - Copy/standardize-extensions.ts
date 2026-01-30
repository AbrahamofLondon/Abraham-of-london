// scripts/standardize-extensions.ts
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import readline from 'readline';

interface FileConversion {
  oldPath: string;
  newPath: string;
  type: 'mjs-to-ts' | 'js-to-ts' | 'tsx-to-ts' | 'other';
}

class ExtensionStandardizer {
  private conversions: FileConversion[] = [];
  private errors: string[] = [];

  async standardizeScriptsFolder() {
    console.log('🔧 Standardizing scripts folder extensions...');
    
    const scriptsDir = path.join(process.cwd(), 'scripts');
    const files = this.getAllFiles(scriptsDir);
    
    for (const file of files) {
      const ext = path.extname(file);
      const dir = path.dirname(file);
      const basename = path.basename(file, ext);
      
      let newExt: string | null = null;
      let type: FileConversion['type'] = 'other';
      
      // Determine new extension
      if (ext === '.mjs' || ext === '.js') {
        newExt = '.ts';
        type = ext === '.mjs' ? 'mjs-to-ts' : 'js-to-ts';
      } else if (ext === '.tsx' && !file.includes('.tsx')) {
        // Only convert .tsx to .ts if it's not a React component
        const content = fs.readFileSync(file, 'utf8');
        if (!this.containsJSX(content)) {
          newExt = '.ts';
          type = 'tsx-to-ts';
        }
      }
      
      if (newExt) {
        const newPath = path.join(dir, `${basename}${newExt}`);
        
        // Skip if file already exists
        if (fs.existsSync(newPath)) {
          console.log(`⚠️  Skipping ${file}: ${newPath} already exists`);
          continue;
        }
        
        this.conversions.push({
          oldPath: file,
          newPath,
          type
        });
      }
    }
    
    console.log(`📋 Found ${this.conversions.length} files to convert`);
    return this.conversions;
  }
  
  async performConversions(dryRun = true) {
    console.log(dryRun ? '🔍 DRY RUN - No changes will be made' : '🚀 Performing conversions...');
    
    for (const conversion of this.conversions) {
      try {
        console.log(`  ${conversion.type}: ${path.relative(process.cwd(), conversion.oldPath)} → ${path.relative(process.cwd(), conversion.newPath)}`);
        
        if (!dryRun) {
          // Read the file
          const content = fs.readFileSync(conversion.oldPath, 'utf8');
          
          // Update imports if needed
          let updatedContent = content;
          
          // Update imports from .mjs/.js to .ts
          updatedContent = updatedContent.replace(
            /from\s+['"](\.\/|\.\.\/)[^'"]+\.(mjs|js)['"]/g,
            (match, prefix, oldExt) => {
              return match.replace(`.${oldExt}`, '.ts');
            }
          );
          
          // Write to new file
          fs.writeFileSync(conversion.newPath, updatedContent, 'utf8');
          
          console.log(`    ✅ Created: ${path.basename(conversion.newPath)}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.errors.push(`Failed to convert ${conversion.oldPath}: ${errorMessage}`);
        console.error(`    ❌ Error: ${errorMessage}`);
      }
    }
    
    if (dryRun) {
      console.log('\n📝 Summary of changes (dry run):');
      console.log(`  Total files to convert: ${this.conversions.length}`);
      
      const byType = this.conversions.reduce((acc, conv) => {
        acc[conv.type] = (acc[conv.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      Object.entries(byType).forEach(([type, count]) => {
        console.log(`  ${type}: ${count} files`);
      });
    } else {
      console.log(`\n✅ Conversions completed: ${this.conversions.length} files converted`);
      console.log(`❌ Errors: ${this.errors.length}`);
      
      if (this.errors.length > 0) {
        console.log('\nErrors:');
        this.errors.forEach(error => console.log(`  ${error}`));
      }
    }
  }
  
  async updatePackageJsonScripts() {
    console.log('\n📦 Updating package.json scripts...');
    
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    let updatedCount = 0;
    
    for (const [scriptName, scriptCommand] of Object.entries(packageJson.scripts)) {
      if (typeof scriptCommand === 'string') {
        // Update .mjs/.js references to .ts
        let updatedCommand = scriptCommand
          .replace(/\.mjs\b/g, '.ts')
          .replace(/\bnode\s+[^ ]+\.js\b/g, (match) => {
            return match.replace('.js', '.ts');
          })
          .replace(/npx tsx [^ ]+\.js/g, (match) => {
            return match.replace('.js', '.ts');
          });
        
        if (updatedCommand !== scriptCommand) {
          packageJson.scripts[scriptName] = updatedCommand;
          updatedCount++;
          console.log(`  Updated script: ${scriptName}`);
        }
      }
    }
    
    // Write updated package.json
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf8');
    console.log(`✅ Updated ${updatedCount} script references in package.json`);
  }
  
  async cleanUpOldFiles() {
    console.log('\n🗑️  Cleaning up old files...');
    
    let deletedCount = 0;
    for (const conversion of this.conversions) {
      try {
        if (fs.existsSync(conversion.oldPath)) {
          fs.unlinkSync(conversion.oldPath);
          deletedCount++;
          console.log(`  Deleted: ${path.relative(process.cwd(), conversion.oldPath)}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`  ❌ Failed to delete ${conversion.oldPath}: ${errorMessage}`);
      }
    }
    
    console.log(`✅ Deleted ${deletedCount} old files`);
  }
  
  async createTsConfigForScripts() {
    console.log('\n⚙️  Creating tsconfig for scripts...');
    
    const tsConfigPath = path.join(process.cwd(), 'scripts', 'tsconfig.json');
    
    const tsConfig = {
      "extends": "../tsconfig.json",
      "compilerOptions": {
        "module": "ESNext",
        "moduleResolution": "node",
        "target": "ES2020",
        "lib": ["ES2020"],
        "strict": true,
        "esModuleInterop": true,
        "skipLibCheck": true,
        "forceConsistentCasingInFileNames": true,
        "resolveJsonModule": true,
        "isolatedModules": true,
        "noEmit": true,
        "allowImportingTsExtensions": true
      },
      "include": [
        "**/*.ts"
      ],
      "exclude": [
        "node_modules",
        "**/*.test.ts",
        "**/*.spec.ts"
      ]
    };
    
    fs.writeFileSync(tsConfigPath, JSON.stringify(tsConfig, null, 2), 'utf8');
    console.log('✅ Created scripts/tsconfig.json');
  }
  
  private getAllFiles(dir: string): string[] {
    const files: string[] = [];
    
    const items = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      
      if (item.isDirectory()) {
        // Skip node_modules and .git
        if (item.name !== 'node_modules' && item.name !== '.git') {
          files.push(...this.getAllFiles(fullPath));
        }
      } else {
        files.push(fullPath);
      }
    }
    
    return files;
  }
  
  private containsJSX(content: string): boolean {
    // Simple JSX detection
    const jsxPatterns = [
      /<[A-Za-z][^>]*>/,
      /<\/[A-Za-z][^>]*>/,
      /className=/,
      /onClick=/,
      /import.*from.*['"]react['"]/,
      /import.*['"]react['"]/
    ];
    
    return jsxPatterns.some(pattern => pattern.test(content));
  }
}

async function askQuestion(query: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve => {
    rl.question(query, answer => {
      rl.close();
      resolve(answer);
    });
  });
}

async function main() {
  const standardizer = new ExtensionStandardizer();
  
  try {
    // Step 1: Scan for files to convert
    await standardizer.standardizeScriptsFolder();
    
    // Step 2: Show what will be changed (dry run)
    console.log('\n--- DRY RUN ---');
    await standardizer.performConversions(true);
    
    // Ask for confirmation
    const answer = await askQuestion('\n⚠️  Proceed with conversion? (yes/no): ');
    
    if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
      // Step 3: Perform actual conversion
      console.log('\n--- ACTUAL CONVERSION ---');
      await standardizer.performConversions(false);
      
      // Step 4: Update package.json
      await standardizer.updatePackageJsonScripts();
      
      // Step 5: Create tsconfig for scripts
      await standardizer.createTsConfigForScripts();
      
      // Step 6: Clean up old files (optional)
      const answer2 = await askQuestion('\n⚠️  Delete old .mjs/.js files? (yes/no): ');
      
      if (answer2.toLowerCase() === 'yes' || answer2.toLowerCase() === 'y') {
        await standardizer.cleanUpOldFiles();
      }
      
      console.log('\n🎉 Standardization complete!');
      console.log('\n📝 Next steps:');
      console.log('  1. Run: npm run type-check');
      console.log('  2. Fix any TypeScript errors');
      console.log('  3. Test your scripts');
      console.log('  4. Commit changes');
    } else {
      console.log('Conversion cancelled.');
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Error during standardization:', errorMessage);
    process.exit(1);
  }
}

// Run if called directly
const isMain = import.meta.url.endsWith(process.argv[1]) || process.argv[1]?.includes('standardize-extensions.ts');
if (isMain) {
  main().catch(console.error);
}

export { ExtensionStandardizer };