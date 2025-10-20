// scripts/print-pdfs.mjs
import { spawn } from 'node:child_process';
import http from 'node:http';
import { fileURLToPath } from 'node:url';

const isWin = process.platform === 'win32';
const npmCmd = isWin ? 'npm.cmd' : 'npm';
const renderScript = fileURLToPath(new URL('render-pdfs.mjs', import.meta.url));

/**
 * Waits for the HTTP server to respond.
 * @param {string} url - The URL to check.
 * @param {number} [timeoutMs=20000] - Timeout in milliseconds.
 * @returns {Promise<void>}
 */
function waitForServer(url, timeoutMs = 20000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const tick = () => {
      const req = http.get(url, () => { req.destroy(); resolve(); });
      req.on('error', () => {
        if (Date.now() - start > timeoutMs) {
          req.destroy(); // Ensure request is destroyed before rejecting
          reject(new Error(`Server did not start in time: ${url}`));
        } else {
          setTimeout(tick, 500);
        }
      });
      // Handle response timeout as well
      req.setTimeout(5000, () => {
          req.destroy();
      });
    };
    tick();
  });
}

async function main() {
  let srv;
  try {
    // 1) Start print server (print:serve needs to be defined in package.json)
    console.log('Starting print server...');
    srv = spawn(npmCmd, ['run', 'print:serve'], { stdio: 'inherit', shell: false });

    // Ensure server process is terminated on script exit
    process.on('SIGINT', () => srv.kill('SIGTERM'));

    // 2) Wait for server to become available
    const serverUrl = 'http://localhost:5555/';
    console.log(`Waiting for server at ${serverUrl}...`);
    await waitForServer(serverUrl);

    // 3) Render PDFs using the separate script
    console.log('Server running. Starting PDF rendering...');
    const renderArgs = [renderScript, '--base', serverUrl.slice(0, -1), '--out', 'public/downloads'];
    const render = spawn(process.execPath, renderArgs, { stdio: 'inherit' });

    await new Promise((resolve, reject) => {
      render.on('exit', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`PDF renderer exited with code ${code}`));
        }
      });
    });

    console.log('PDF rendering complete.');

  } catch (err) {
    console.error(`\n--- Error in print-pdfs.mjs ---\n`, err.message);
    process.exit(1);
  } finally {
    // 4) Stop server
    if (srv) {
      console.log('Stopping print server...');
      srv.kill('SIGTERM');
      // Wait a moment for the server to actually exit
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
}

main();