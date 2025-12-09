// scripts/verify-types.ts
import * as fs from 'fs';
import * as path from 'path';

console.log('=== TYPE VERIFICATION SCRIPT ===\n');

// 1. Check if types/post.ts exists
const typePath = path.join(process.cwd(), 'types', 'post.ts');
console.log('1. Checking types/post.ts file...');
console.log(`   File exists: ${fs.existsSync(typePath)}`);

if (fs.existsSync(typePath)) {
  const content = fs.readFileSync(typePath, 'utf8');
  
  // 2. Check for ImageType
  const hasImageType = content.includes('export type ImageType');
  console.log(`   Has ImageType export: ${hasImageType}`);
  
  // 3. Check for coverImage in PostBase
  const hasCoverImage = content.includes('coverImage?: ImageType');
  console.log(`   Has coverImage in PostBase: ${hasCoverImage}`);
  
  // 4. Show relevant lines
  console.log('\n   Relevant lines:');
  const lines = content.split('\n');
  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (trimmed.includes('ImageType') || trimmed.includes('coverImage') || trimmed.includes('PostBase')) {
      console.log(`   [${index + 1}] ${trimmed}`);
    }
  });
}

// 5. Check tsconfig.json
const tsconfigPath = path.join(process.cwd(), 'tsconfig.json');
console.log('\n2. Checking tsconfig.json...');
if (fs.existsSync(tsconfigPath)) {
  try {
    const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
    console.log(`   Paths configured: ${JSON.stringify(tsconfig.compilerOptions?.paths)}`);
  } catch (e) {
    console.log('   Error reading tsconfig');
  }
}

// 6. Check content-loader.ts import
const loaderPath = path.join(process.cwd(), 'lib', 'content-loader.ts');
console.log('\n3. Checking content-loader.ts import...');
if (fs.existsSync(loaderPath)) {
  const content = fs.readFileSync(loaderPath, 'utf8');
  const lines = content.split('\n');
  console.log('   Import statement:');
  lines.slice(0, 5).forEach((line, index) => {
    console.log(`   [${index + 1}] ${line.trim()}`);
  });
}

console.log('\n=== END VERIFICATION ===');