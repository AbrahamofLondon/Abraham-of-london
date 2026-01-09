// pages/api/pdf-data.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { spawn } from "child_process";
import os from "os";
import path from "path";

type Data =
  | {
      ok: true;
      message: string;
      stdout: string;
      stderr: string;
      code: number;
    }
  | {
      ok: false;
      message: string;
      error: string;
      stdout?: string;
      stderr?: string;
    };

export const config = {
  api: {
    bodyParser: true,
  },
};

function runCommand(cmd: string, args: string[], cwd: string) {
  return new Promise<{ code: number; stdout: string; stderr: string }>((resolve, reject) => {
    const child = spawn(cmd, args, {
      cwd,
      shell: true,
      env: process.env,
    });

    let stdout = "";
    let stderr = "";

    child.stdout?.on("data", (d) => (stdout += d.toString()));
    child.stderr?.on("data", (d) => (stderr += d.toString()));

    child.on("error", (err) => reject(err));
    child.on("close", (code) => resolve({ code: code ?? 1, stdout, stderr }));
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, message: "Method not allowed", error: "Use POST" });
  }

  // Optional payload
  const formats = String(req.body?.formats ?? "a4").toLowerCase(); // all|a4|letter|a3
  const quality = String(req.body?.quality ?? process.env.PDF_QUALITY ?? "premium").toLowerCase();
  const tier = String(req.body?.tier ?? process.env.PDF_TIER ?? "premium").toLowerCase();

  // IMPORTANT: Force Node runtime behavior (avoid Edge)
  // If you have "runtime: edge" anywhere for this route, remove it.

  const cwd = process.cwd();

  // Prefer pnpm if present, else npx
  const isWin = os.platform() === "win32";
  const pnpmCmd = isWin ? "pnpm.cmd" : "pnpm";
  const npxCmd = isWin ? "npx.cmd" : "npx";

  // We run: pnpm tsx scripts/generate-pdfs.ts ...
  // (If pnpm isn't available on host, fall back to npx tsx ...)
  const scriptPath = path.join("scripts", "generate-pdfs.ts");

  try {
    let result;
    try {
      result = await runCommand(pnpmCmd, ["tsx", scriptPath, "--formats", formats, "--quality", quality, "--tier", tier], cwd);
    } catch {
      result = await runCommand(npxCmd, ["tsx", scriptPath, "--formats", formats, "--quality", quality, "--tier", tier], cwd);
    }

    if (result.code !== 0) {
      return res.status(500).json({
        ok: false,
        message: "PDF generation failed",
        error: `Exit code ${result.code}`,
        stdout: result.stdout,
        stderr: result.stderr,
      });
    }

    return res.status(200).json({
      ok: true,
      message: "PDF generation completed",
      code: result.code,
      stdout: result.stdout,
      stderr: result.stderr,
    });
  } catch (err: any) {
    return res.status(500).json({
      ok: false,
      message: "PDF generation crashed",
      error: err?.message || String(err),
    });
  }
}