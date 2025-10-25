#!/usr/bin/env node
import fsp from "fs/promises"; // Use promise-based fs
import { constants } from "fs"; // Used for F_OK check
import path from "path";
import http from "http";
import getPort from "get-port";
import { spawn } from "child_process";
import glob from "fast-glob";
import puppeteer from "puppeteer";

const ROOT = process.cwd();
const OUT = path.join(ROOT, "public", "downloads");
const REPORT = path.join(
  ROOT,
  "public",
  "downloads",
  "_ensure-pdfs-report.json",
);

// map content types -> generic print route prefix
const PRINT_ROUTES = {
  Post: "/print/post/",
  Book: "/print/book/",
  Event: "/print/event/",
  Strategy: "/print/strategy/", // ✅ NEW
  Resource: "/print/resource/", // ✅ NEW
};

// extra bespoke pages you already have
const PAGE_ALIASES = {
  // slug -> absolute route
  "family-altar-liturgy": "/print/family-altar-liturgy",
  "standards-brief": "/print/standards-brief",
  "principles-for-my-son": "/print/principles-for-my-son",
  "fathering-without-fear-teaser": "/print/fathering-without-fear-teaser",
  "fathering-without-fear-teaser-mobile":
    "/print/fathering-without-fear-teaser-mobile",
  "scripture-track-john14": "/print/scripture-track-john14",
  "mentorship-starter-kit": "/print/mentorship-starter-kit",
  "leadership-playbook": "/print/leadership-playbook",
  "leaders-cue-card-two-up": "/print/a6/leaders-cue-card-two-up",
  "brotherhood-cue-card-two-up": "/print/a6/brotherhood-cue-card-two-up",
};

// normalizer: Title_Case_With_Underscores.pdf
function toTitleCaseUnderscore(title) {
  return title
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (m) => m.toUpperCase())
    .replace(/[^\w\s]/g, "")
    .replace(/\s/g, "_");
}

// Async file existence check
async function exists(file) {
  try {
    await fsp.access(file, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function startNext(port) {
  const child = spawn(
    process.platform === "win32" ? "npx.cmd" : "npx",
    ["next", "start", "-p", String(port)],
    {
      stdio: "inherit",
      env: process.env,
    },
  );

  // wait until server responds
  await new Promise((res, rej) => {
    const t = setTimeout(() => {
      child.kill("SIGTERM"); // Kill the child process on timeout
      rej(new Error("server start timeout"));
    }, 20000);

    (function ping() {
      http
        .get({ host: "localhost", port, path: "/" }, (response) => {
          clearTimeout(t);
          res(null);
          response.resume(); // Consume the response data
        })
        .on("error", () => setTimeout(ping, 300));
    })();
  });
  return child;
}

async function renderPDF(base, route, outFile) {
  const url = new URL(route, base).toString();
  // Using 'new' for headless option is recommended for modern puppeteer
  const browser = await puppeteer.launch({
    args: ["--no-sandbox"],
    headless: "new",
  });
  try {
    const page = await browser.newPage();
    // Allow more time for complex print layouts
    await page.goto(url, { waitUntil: "networkidle0", timeout: 90000 });
    await page.pdf({
      path: outFile,
      format: "A4",
      printBackground: true,
      margin: { top: "10mm", right: "10mm", bottom: "12mm", left: "10mm" },
    });
  } finally {
    await browser.close();
  }
}

// Async file size retrieval
async function sizeKB(file) {
  const s = (await fsp.stat(file)).size;
  return Math.round(s / 1024);
}

async function main() {
  const port = await getPort({ port: 5555 });
  const base = `http://localhost:${port}`;
  const report = { created: [], upgraded: [], skipped: [], errors: [] };

  if (!(await exists(OUT))) await fsp.mkdir(OUT, { recursive: true }); // Async mkdir

  // Collect all contentlayer documents once (FIXED: simplified data collection)
  const docs = [];
  const contentlayerFiles = await glob([`.contentlayer/**/*.json`], {
    cwd: ROOT,
    absolute: true,
  });

  for (const f of contentlayerFiles) {
    try {
      const raw = await fsp.readFile(f, "utf8");
      const doc = JSON.parse(raw);
      // Only include documents from relevant types
      if (
        PRINT_ROUTES[doc.type] ||
        doc.type === "Download" ||
        doc.type === "Resource" ||
        doc.type === "Strategy"
      ) {
        docs.push(doc);
      }
    } catch (e) {
      console.error(
        `Error reading or parsing contentlayer file ${f}: ${e.message}`,
      );
    }
  }

  const server = await startNext(port);

  try {
    for (const doc of docs) {
      const title = doc.title || doc.slug;
      const nice = toTitleCaseUnderscore(title);
      // default filename (Title_Case_With_Underscores.pdf)
      const outFile = path.join(OUT, `${nice}.pdf`);

      // Skip if file exists and size is reasonable (avoid regenerating large, complex PDFs)
      if (await exists(outFile)) {
        // Use async exists
        try {
          const kb = await sizeKB(outFile); // Use async sizeKB
          if (kb > 40) {
            report.skipped.push({
              slug: doc.slug,
              reason: "ok-size",
              file: path.basename(outFile),
              sizeKB: kb,
            });
            continue;
          }
        } catch (e) {
          // If stat fails, continue to regenerate
          console.warn(
            `Warning: Could not stat file ${outFile}. Regenerating.`,
          );
        }
      }

      // pick print route
      let route = null;
      if (PAGE_ALIASES[doc.slug]) {
        route = PAGE_ALIASES[doc.slug];
      } else if (PRINT_ROUTES[doc.type]) {
        route = PRINT_ROUTES[doc.type] + doc.slug;
      } else if (doc.type === "Download" && doc.pdfPath) {
        // already a dedicated print path exists for downloads sometimes – normalize by removing .pdf
        const bare = doc.pdfPath.replace(/^\/+/, "").replace(/\.pdf$/i, "");
        route = "/" + bare;
      }

      if (!route) {
        report.errors.push({ slug: doc.slug, reason: "no-print-route" });
        continue;
      }

      try {
        await renderPDF(base, route, outFile);
        const kb = await sizeKB(outFile); // Use async sizeKB
        if (kb < 40) throw new Error(`suspiciously small: ${kb}KB`);

        const action = (await exists(outFile)) ? "upgraded" : "created";
        report[action].push({
          slug: doc.slug,
          route,
          file: path.basename(outFile),
          sizeKB: kb,
        });
      } catch (e) {
        report.errors.push({
          slug: doc.slug,
          route,
          error: String(e?.message || e),
        });
      }
    }
  } finally {
    await fsp.writeFile(REPORT, JSON.stringify(report, null, 2)); // Async writeFile
    server.kill("SIGTERM");
  }

  // surface hard errors
  if (report.errors.length) {
    console.error(
      `\nPDF ensure completed with ${report.errors.length} errors. See: ${REPORT}`,
    );
    process.exitCode = 1;
  } else {
    console.log(`\nPDF ensure completed. Report: ${REPORT}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
