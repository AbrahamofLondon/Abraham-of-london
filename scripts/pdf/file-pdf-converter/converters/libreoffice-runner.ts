// scripts/pdf/file-pdf-converter/converters/libreoffice-runner.ts
import fs from "fs";
import path from "path";
import { spawn } from "child_process";
import { PDF_CONFIG } from "../config";

type SpawnResult = { code: number; stdout: string; stderr: string };

export function resolveSoffice(): string {
  const env = process.env.SOFFICE_PATH || process.env.LIBREOFFICE_PATH || "";
  const cfg = (PDF_CONFIG as any)?.externalTools?.libreoffice || "";
  return (env && env.trim()) ? env.trim() : (cfg && String(cfg).trim()) ? String(cfg).trim() : "soffice";
}

export async function spawnWithTimeout(cmd: string, args: string[], timeoutMs: number, cwd?: string): Promise<SpawnResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { cwd: cwd || process.cwd(), stdio: ["ignore", "pipe", "pipe"], shell: false });

    let stdout = "";
    let stderr = "";

    child.stdout?.on("data", (d) => (stdout += d.toString()));
    child.stderr?.on("data", (d) => (stderr += d.toString()));

    const timer = setTimeout(() => {
      try {
        if (process.platform === "win32") {
          spawn("taskkill", ["/PID", String(child.pid), "/T", "/F"], { stdio: "ignore", shell: true });
        } else {
          child.kill("SIGKILL");
        }
      } catch {}
      reject(new Error(`Timeout after ${timeoutMs}ms: ${cmd} ${args.join(" ")}`));
    }, timeoutMs);

    child.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });

    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({ code: typeof code === "number" ? code : 1, stdout, stderr });
    });
  });
}

export function findFirstPdf(dir: string): string | null {
  if (!fs.existsSync(dir)) return null;
  const pdfs = fs
    .readdirSync(dir)
    .filter((f) => f.toLowerCase().endsWith(".pdf"))
    .map((f) => path.join(dir, f));
  return pdfs.length ? pdfs[0] : null;
}