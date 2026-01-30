// scripts/generate-pdfs-cli.tsx - ES MODULE VERSION
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runPDFGeneration(quality: string = 'premium', verbose: boolean = false): Promise<boolean> {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📄 PREMIUM PDF GENERATION (${quality.toUpperCase()})`);
  console.log('='.repeat(60));
  
  const startTime = Date.now();
  const scripts = [
    { name: 'Legacy Canvas (A4)', file: 'generate-legacy-canvas.ts', args: ['A4', quality] },
    { name: 'Legacy Canvas (Letter)', file: 'generate-legacy-canvas.ts', args: ['Letter', quality] },
    { name: 'Legacy Canvas (A3)', file: 'generate-legacy-canvas.ts', args: ['A3', quality] }
  ];
  
  let successCount = 0;
  let failCount = 0;
  
  for (const script of scripts) {
    const scriptPath = path.join(__dirname, script.file);
    const scriptStartTime = Date.now();
    
    console.log(`\n▶️  ${script.name}...`);
    
    try {
      await runCommand('npx', ['tsx', scriptPath, ...script.args], verbose);
      const duration = Date.now() - scriptStartTime;
      console.log(`✅ Completed (${duration}ms)`);
      successCount++;
    } catch (error: any) {
      const duration = Date.now() - scriptStartTime;
      console.log(`❌ Failed (${duration}ms): ${error.message}`);
      failCount++;
    }
  }
  
  // Summary
  const totalDuration = Date.now() - startTime;
  console.log(`\n${'='.repeat(60)}`);
  console.log('📊 GENERATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`⚡ Total Time: ${totalDuration}ms`);
  console.log('='.repeat(60));
  
  return failCount === 0;
}

function runCommand(command: string, args: string[], verbose: boolean): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: verbose ? 'inherit' : 'pipe',
      shell: true,
      env: { ...process.env, PDF_QUALITY: 'premium', FORCE_COLOR: '1' }
    });
    
    let output = '';
    if (child.stdout) {
      child.stdout.on('data', (data) => {
        output += data.toString();
        if (verbose) process.stdout.write(data);
      });
    }
    
    if (child.stderr) {
      child.stderr.on('data', (data) => {
        output += data.toString();
        if (verbose) process.stderr.write(data);
      });
    }
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with code ${code}\n${output}`));
      }
    });
    
    child.on('error', reject);
  });
}

// CLI Argument Parsing
async function main() {
  const args = process.argv.slice(2);
  
  let quality = 'premium';
  let verbose = false;
  let help = false;
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--quality' && args[i + 1]) {
      quality = args[i + 1];
      i++;
    } else if (arg === '--verbose' || arg === '-v') {
      verbose = true;
    } else if (arg === '--help' || arg === '-h') {
      help = true;
    }
  }
  
  if (help) {
    console.log(`
✨ PREMIUM PDF GENERATION

Usage: npx tsx scripts/generate-pdfs-cli.tsx [options]

Options:
  --quality <level>    Set quality: draft, standard, premium, enterprise
  --verbose, -v        Show detailed output
  --help, -h           Show this help

Examples:
  npx tsx scripts/generate-pdfs-cli.tsx
  npx tsx scripts/generate-pdfs-cli.tsx --quality=enterprise --verbose
    `);
    process.exit(0);
  }
  
  try {
    const success = await runPDFGeneration(quality, verbose);
    process.exit(success ? 0 : 1);
  } catch (error: any) {
    console.error('Fatal error:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${__filename}`) {
  main().catch(console.error);
}

// Optional: Export for testing
export { runPDFGeneration };