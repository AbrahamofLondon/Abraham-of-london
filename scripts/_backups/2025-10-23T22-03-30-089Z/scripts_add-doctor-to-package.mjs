// File: scripts/add-doctor-to-package.mjs
#!/usr/bin/env node
/**
 * Safely adds "doctor" script and prepends it to "prebuild".
 * - Idempotent: re-runs won’t duplicate entries.
 */
import fs from "fs";

const file = 'package.json';
const pkg = JSON.parse(fs.readFileSync(file, 'utf8'));

pkg.scripts ||= {};
pkg.scripts.doctor ||= 'node scripts/doctor.mjs';

// Ensure prebuild runs doctor first, then existing prebuild chain
const currentPrebuild = pkg.scripts.prebuild || '';
const pieces = currentPrebuild.split('&&').map(s => s.trim()).filter(Boolean);
if (!pieces.includes('node scripts/doctor.mjs')) {
  pieces.unshift('node scripts/doctor.mjs');
}
pkg.scripts.prebuild = pieces.join(' && ') || 'node scripts/doctor.mjs';

fs.writeFileSync(file, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
console.log('✓ package.json scripts updated: added "doctor" and ensured it runs in prebuild.');
