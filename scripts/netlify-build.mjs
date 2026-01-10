import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runCommand(cmd, args, desc) {
  console.log(`▶️  ${desc}...`);
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, { stdio: 'inherit', shell: true });
    proc.on('close', code => code === 0 ? resolve() : reject(new Error(`Failed: ${desc}`)));
  });
}

try {
  await runCommand('pnpm', ['install', '--frozen-lockfile'], 'Install dependencies');
  await runCommand('pnpm', ['run', 'content:full'], 'Build content');
  await runCommand('pnpm', ['run', 'build'], 'Build Next.js');
  console.log('✅ Netlify build complete');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}