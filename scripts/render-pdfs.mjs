// scripts/render-pdfs.mjs
#!/usr/bin/env node
import { chromium } from "playwright";
import path from "path";
import { spawn } from "child_process";
import { fileURLToPath } from "url";
import { setTimeout as delay } from "timers/promises";

const ROOT = process.cwd();

function argval(flag, def) {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i+1] : def;
}

const BASE = argval("--base", "http://localhost:5555");
const OUT  = argval("--out", path.join(ROOT, "public", "downloads"));
const PROBE = path.join(ROOT, "scripts", "probe-print-routes.mjs");

async function getRoutes() {
  return new Promise((resolve, reject) => {
    const isWin = process.platform === "win32";
    const ps = spawn("node", [PROBE, "--json"], { shell: isWin });
    let out = "", err = "";
    ps.stdout.on("data", d => out += d.toString());
    ps.stderr.on("data", d => err += d.toString());
    ps.on("exit", code => {
      if (code === 0) {
        try { resolve(JSON.parse(out || "[]")); }
        catch(e){ reject(e); }
      } else reject(new Error(err || `probe exit ${code}`));
    });
  });
}

// map route -> pretty PDF name
function pdfNameFromRoute(route) {
  // /print/leadership-playbook -> Leadership_Playbook.pdf
  const leaf = route.split("/").filter(Boolean).slice(1).join("-"); // remove "print"
  const title = leaf.replace(/[-_]+/g," ").replace(/\b\w/g,m=>m.toUpperCase()).replace(/\s+/g,"_");
  return `${title}.pdf`;
}

async function urlOk(page, url) {
  try {
    const res = await page.goto(url, { waitUntil: "networkidle", timeout: 20000 });
    const status = res?.status() ?? 0;
    return status >= 200 && status < 400;
  } catch {
    return false;
  }
}

async function main() {
  console.log(`Base: ${BASE}`);
  console.log(`Out : ${OUT}`);

  const routes = await getRoutes();
  console.log(`Routes: ${routes.join(", ") || "(none found)"}`);

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });

  for (const route of routes) {
    const url = `${BASE}${route}`;
    const pdfName = pdfNameFromRoute(route);
    const outPath = path.join(OUT, pdfName);

    const ok = await urlOk(page, url);
    if (!ok) {
      console.log(`  ! Skipping (no 2xx/3xx) ${url}`);
      continue;
    }

    try {
      await page.emulateMedia({ media: "print" });
      await page.pdf({
        path: outPath,
        printBackground: true,
        scale: 1,
        format: "A4",
        margin: { top: "10mm", right: "10mm", bottom: "10mm", left: "10mm" }
      });
      console.log(`  ✔ Saved ${path.relative(ROOT, outPath)}`);
    } catch (e) {
      console.log(`  ✖ Failed ${url}\n${e.message}`);
    }
    // tiny pause so CI logs are readable
    await delay(100);
  }

  await browser.close();
  console.log("\nAll done.");
}

main().catch(e => { console.error(e); process.exit(1); });
