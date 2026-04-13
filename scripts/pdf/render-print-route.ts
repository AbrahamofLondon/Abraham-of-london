// scripts/pdf/render-print-route.ts
import "../load-local-env";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import http from "http";
import { buildFingerprintProfile } from "../../lib/premium/fingerprint-profile";
import { createWatermarkPayload } from "../../lib/premium/watermark";
import { SecurePuppeteerPDFGenerator } from "./secure-puppeteer-generator";
import { requirePdfGenerationEnv } from "./require-pdf-env";

function argValue(key: string): string | undefined {
  const argv = process.argv.slice(2);
  const eq = argv.find((a) => a.startsWith(`${key}=`));
  if (eq) return eq.split("=").slice(1).join("=");
  const i = argv.indexOf(key);
  if (i >= 0 && argv[i + 1] && !argv[i + 1].startsWith("--")) return argv[i + 1];
  return undefined;
}

function abs(p: string) {
  return path.isAbsolute(p) ? p : path.join(process.cwd(), p);
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitFor200(url: string, timeoutMs = 60_000) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    const ok = await new Promise<boolean>((resolve) => {
      const req = http.get(url, (res) => {
        res.resume();
        resolve(res.statusCode === 200);
      });
      req.on("error", () => resolve(false));
      req.setTimeout(5000, () => {
        req.destroy();
        resolve(false);
      });
    });

    if (ok) return true;
    await sleep(600);
  }
  return false;
}

function killTree(child: any) {
  if (!child?.pid) return;
  try {
    if (process.platform === "win32") {
      spawn("taskkill", ["/PID", String(child.pid), "/T", "/F"], {
        stdio: "ignore",
        shell: true,
      });
    } else {
      child.kill("SIGTERM");
    }
  } catch {
    // no-op
  }
}

async function main() {
  requirePdfGenerationEnv("render-print-route");
  const slug = argValue("--slug") || argValue("-s");
  if (!slug) {
    throw new Error("Missing --slug. Example: --slug ultimate-purpose-of-man-editorial");
  }

  const out = abs(argValue("--out") || `public/assets/downloads/${slug}.pdf`);
  const tier = argValue("--tier") || "public";
  const port = Number(argValue("--port") || "4311");
  const mode = (argValue("--mode") || "start").toLowerCase();

  const url = `http://127.0.0.1:${port}/__pdf/${encodeURIComponent(slug)}?tier=${encodeURIComponent(tier)}`;

  const fingerprint = buildFingerprintProfile({
    contentId: slug,
    title: slug,
    filename: path.basename(out),
    mimeType: "application/pdf",
    tier,
    producer: "SecurePuppeteerPDFGenerator",
    creator: "AoL Print Route Renderer",
  });

  const watermark = createWatermarkPayload({
    contentId: slug,
    tier,
    briefTitle: slug,
    fingerprint,
  });

  console.log("\n============================================");
  console.log("🏛️  AoL PRINT ROUTE — PDF RENDER");
  console.log("============================================");
  console.log(`Slug: ${slug}`);
  console.log(`Tier: ${tier}`);
  console.log(`URL : ${url}`);
  console.log(`Out : ${out}`);
  console.log(`WM  : ${watermark.watermarkId}`);
  console.log(`FP  : ${fingerprint.profileId}`);
  console.log("============================================\n");

  fs.mkdirSync(path.dirname(out), { recursive: true });

  const cmd = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
  const nextArgs =
    mode === "dev"
      ? ["next", "dev", "-p", String(port)]
      : ["next", "start", "-p", String(port)];

  console.log(`▶ Starting Next: ${cmd} ${nextArgs.join(" ")}`);
  const server = spawn(cmd, nextArgs, {
    cwd: process.cwd(),
    stdio: "inherit",
    shell: true,
    env: { ...process.env, FORCE_COLOR: "1" },
  });

  try {
    console.log("⏳ Waiting for print route...");
    const ready = await waitFor200(url, 90_000);
    if (!ready) {
      throw new Error(`Next did not become ready at ${url} within timeout.`);
    }

    console.log("✅ Route ready. Printing...");

    const gen = new SecurePuppeteerPDFGenerator({
      timeout: 120_000,
      watchdogMs: 180_000,
      maxRetries: 2,
      headless: true,
    });

    const result = await gen.generateFromRoute({
      url,
      outputAbsPath: out,
      format: "A4",
      timeoutMs: 120_000,
      watchdogMs: 180_000,
      blockExternalRequests: true,
      allowFileUrls: false,
      documentTitle: `${slug} | ${watermark.footerText}`,
    } as any);

    await gen.close().catch(() => {});
    console.log(`\n✅ PDF written: ${result.filePath}`);
    console.log(`   Size: ${(result.size / 1024).toFixed(1)} KB`);
    console.log(`   SHA:  ${result.sha256.slice(0, 16)}…`);
    console.log(`   WM :  ${watermark.watermarkId}`);
    console.log(`   FP :  ${fingerprint.profileId}`);
  } finally {
    console.log("\n▶ Stopping Next...");
    killTree(server);
  }
}

main().catch((e) => {
  console.error(`\n❌ Print route render failed: ${e?.message || String(e)}\n`);
  process.exit(1);
});
