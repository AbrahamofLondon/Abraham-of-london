import fs from "fs";
import path from "path";

type Alias = { from: string; to: string };

function ensureDir(p: string) {
  fs.mkdirSync(p, { recursive: true });
}

function copyFileSafe(src: string, dest: string) {
  if (!fs.existsSync(src)) {
    throw new Error(`Alias source missing: ${src}`);
  }
  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
}

function pPublic(rel: string) {
  return path.join(process.cwd(), "public", rel.replace(/^\/+/, ""));
}

/**
 * Canonical assets live here:
 * public/assets/downloads/*.pdf  (URL: /assets/downloads/*.pdf)
 *
 * Legacy links might point here:
 * public/downloads/*.pdf         (URL: /downloads/*.pdf)
 *
 * We copy canonical -> legacy AND also alias within canonical if needed.
 */
const ALIASES: Alias[] = [
  // --- canonical folder aliases ---
  {
    from: "/assets/downloads/life-alignment-assessment.pdf",
    to: "/assets/downloads/life-alignment-worksheet.pdf",
  },
  {
    from: "/assets/downloads/life-alignment-assessment.pdf",
    to: "/assets/downloads/surrender-framework.pdf",
  },
  {
    from: "/assets/downloads/life-alignment-assessment.pdf",
    to: "/assets/downloads/surrender-principles.pdf",
  },

  // --- legacy /downloads/ aliases (if you still reference /downloads/* anywhere) ---
  {
    from: "/assets/downloads/life-alignment-assessment.pdf",
    to: "/downloads/life-alignment-worksheet.pdf",
  },
  {
    from: "/assets/downloads/life-alignment-assessment.pdf",
    to: "/downloads/surrender-framework.pdf",
  },
  {
    from: "/assets/downloads/life-alignment-assessment.pdf",
    to: "/downloads/surrender-principles.pdf",
  },
];

function main() {
  let ok = 0;

  for (const a of ALIASES) {
    const src = pPublic(a.from);
    const dest = pPublic(a.to);

    // Idempotent copy: overwrite to ensure fresh build artifacts
    copyFileSafe(src, dest);
    ok++;
    console.log(`✅ alias: ${a.to} <- ${a.from}`);
  }

  console.log(`\nDone. Aliases created: ${ok}`);
}

main();