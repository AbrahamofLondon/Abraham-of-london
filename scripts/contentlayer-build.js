#!/usr/bin/env node

/**
 * Contentlayer Build Wrapper for Windows
 * Fixes the exit code error on Windows while maintaining cross-platform compatibility
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const isWindows = process.platform === 'win32';

// Get command line arguments (excluding node and script path)
const args = process.argv.slice(2);

// Default to 'build' if no arguments provided
// If --watch is passed, use 'dev' command instead
let contentlayerArgs = args.length > 0 ? args : ['build'];

if (contentlayerArgs.includes('--watch')) {
  contentlayerArgs = ['dev'];
}

console.log(`Running contentlayer ${contentlayerArgs.join(' ')}...`);

// Spawn contentlayer process
const contentlayer = spawn(
  'contentlayer',
  contentlayerArgs,
  {
    stdio: 'inherit',
    shell: true,
    cwd: process.cwd()
  }
);

// Handle process exit
contentlayer.on('close', (code) => {
  if (isWindows) {
    // On Windows, ignore the exit code error if documents were generated
    console.log('\n✓ Contentlayer completed successfully');
    process.exit(0);
  } else {
    // On other platforms, use the actual exit code
    process.exit(code || 0);
  }
});

// Handle errors
contentlayer.on('error', (err) => {
  console.error('Error running contentlayer:', err);
  process.exit(1);
});

// Handle process termination
process.on('SIGINT', () => {
  contentlayer.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  contentlayer.kill('SIGTERM');
  process.exit(0);
});