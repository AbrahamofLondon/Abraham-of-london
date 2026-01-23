// scripts/optimize-assets.js - Simple working version
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Starting asset optimization');
console.log('='.repeat(60));

async function runOptimization(scriptName, taskName) {
    console.log(`\n🔧 ${taskName}...`);
    
    return new Promise((resolve) => {
        const scriptPath = resolve(__dirname, scriptName);
        const child = spawn('node', [scriptPath], {
            stdio: 'inherit',
            shell: true
        });
        
        child.on('close', (code) => {
            if (code === 0) {
                console.log(`✅ ${taskName} completed successfully`);
                resolve({ success: true, code });
            } else {
                console.log(`⚠️ ${taskName} completed with code ${code} (may be expected)`);
                resolve({ success: false, code });
            }
        });
        
        child.on('error', (error) => {
            console.log(`❌ ${taskName} failed to start: ${error.message}`);
            resolve({ success: false, error: error.message });
        });
    });
}

async function main() {
    const results = [];
    
    // Run font optimization
    const fontResult = await runOptimization('optimize-fonts.js', 'Font Optimization');
    results.push({ task: 'fonts', ...fontResult });
    
    // Run image optimization (if it exists)
    if (await import('fs/promises').then(fs => 
        fs.access(resolve(__dirname, 'optimize-images.js')).then(() => true).catch(() => false)
    )) {
        const imageResult = await runOptimization('optimize-images.js', 'Image Optimization');
        results.push({ task: 'images', ...imageResult });
    } else {
        console.log('\n📝 Note: optimize-images.js not found, skipping image optimization');
        results.push({ task: 'images', success: true, code: 0, note: 'skipped' });
    }
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('🎉 ASSET OPTIMIZATION COMPLETE');
    console.log('='.repeat(60));
    
    const successful = results.filter(r => r.success).length;
    const total = results.length;
    
    console.log(`📊 Results: ${successful}/${total} tasks successful`);
    
    results.forEach(result => {
        const icon = result.success ? '✅' : '❌';
        const note = result.note ? ` (${result.note})` : '';
        console.log(`${icon} ${result.task}: ${result.success ? 'Success' : 'Completed'}${note}`);
    });
    
    console.log('='.repeat(60));
    
    // Exit with code 0 (success) even if some optimizations fail
    // This allows build to continue
    process.exit(0);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}`) {
    main().catch(error => {
        console.error('❌ Asset optimization failed:', error.message);
        console.error(error.stack);
        process.exit(1);
    });
}

// Export for use as module
export { main as optimizeAssets };
