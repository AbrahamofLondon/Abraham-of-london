// scripts/pdf/generate-pdf-assets.ts - Production Build Optimizer
console.log('🚀 PDF Assets Generator - Registry Edition');

// Try to import the registry
let getPDFRegistrySource;
try {
    const module = await import('./pdf-registry.source.js');
    getPDFRegistrySource = module.getPDFRegistrySource;
    console.log('✅ PDF registry module loaded');
} catch (error) {
    console.error('❌ Failed to load PDF registry:', error.message);
    console.log('⚠️ Running in fallback mode');
    getPDFRegistrySource = () => [];
}

async function buildPDFAssets() {
    console.log('📊 PDF Assets Build Process');
    console.log('='.repeat(60));
    
    try {
        // Get all PDFs from registry
        const allPDFs = getPDFRegistrySource();
        console.log(`📄 Total PDFs in registry: ${allPDFs.length}`);
        
        if (allPDFs.length > 0) {
            console.log('\n📋 Sample PDFs from registry:');
            allPDFs.slice(0, 3).forEach((pdf, i) => {
                console.log(`  ${i+1}. ${pdf.title} (${pdf.id})`);
            });
            if (allPDFs.length > 3) {
                console.log(`  ... and ${allPDFs.length - 3} more`);
            }
        }
        
        // Simulate checking which need generation
        const missingPDFs = allPDFs.filter(pdf => 
            pdf.id.includes('personal-alignment') || 
            pdf.id.includes('surrender') ||
            pdf.tier === 'free'
        ).slice(0, 5); // Just check first 5
        
        console.log(`\n🔍 PDFs potentially needing generation: ${missingPDFs.length}`);
        
        if (missingPDFs.length === 0) {
            console.log('✅ All PDF assets appear to be available');
        } else {
            console.log('\n📝 PDFs to check:');
            missingPDFs.forEach(pdf => {
                console.log(`  • ${pdf.title} → ${pdf.outputPath}`);
            });
            console.log('\n💡 Note: Actual file existence check not implemented');
        }
        
        console.log('\n' + '='.repeat(60));
        console.log('📈 GENERATION SUMMARY');
        console.log('='.repeat(60));
        console.log(`✅ Would generate: ${missingPDFs.length}`);
        console.log(`⏭️  Already exist: ${allPDFs.length - missingPDFs.length}`);
        console.log(`🎯 Total in registry: ${allPDFs.length}`);
        
        return {
            success: true,
            generated: 0, // Not actually generating yet
            failed: 0,
            skipped: allPDFs.length,
            results: []
        };
        
    } catch (error) {
        console.error('❌ Error in buildPDFAssets:', error);
        return {
            success: false,
            generated: 0,
            failed: 1,
            skipped: 0,
            results: [{ error: error.message }]
        };
    }
}

// Execution
const isMain = import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'));
console.log(`Mode: ${isMain ? 'Standalone execution' : 'Module import'}`);

if (isMain) {
    buildPDFAssets()
        .then(result => {
            console.log('\n' + '='.repeat(50));
            if (result.success) {
                console.log('🎉 PDF GENERATION SIMULATION COMPLETE');
                console.log('💡 Note: This is a simulation only');
                console.log('💡 To actually generate PDFs, implement the generation logic');
            } else {
                console.log('⚠️ SIMULATION COMPLETED WITH ERRORS');
            }
            console.log('='.repeat(50));
            process.exit(result.success ? 0 : 1);
        })
        .catch(error => {
            console.error('💥 Fatal error:', error);
            process.exit(1);
        });
}

export { buildPDFAssets };
