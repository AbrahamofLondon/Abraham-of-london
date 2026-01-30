// scripts/optimize-assets.js - PRODUCTION READY VERSION
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve, join } from 'path';
import { stat } from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = resolve(__dirname, '..');

console.log('🚀 Starting asset optimization');
console.log('='.repeat(60));
console.log(`📁 Project Root: ${PROJECT_ROOT}`);
console.log(`📁 Scripts Dir: ${__dirname}`);

class AssetOptimizer {
    constructor() {
        this.results = [];
        this.startTime = Date.now();
    }

    async runCommand(command, args, label, cwd = PROJECT_ROOT) {
        console.log(`\n▶️  ${label}`);
        console.log(`   Command: ${command} ${args.join(' ')}`);
        
        const commandStart = Date.now();
        
        return new Promise((resolvePromise) => {
            const child = spawn(command, args, {
                stdio: 'inherit',
                shell: true,
                cwd,
                env: { ...process.env, FORCE_COLOR: '1' }
            });
            
            child.on('close', (code) => {
                const duration = Date.now() - commandStart;
                const status = code === 0 ? '✅' : code === 1 ? '⚠️' : '❌';
                console.log(`   ${status} ${label} completed in ${duration}ms (code: ${code})`);
                resolvePromise({ 
                    success: code === 0 || code === 1, 
                    code, 
                    duration,
                    label 
                });
            });
            
            child.on('error', (error) => {
                const duration = Date.now() - commandStart;
                console.log(`   ❌ ${label} failed: ${error.message}`);
                resolvePromise({ 
                    success: false, 
                    error: error.message, 
                    duration,
                    label 
                });
            });
        });
    }

    async checkScriptExists(scriptPath) {
        try {
            await stat(scriptPath);
            return true;
        } catch {
            return false;
        }
    }

    async runSecurityScan() {
        const securityScript = join(__dirname, 'security', 'security-scan.ts');
        const exists = await this.checkScriptExists(securityScript);
        
        if (!exists) {
            console.log('\n⚠️  Security scan script not found, skipping...');
            return { success: true, skipped: true, label: 'Security Scan' };
        }
        
        return await this.runCommand(
            'npx',
            ['tsx', 'scripts/security/security-scan.ts'],
            'Security Scan'
        );
    }

    async runFontOptimization() {
        const fontScript = join(__dirname, 'optimize-fonts.js');
        const exists = await this.checkScriptExists(fontScript);
        
        if (!exists) {
            console.log('\n⚠️  Font optimization script not found, skipping...');
            return { success: true, skipped: true, label: 'Font Optimization' };
        }
        
        return await this.runCommand(
            'node',
            ['scripts/optimize-fonts.js'],
            'Font Optimization'
        );
    }

    async runImageOptimization() {
        const imageScript = join(__dirname, 'optimize-images.js');
        const exists = await this.checkScriptExists(imageScript);
        
        if (!exists) {
            console.log('\n⚠️  Image optimization script not found, skipping...');
            return { success: true, skipped: true, label: 'Image Optimization' };
        }
        
        return await this.runCommand(
            'node',
            ['scripts/optimize-images.js'],
            'Image Optimization'
        );
    }

    async runAll() {
        console.log('\n' + '='.repeat(60));
        console.log('🔄 EXECUTING OPTIMIZATION PIPELINE');
        console.log('='.repeat(60));
        
        // 1. Security Scan (Critical)
        const securityResult = await this.runSecurityScan();
        this.results.push(securityResult);
        
        // 2. Font Optimization
        const fontResult = await this.runFontOptimization();
        this.results.push(fontResult);
        
        // 3. Image Optimization
        const imageResult = await this.runImageOptimization();
        this.results.push(imageResult);
        
        return this.generateReport();
    }

    generateReport() {
        const totalTime = Date.now() - this.startTime;
        
        console.log('\n' + '='.repeat(60));
        console.log('📊 OPTIMIZATION REPORT');
        console.log('='.repeat(60));
        
        const successful = this.results.filter(r => r.success).length;
        const failed = this.results.filter(r => !r.success).length;
        const skipped = this.results.filter(r => r.skipped).length;
        const executed = this.results.filter(r => !r.skipped).length;
        
        console.log(`📈 Summary:`);
        console.log(`   • Total tasks: ${this.results.length}`);
        console.log(`   • Executed: ${executed}`);
        console.log(`   • Successful: ${successful}`);
        console.log(`   • Failed: ${failed}`);
        console.log(`   • Skipped: ${skipped}`);
        console.log(`   • Total time: ${totalTime}ms`);
        
        console.log(`\n📋 Detailed Results:`);
        this.results.forEach((result, index) => {
            const icon = result.skipped ? '🔸' : (result.success ? '✅' : '❌');
            const status = result.skipped ? 'Skipped' : (result.success ? 'Success' : 'Failed');
            const time = result.duration ? ` (${result.duration}ms)` : '';
            const code = result.code !== undefined ? ` [code: ${result.code}]` : '';
            console.log(`   ${icon} ${index + 1}. ${result.label}: ${status}${time}${code}`);
        });
        
        console.log('='.repeat(60));
        
        // Exit strategy
        const hasCriticalFailure = this.results.some(r => 
            !r.skipped && !r.success && r.label === 'Security Scan'
        );
        
        if (hasCriticalFailure) {
            console.log('🚨 CRITICAL: Security scan failed. Build stopped.');
            return { success: false, exitCode: 1 };
        } else if (failed > 0) {
            console.log('⚠️  WARNING: Some optimizations failed, but build can continue.');
            return { success: true, exitCode: 0 };
        } else {
            console.log('🎉 SUCCESS: All optimizations completed successfully!');
            return { success: true, exitCode: 0 };
        }
    }
}

// Main execution
async function main() {
    const optimizer = new AssetOptimizer();
    const report = await optimizer.runAll();
    process.exit(report.exitCode);
}

// Handle top-level await
try {
    await main();
} catch (error) {
    console.error('\n' + '='.repeat(60));
    console.error('💥 FATAL ERROR');
    console.error('='.repeat(60));
    console.error(`Message: ${error.message}`);
    console.error(`Stack: ${error.stack}`);
    console.error('='.repeat(60));
    process.exit(1);
}

export { AssetOptimizer, main };