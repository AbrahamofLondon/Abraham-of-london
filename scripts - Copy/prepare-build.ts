// scripts/prepare-build.js
import { execSync } from 'child_process';

console.log('🚀 Preparing build environment...');

// Set environment variables
process.env.CI = 'false';
process.env.HUSKY = '0';
process.env.NEXT_DISABLE_ESLINT = '1';
process.env.NEXT_DISABLE_TYPECHECK = '1';

console.log('✅ Environment variables set');
