// scripts/validate-schema.mjs
import { execSync } from 'child_process';
import fs from 'fs';

console.log('🔍 Validating Contentlayer Schema...');

try {
  // Run contentlayer build and capture warnings
  const result = execSync('npx contentlayer2 build', { 
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe']
  });
  
  const warnings = result.match(/has the following extra fields:/g);
  const warningCount = warnings ? warnings.length : 0;
  
  if (warningCount > 0) {
    console.log(`⚠️  Found ${warningCount} schema warnings`);
    
    // Extract missing fields
    const missingFields = new Set();
    result.split('\n').forEach(line => {
      const match = line.match(/• (\w+):/);
      if (match) missingFields.add(match[1]);
    });
    
    console.log('Missing fields:', Array.from(missingFields));
    
    // Generate update suggestions
    if (missingFields.size > 0) {
      console.log('\n📝 Add these fields to commonFields:');
      missingFields.forEach(field => {
        console.log(`  ${field}: { type: "string", required: false },`);
      });
    }
  } else {
    console.log('✅ Schema validation passed!');
  }
  
  process.exit(warningCount > 0 ? 1 : 0);
} catch (error) {
  console.error('❌ Validation failed:', error.message);
  process.exit(1);
}
