// scripts/pdf/test-puppeteer.ts
import { SecurePuppeteerPDFGenerator } from './secure-puppeteer-generator';

async function testPuppeteer() {
  console.log('\n\x1b[1;36m🧪 TESTING PUPPETEER INSTALLATION\x1b[0m');
  console.log('\x1b[90m────────────────────────────────────────────────────────────\x1b[0m');
  
  const generator = new SecurePuppeteerPDFGenerator({
    timeout: 30000,
    maxRetries: 3,
  });
  
  try {
    // Test health check
    console.log('🔍 Checking Puppeteer health...');
    const health = await generator.healthCheck();
    
    console.log(`  ✅ Puppeteer Version: ${health.puppeteerVersion}`);
    console.log(`  ✅ Browser Status: ${health.browserStatus}`);
    if (health.chromeVersion) {
      console.log(`  ✅ Chrome Version: ${health.chromeVersion}`);
    }
    console.log(`  ✅ Healthy: ${health.isHealthy ? 'YES' : 'NO'}`);
    
    if (health.isHealthy) {
      console.log('\n📄 Testing PDF generation...');
      
      const testHTML = `
        <h1>Puppeteer Test Document</h1>
        <p>This is a test to verify Puppeteer is working correctly.</p>
        <p>Generated on: ${new Date().toLocaleString()}</p>
        <ul>
          <li>✅ Puppeteer is installed</li>
          <li>✅ Browser can be launched</li>
          <li>✅ PDF can be generated</li>
        </ul>
      `;
      
      const result = await generator.generateSecurePDF(
        testHTML,
        './test-puppeteer-output.pdf',
        {
          format: 'A4',
          margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' },
          printBackground: true,
        }
      );
      
      console.log(`\n✅ SUCCESS! PDF generated:`);
      console.log(`   📁 File: ${result.filePath}`);
      console.log(`   📊 Size: ${(result.size / 1024).toFixed(1)} KB`);
      console.log(`   ⏱️  Time: ${result.duration}ms`);
      console.log(`   🔒 Hash: ${result.hash?.substring(0, 16)}...`);
      
    } else {
      console.log('\n❌ Puppeteer is not working correctly.');
      console.log('\n🔄 Troubleshooting steps:');
      console.log('1. Make sure Chrome/Chromium is installed');
      console.log('2. Try: npm install puppeteer');
      console.log('3. For Windows, ensure Chrome is in Program Files');
      console.log('4. Try running with admin privileges');
    }
    
  } catch (error: any) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error('\n🔧 Try these fixes:');
    console.error('1. npm install puppeteer');
    console.error('2. Set PUPPETEER_SKIP_DOWNLOAD=false before installing');
    console.error('3. Install Chrome manually if needed');
  } finally {
    await generator.close();
  }
  
  console.log('\n\x1b[90m────────────────────────────────────────────────────────────\x1b[0m');
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, '/')}`) {
  testPuppeteer().catch(console.error);
}

export { testPuppeteer };