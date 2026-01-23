// scripts/test-pdf-generation.js
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runTest(testName, args) {
    console.log(`\n🔧 ${testName}`);
    console.log('='.repeat(50));
    
    return new Promise((resolve) => {
        const child = spawn('npx', ['tsx', 'scripts/pdf/generate-interactive-pdf.ts', ...args], {
            stdio: 'inherit',
            shell: true
        });
        
        child.on('close', (code) => {
            console.log(`📦 Exit code: ${code}`);
            console.log('='.repeat(50));
            resolve(code === 0);
        });
    });
}

async function main() {
    console.log('🧪 PDF Generation Test Suite');
    console.log('='.repeat(50));
    
    const tests = [
        {
            name: 'Test 1: Help command',
            args: ['--help'],
            expected: true
        },
        {
            name: 'Test 2: Check LibreOffice',
            args: ['--check-libreoffice'],
            expected: true // Should succeed whether LibreOffice is available or not
        },
        {
            name: 'Test 3: Basic PDF generation (A4)',
            args: ['--formats', 'A4', '--output-dir', './test-output'],
            expected: true
        },
        {
            name: 'Test 4: Multiple formats',
            args: ['--formats', 'A4,Letter', '--quality', 'premium'],
            expected: true
        },
        {
            name: 'Test 5: Try LibreOffice (if available)',
            args: ['--formats', 'A4', '--use-libreoffice', '--output-dir', './test-output'],
            expected: true // Should fall back to pdf-lib if LibreOffice not available
        }
    ];
    
    let passed = 0;
    let failed = 0;
    
    for (const test of tests) {
        const success = await runTest(test.name, test.args);
        
        if (success === test.expected) {
            console.log(`✅ ${test.name} - PASSED`);
            passed++;
        } else {
            console.log(`❌ ${test.name} - FAILED`);
            failed++;
        }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 TEST RESULTS');
    console.log('='.repeat(50));
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Success rate: ${((passed / tests.length) * 100).toFixed(1)}%`);
    console.log('='.repeat(50));
    
    // Cleanup test output
    const fs = await import('fs/promises');
    try {
        await fs.rm('./test-output', { recursive: true, force: true });
        console.log('🧹 Cleaned up test output');
    } catch (error) {
        // Ignore cleanup errors
    }
    
    process.exit(failed > 0 ? 1 : 0);
}

main().catch(error => {
    console.error('Test suite failed:', error);
    process.exit(1);
});
