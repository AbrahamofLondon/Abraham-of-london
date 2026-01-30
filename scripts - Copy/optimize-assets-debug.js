// scripts/optimize-assets-debug.js - ES Module Debug Version
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 DEBUG: Starting asset optimization debug');
console.log('='.repeat(60));

async function runCommand(command, args, label) {
    console.log(`\n🔧 ${label}...`);
    console.log(`   Command: ${command} ${args.join(' ')}`);
    
    return new Promise((resolvePromise) => {
        const child = spawn(command, args, {
            stdio: 'inherit',
            shell: true
        });
        
        child.on('close', (code) => {
            if (code === 0) {
                console.log(`   ✅ ${label} completed successfully`);
                resolvePromise({ success: true, code });
            } else {
                console.log(`   ❌ ${label} failed with code ${code}`);
                resolvePromise({ success: false, code });
            }
        });
        
        child.on('error', (error) => {
            console.log(`   ❌ ${label} failed to start: ${error.message}`);
            resolvePromise({ success: false, error: error.message });
        });
    });
}

async function main() {
    console.log('📦 Debug mode: Running each optimization step separately');
    
    // Try to import and run the main optimize-assets module
    try {
        console.log('\n1. Trying to import optimize-assets.js...');
        const module = await import('./optimize-assets.js');
        
        if (module.main) {
            console.log('✅ Module loaded, running main()...');
            await module.main();
            console.log('✅ optimize-assets.js completed');
            return;
        } else {
            console.log('⚠️ Module loaded but no main() function found');
        }
    } catch (importError) {
        console.log(`⚠️ Failed to import optimize-assets.js: ${importError.message}`);
        console.log('💡 Running fallback direct execution...');
    }
    
    // Fallback: Run each optimization separately
    console.log('\n2. Running fallback optimization steps...');
    
    const results = [];
    
    // Font optimization
    const fontResult = await runCommand('node', [resolve(__dirname, 'optimize-fonts.js')], 'Font Optimization');
    results.push({ task: 'fonts', ...fontResult });
    
    // Image optimization
    const imageResult = await runCommand('node', [resolve(__dirname, 'optimize-images.js')], 'Image Optimization');
    results.push({ task: 'images', ...imageResult });
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 DEBUG SUMMARY');
    console.log('='.repeat(60));
    
    results.forEach(result => {
        const icon = result.success ? '✅' : '❌';
        console.log(`${icon} ${result.task}: ${result.success ? 'Success' : 'Failed'} (code: ${result.code || 'N/A'})`);
    });
    
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    console.log('='.repeat(60));
    console.log(`✅ Successful: ${successful}`);
    console.log(`❌ Failed: ${failed}`);
    console.log('='.repeat(60));
    
    // Exit with code 0 unless everything failed
    const allFailed = results.every(r => !r.success);
    process.exit(allFailed ? 1 : 0);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}`) {
    main().catch(error => {
        console.error('❌ Debug script failed:', error.message);
        console.error(error.stack);
        process.exit(1);
    });
}
