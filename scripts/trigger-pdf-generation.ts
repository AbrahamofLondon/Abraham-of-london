// scripts/trigger-pdf-generation.ts
async function triggerPDFGeneration() {
  const apiKey = process.env.PDF_GENERATION_API_KEY;
  
  if (!apiKey) {
    console.error('❌ PDF_GENERATION_API_KEY not set in environment');
    process.exit(1);
  }
  
  try {
    const response = await fetch('http://localhost:3000/api/generate-all-pdfs', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ PDF Generation Results:');
      console.log(JSON.stringify(data, null, 2));
    } else {
      console.error('❌ PDF Generation Failed:', data);
    }
    
  } catch (error) {
    console.error('💥 Error triggering PDF generation:', error);
  }
}

// Run if called directly
if (require.main === module) {
  triggerPDFGeneration();
}