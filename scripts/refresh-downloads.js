const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

async function refreshDownloads() {
  const downloadsDir = path.join(__dirname, '../public/assets/downloads');
  
  console.log('🧹 Clearing downloads folder...');
  try {
    await fs.rm(downloadsDir, { recursive: true, force: true });
    await fs.mkdir(downloadsDir, { recursive: true });
    console.log('✅ Downloads folder cleared');
  } catch (error) {
    console.error('❌ Failed to clear folder:', error.message);
    return;
  }
  
  console.log('🚀 Generating fresh PDFs...');
  try {
    execSync('pnpm run pdfs:all', { stdio: 'inherit' });
    console.log('✅ PDFs generated');
  } catch (error) {
    console.error('❌ PDF generation failed:', error.message);
    return;
  }
  
  // Show results
  const files = await fs.readdir(downloadsDir);
  console.log(`📁 Generated ${files.length} files:`);
  files.forEach(file => {
    console.log(`  • ${file}`);
  });
}

refreshDownloads();