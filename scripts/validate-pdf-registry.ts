// scripts/validate-pdf-registry.ts
import { validateRegistry, getPDFStats } from './pdf-registry';

function validateAndReport() {
  console.log('🔍 PDF Registry Validation');
  console.log('='.repeat(50));
  
  const validation = validateRegistry();
  const stats = getPDFStats();
  
  console.log('\n📊 Registry Statistics:');
  console.log(`Total PDFs: ${stats.total}`);
  console.log(`Available: ${stats.available}`);
  console.log(`Interactive: ${stats.interactive}`);
  console.log(`Fillable: ${stats.fillable}`);
  
  console.log('\n📈 Distribution by Tier:');
  Object.entries(stats.byTier).forEach(([tier, count]) => {
    console.log(`  ${tier}: ${count}`);
  });
  
  console.log('\n📈 Distribution by Type:');
  Object.entries(stats.byType).forEach(([type, count]) => {
    console.log(`  ${type}: ${count}`);
  });
  
  if (validation.valid) {
    console.log('\n✅ Registry validation passed!');
    process.exit(0);
  } else {
    console.error('\n❌ Registry validation failed!');
    validation.errors.forEach(({ id, errors }) => {
      console.error(`\n  ${id}:`);
      errors.forEach(error => console.error(`    • ${error}`));
    });
    process.exit(1);
  }
}

validateAndReport();