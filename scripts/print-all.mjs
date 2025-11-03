// scripts/print-all.mjs
import { spawn } from "node:child_process";
import process from "node:process";

const PORT = Number(process.env.PRINT_PORT || 5555);
const BASE = `http://localhost:${PORT}`;

const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";

function waitForHealth(url, timeoutMs = 40_000) {
  const started = Date.now();
  return new Promise((resolve, reject) => {
    const tick = async () => {
      try {
        const res = await fetch(`${url}/api/health?ts=${Date.now()}`, { cache: "no-store" });
        if (res.ok) return resolve(true);
      } catch {}
      if (Date.now() - started > timeoutMs) return reject(new Error("Timeout waiting for Next server"));
      setTimeout(tick, 600);
    };
    tick();
  });
}

(async () => {
  console.log("— print-all —");
  console.log("Port:", PORT);

  const server = spawn(npmCmd, ["run", "print:serve"], { stdio: "inherit", env: { ...process.env, PORT: String(PORT) } });

  try {
    await waitForHealth(BASE);
    console.log("Next is ready. Rendering PDFs…");
    const renderer = spawn(
      "node",
      ["scripts/render-pdfs.mjs", "--base", BASE, "--out", "public/downloads"],
      { stdio: "inherit" }
    );
    await new Promise((res, rej) => renderer.on("close", (code) => (code === 0 ? res() : rej(new Error(`renderer exit ${code}`)))));
  } finally {
    console.log("Shutting down Next…");
    server.kill("SIGINT");
  }
