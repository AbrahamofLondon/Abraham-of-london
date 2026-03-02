"use server";

import path from "path";
import { spawn } from "child_process";

export async function runPdfOpsAction(args: string[] = []) {
  // HARD GATE (you must wire your auth): do not expose to public.
  // Example: if (!session?.user?.isAdmin) throw new Error("Forbidden");

  const ROOT = process.cwd();
  const tsx = process.platform === "win32"
    ? path.join(ROOT, "node_modules", ".bin", "tsx.cmd")
    : path.join(ROOT, "node_modules", ".bin", "tsx");

  const script = path.join(ROOT, "scripts", "pdf", "pdf-ops.ts");

  return new Promise<{ ok: boolean; code: number }>((resolve) => {
    const child = spawn(tsx, [script, ...args], {
      cwd: ROOT,
      env: { ...process.env, FORCE_COLOR: "1" },
      shell: true,
      stdio: "inherit",
    });

    child.on("close", (code) => {
      resolve({ ok: code === 0, code: code ?? 1 });
    });
  });
}