#!/usr/bin/env node
import fsp from "fs/promises"; // Use promise-based fs
import { constants } from "fs"; // Used for F_OK check
import path from "path";
import glob from "fast-glob";

const ROOT = process.cwd();
const DL = path.join(ROOT, "public", "downloads");
const TOML = path.join(ROOT, "netlify.toml");

const DO_FIX =
  process.argv.includes("--fix") || process.argv.includes("--rename");

function toTitleCaseUnderscore(basename) {
  const noExt = basename.replace(/\.pdf$/i, "");
  const title = noExt.replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();
  const tc = title
    .replace(/\b\w/g, (m) => m.toUpperCase())
    .replace(/[^\w\s]/g, "")
    .replace(/\s/g, "_");
  return `${tc}.pdf`;
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

async function loadToml() {
  if (!(await exists(TOML))) return null; // Use async exists
  return fsp.readFile(TOML, "utf8"); // Use async readFile
}

async function writeToml(next) {
  await fsp.writeFile(TOML, next); // Use async writeFile
}

async function main() {
  if (!(await exists(DL))) {
    // Use async exists
    console.error("downloads dir missing");
    process.exit(1);
  }

  const files = await glob(["*.pdf"], { cwd: DL });
  const report = {
    renamed: [],
    small: [],
    ok: [],
    missing: [],
    redirectsAdded: 0,
  };

  let toml = await loadToml();
  let tomlNext = toml;

  for (const f of files) {
    const abs = path.join(DL, f);

    let kb;
    try {
      const stats = await fsp.stat(abs); // Use async stat
      kb = Math.round(stats.size / 1024);
    } catch (e) {
      // Should not happen as glob found the file, but good practice.
      console.warn(`Could not stat file ${f}. Skipping.`);
      continue;
    }

    const want = toTitleCaseUnderscore(f);

    if (kb < 40) report.small.push({ file: f, sizeKB: kb });

    if (f !== want) {
      report.renamed.push({ from: f, to: want });

      if (DO_FIX) {
        await fsp.rename(abs, path.join(DL, want)); // Use async rename

        // add/update redirect to preserve old link
        if (toml && !toml.includes(`/downloads/${f}`)) {
          const block = `
[[redirects]]
  from = "/downloads/${f}"
  to = "/downloads/${want}"
  status = 301
`;
          tomlNext += `\n${block}`;
          report.redirectsAdded++;
        }
      }
    } else {
      report.ok.push({ file: f, sizeKB: kb });
    }
  }

  if (DO_FIX && toml && tomlNext !== toml) {
    await writeToml(tomlNext); // Use async writeToml
  }

  console.log(JSON.stringify(report, null, 2));

  if (report.small.length) {
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
