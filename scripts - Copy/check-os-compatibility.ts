import os from 'os';

function checkOSCompatibility() {
  console.log('🖥️  System Check:');
  console.log(`  Platform: ${process.platform}`);
  console.log(`  Arch: ${process.arch}`);
  console.log(`  Node: ${process.version}`);
  
  if (process.platform === 'win32') {
    console.log('⚠️  Windows detected - using file locking workarounds');
    process.env.IS_WINDOWS = 'true';
  }
  
  return true;
}

checkOSCompatibility();