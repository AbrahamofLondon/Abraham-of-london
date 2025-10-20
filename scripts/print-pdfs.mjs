// scripts/print-pdfs.mjs
import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import http from "node:http";

const PORT = 4010; // avoid 3000 in case busy
const BASE = `http://localhost:${PORT}`;

const targets = [
  { route: "/print/family-altar-liturgy", out: "family-altar-liturgy.pdf", format: "A4", landscape: false },
  { route: "/print/fathering-without-fear-teaser", out: "fathering-without-fear-teaser-a4.pdf", format: "A4", landscape: false },
  { route: "/print/fathering-without-fear-teaser-mobile", out: "fathering-without-fear-teaser-mobile.pdf", format: "A4", landscape: false },

  { route: "/print/principles-for-my-son", out: "principles-for-my-son.pdf", format: "A4", landscape: false },
  { route: "/print/principles-for-my-son-cue-card", out: "principles-for-my-son-cue-card.pdf", format: "A4", landscape: false },
  { route: "/print/scripture-track-john14", out: "scripture-track-john14.pdf", format: "A4", landscape: false },
  { route: "/print/a6/brotherhood-cue-card-two-up", out: "brotherhood-cue-card-two-up.pdf", format: "A4", landscape: false },

  // New pages we add below:
  { route: "/print/fatherhood-guide", out: "fatherhood-guide.pdf", format: "A4", landscape: false },
  { route: "/print/household-rhythm-starter", out: "household-rhythm-starter.pdf", format: "A4", landscape: false },
];

function waitForServer(url, timeoutMs = 30000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    (function ping() {
      http.get(url, res => {
        res.resume();
        resolve();
      }).on("error", () => {
        if (Date.now() - start > timeoutMs) reject(new Error("Server not up"));
        else setTimeout(ping, 500);
      });
    })();
  });
}

async function main() {
  // Ensure playwright browser is present (your prepare script already does this)
  const downloadsDir = path.join(process.cwd(), "public", "downloads");
  if (!existsSync(downloadsDir)) await mkdir(downloadsDir, { recursive: true });

  // Start Next in prod mode (assumes you've run `next build`)
  const srv = spawn(process.platform === "win32" ? "npx.cmd" : "npx",
    ["next", "start", "-p", String(PORT)],
    { stdio: "inherit" }
  );

  try {
    await waitForServer(`${BASE}/`);
    const { chromium } = await import("playwright"); // uses devDependency
    const browser = await chromium.launch();
    const ctx = await browser.newContext({ deviceScaleFactor: 2 });

    for (const t of targets) {
      const url = `${BASE}${t.route}`;
      const page = await ctx.newPage();
      console.log(`→ printing ${url}`);
      await page.goto(url, { waitUntil: "networkidle" });
      await page.emulateMedia({ media: "print" });
      await page.pdf({
        path: path.join(downloadsDir, t.out),
        format: t.format,
        landscape: t.landscape,
        printBackground: true,
        margin: { top: "10mm", right: "10mm", bottom: "10mm", left: "10mm" },
      });
      await page.close();
    }

    await ctx.close();
    await browser.close();
    console.log("✅ PDFs written to /public/downloads");
  } catch (e) {
    console.error("PDF export failed:", e);
    // Write a marker so CI logs are obvious
    await writeFile(".pdf-export-error.txt", String(e));
    process.exitCode = 1;
  } finally {
    if (srv && !srv.killed) srv.kill();
  }
}

main();
