// scripts/print-pdfs.mjs
import { spawn } from "node:child_process";
import http from "http";

const isWin = process.platform === "win32";
const npmCmd = isWin ? "npm.cmd" : "npm";

function waitFor(url, timeoutMs = 20000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const tick = () => {
      const req = http.get(url, res => {
        if (res.statusCode && res.statusCode < 500) return resolve();
        if (Date.now() - start > timeoutMs) return reject(new Error("print server not ready"));
        setTimeout(tick, 500);
      });
      req.on("error", () => {
        if (Date.now() - start > timeoutMs) return reject(new Error("print server not ready"));
        setTimeout(tick, 500);
      });
    };
    tick();
  });
}

async function main() {
  console.log("Starting print server...");
  const ps = spawn(npmCmd, ["run", "print:serve"], {
    stdio: "inherit",
    shell: false
  });

  // ensure we kill the server when done
  const cleanup = () => { try { ps.kill(); } catch {}
  };
  process.on("exit", cleanup);
  process.on("SIGINT", () => { cleanup(); process.exit(1); });

  // wait for server to respond
  await waitFor("http://localhost:5555/");

  // now render PDFs
  const render = spawn(process.execPath, ["scripts/render-pdfs.mjs", "--base", "http://localhost:5555", "--out", "public/downloads"], {
    stdio: "inherit",
    shell: false
  });

  render.on("exit", (code) => {
    cleanup();
    if (code !== 0) process.exit(code);
  });
}
main().catch((e) => {
  console.error("\n--- Error in print-pdfs.mjs ---\n", e.message || e);
  process.exit(1);
});
