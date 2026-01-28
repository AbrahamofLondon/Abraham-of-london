// scripts/test-runner.js
console.log('1️⃣ Test script is running!');
console.log('2️⃣ Process args:', process.argv);
console.log('3️⃣ Current directory:', process.cwd());

// Try to import your optimizer
(async () => {
  console.log('4️⃣ Trying to import optimize-images.js...');
  try {
    const { optimizeImages } = await import('./optimize-images.js');
    console.log('5️⃣ Import successful!');
    
    // Run it
    console.log('6️⃣ Running optimizeImages function...');
    const result = await optimizeImages();
    console.log('7️⃣ Result:', result);
  } catch (error) {
    console.error('❌ Import/Run error:', error.message);
    console.error(error.stack);
  }
})();