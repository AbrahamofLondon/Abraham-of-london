// scripts/generate-pdfs.ts
import path from "path";
import { spawn } from "child_process";

const ROOT = process.cwd();

function isWin() {
  return process.platform === "win32";
}

function tsxBin() {
  const local = path.join(ROOT, "node_modules", ".bin", isWin() ? "tsx.cmd" : "tsx");
  return local;
}

function run(cmd: string, args: string[]) {
  return new Promise<number>((resolve, reject) => {
    const child = spawn(cmd, args, {
      stdio: "inherit",
      shell: true,
      cwd: ROOT,
      env: { ...process.env, FORCE_COLOR: "1" },
    });
    child.on("close", (code) => resolve(code ?? 1));
    child.on("error", reject);
  });
}

async function main() {
  const args = process.argv.slice(2);

  // Pass-through args to canonical ops script.
  const opsScript = "scripts/pdf/pdf-ops.ts";

  const tsx = tsxBin();
  const code = await run(tsx, [opsScript, ...args]);

  process.exit(code);
}

const invokedAsScript = (() => {
  const argv1 = process.argv[1] ? path.resolve(process.argv[1]) : "";
  const here = path.resolve(path.join(ROOT, "scripts", "generate-pdfs.ts"));
  return argv1 === here || argv1.endsWith("generate-pdfs.ts");
})();

if (invokedAsScript) {
  main().catch((e) => {
    console.error("Fatal:", e?.message || String(e));
    process.exit(1);
  });
}

export default main;