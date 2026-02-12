#!/usr/bin/env node
/**
 * ABRAHAM OF LONDON — PDF ORCHESTRATOR CLI [v2.2.0]
 * Institutional Integrity Verified
 */

import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { spawn } from 'child_process';
import { existsSync, writeFileSync, readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = resolve(__dirname, '..');
const MANIFEST_PATH = resolve(ROOT_DIR, '.vault-manifest.json');

const CONFIG = {
    scriptPath: resolve(__dirname, 'pdf', 'generate-interactive-pdf.ts'),
    tsxExecutable: process.platform === 'win32' 
        ? resolve(ROOT_DIR, 'node_modules', '.bin', 'tsx.cmd') 
        : resolve(ROOT_DIR, 'node_modules', '.bin', 'tsx'),
};

/**
 * Updates the Vault Manifest to trigger frontend awareness
 */
function updateManifest(status, args) {
    const log = {
        last_run: new Date().toISOString(),
        status: status === 0 ? 'SUCCESS' : 'FAILURE',
        scope: args.length > 0 ? args.join(' ') : 'full_sweep',
        integrity_check: true
    };
    
    try {
        writeFileSync(MANIFEST_PATH, JSON.stringify(log, null, 2));
    } catch (e) {
        console.error(`⚠️  Manifest Update Failed: ${e.message}`);
    }
}

async function run() {
    if (!existsSync(CONFIG.scriptPath)) {
        console.error('❌ Generator Logic Missing.');
        process.exit(1);
    }

    const args = process.argv.slice(2);

    console.log('\n' + '─'.repeat(60));
    console.log(`🏛️  ABRAHAM OF LONDON | ORCHESTRATOR`);
    console.log(`📡 STATUS: Active Alignment`);
    console.log('─'.repeat(60) + '\n');

    const child = spawn(CONFIG.tsxExecutable, [CONFIG.scriptPath, ...args], {
        stdio: 'inherit',
        shell: true,
        cwd: ROOT_DIR,
        env: { ...process.env, FORCE_COLOR: '1' }
    });

    child.on('close', (code) => {
        updateManifest(code, args);
        
        console.log('\n' + '─'.repeat(60));
        if (code === 0) {
            console.log(`✅ VAULT SYNCHRONIZED | Manifest Updated`);
        } else {
            console.log(`⚠️  ALIGNMENT INTERRUPTED | Check Logs`);
        }
        console.log('─'.repeat(60) + '\n');
        process.exit(code || 0);
    });
}

run().catch(err => {
    console.error(`💥 Fatal Crash:`, err);
    process.exit(1);
});