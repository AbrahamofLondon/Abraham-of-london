const fs = require('fs');
const path = require('path');

console.log('🔍 Checking build integrity...\n');

// Check critical files exist
const criticalFiles = [
  'lib/utils/safe.ts',
  'components/canon/CanonHero.tsx',
  'components/AuthorBio.tsx',
  'components/books/BookReviews.tsx',
  'components/shorts/ShortHero.tsx',
];

let allGood = true;

criticalFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.error(`❌ Missing: ${file}`);
    allGood = false;
  }
});

// Check for .charAt usage in components
console.log('\n🔍 Scanning for unsafe patterns...');
const componentsDir = 'components';
if (fs.existsSync(componentsDir)) {
  const files = fs.readdirSync(componentsDir, { recursive: true });
  const tsxFiles = files.filter(f => f.endsWith('.tsx') || f.endsWith('.ts'));
  
  let unsafeFound = false;
  
  tsxFiles.forEach(file => {
    const fullPath = path.join(componentsDir, file);
    const content = fs.readFileSync(fullPath, 'utf8');
    
    if (content.includes('.charAt(')) {
      console.error(`⚠️  Potential unsafe .charAt in: ${file}`);
      unsafeFound = true;
    }
  });
  
  if (!unsafeFound) {
    console.log('✅ No obvious unsafe .charAt usage found');
  } else {
    allGood = false;
  }
}

// Final check
if (allGood) {
  console.log('\n✅ Build integrity check PASSED');
  process.exit(0);
} else {
  console.error('\n❌ Build integrity check FAILED');
  console.error('👉 Run: npm run fix:unsafe-strings');
  process.exit(1);
}