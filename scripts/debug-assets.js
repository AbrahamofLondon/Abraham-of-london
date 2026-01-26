// scripts/debug-assets.js
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFile, stat } from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔍 DEBUG: Asset Optimization Diagnostics');
console.log('='.repeat(60));

async function runWithOutput(command, args, label) {
    console.log(`\n▶️  ${label}`);
    console.log(`   Command: ${command} ${args.join(' ')}`);
    
    return new Promise((resolve) => {
        let output = '';
        let errorOutput = '';
        
        const child = spawn(command, args, {
            shell: true,
            cwd: process.cwd()
        });
        
        child.stdout.on('data', (data) => {
            const text = data.toString();
            output += text;
            process.stdout.write(text);
        });
        
        child.stderr.on('data', (data) => {
            const text = data.toString();
            errorOutput += text;
            process.stderr.write(text);
        });
        
        child.on('close', (code) => {
            console.log(`   Exit code: ${code}`);
            resolve({ 
                success: code === 0, 
                code, 
                output, 
                error: errorOutput 
            });
        });
        
        child.on('error', (err) => {
            console.log(`   Failed to start: ${err.message}`);
            resolve({ 
                success: false, 
                code: -1, 
                error: err.message 
            });
        });
    });
}

async function checkScript(filePath) {
    try {
        await stat(filePath);
        const content = await readFile(filePath, 'utf-8');
        
        // Check for common issues
        const issues = [];
        
        if (!content.includes('process.exit')) {
            issues.push('No explicit process.exit() call - may rely on async completion');
        }
        
        if (content.includes('__irectoryname')) {
            issues.push('Contains typo: __irectoryname instead of __dirname');
        }
        
        if (content.includes('console.log')) {
            console.log(`   ✅ Has console.log statements`);
        } else {
            issues.push('No console.log statements - silent execution');
        }
        
        return { exists: true, issues, firstLine: content.split('\n')[0] };
    } catch (err) {
        return { exists: false, error: err.message };
    }
}

async function main() {
    console.log('📋 Checking script files...\n');
    
    // Check optimize-assets.js
    const assetsCheck = await checkScript(join(__dirname, 'optimize-assets.js'));
    console.log('📄 optimize-assets.js:');
    console.log(`   Exists: ${assetsCheck.exists}`);
    if (assetsCheck.issues?.length) {
        console.log(`   Issues: ${assetsCheck.issues.join(', ')}`);
    }
    
    // Check optimize-images.js
    const imagesCheck = await checkScript(join(__dirname, 'optimize-images.js'));
    console.log('\n📄 optimize-images.js:');
    console.log(`   Exists: ${imagesCheck.exists}`);
    if (imagesCheck.issues?.length) {
        console.log(`   Issues: ${imagesCheck.issues.join(', ')}`);
    }
    
    // Check optimize-fonts.js
    const fontsCheck = await checkScript(join(__dirname, 'optimize-fonts.js'));
    console.log('\n📄 optimize-fonts.js:');
    console.log(`   Exists: ${fontsCheck.exists}`);
    if (fontsCheck.issues?.length) {
        console.log(`   Issues: ${fontsCheck.issues.join(', ')}`);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('🚀 Running tests...');
    console.log('='.repeat(60));
    
    // Test 1: Run optimize-images.js
    const imageResult = await runWithOutput(
        'node',
        [join(__dirname, 'optimize-images.js')],
        'Test Image Optimization'
    );
    
    // Test 2: Run optimize-fonts.js
    const fontResult = await runWithOutput(
        'node',
        [join(__dirname, 'optimize-fonts.js')],
        'Test Font Optimization'
    );
    
    // Test 3: Run security scan
    const securityResult = await runWithOutput(
        'npx',
        ['tsx', join(__dirname, 'security/security-scan.ts')],
        'Test Security Scan'
    );
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY');
    console.log('='.repeat(60));
    console.log(`Images: ${imageResult.success ? '✅' : '❌'} (code: ${imageResult.code})`);
    console.log(`Fonts: ${fontResult.success ? '✅' : '❌'} (code: ${fontResult.code})`);
    console.log(`Security: ${securityResult.success ? '✅' : '❌'} (code: ${securityResult.code})`);
    
    // If all scripts run but produce no output, they might be exiting immediately
    if (imageResult.output.trim() === '' && fontResult.output.trim() === '') {
        console.log('\n⚠️  WARNING: Scripts are running but producing NO output');
        console.log('   This usually means they exit immediately or have no console.log statements');
    }
}

// Run immediately
main().catch(err => {
    console.error('Debug failed:', err);
});