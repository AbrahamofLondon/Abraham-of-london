// scripts/scaffold-download-sources.mjs
// Auto-discovers suspicious PDFs and scaffolds MD sources so make-pdfs can render premium, branded versions.
// Usage: node scripts/scaffold-download-sources.mjs [--force]

import fs from "node:fs/promises";
import fss from "fs";
import path from "path";
import crypto from "crypto";

const ROOT = new URL("..", import.meta.url).pathname;
const PUB = path.join(ROOT, "public", "downloads");
const OUT = path.join(ROOT, "content", "downloads");

const FORCE = process.argv.includes("--force");
const SMALL_BYTES = 10 * 1024;

const titleCase = (s) =>
  s.replace(/[-_]+/g, " ")
    .replace(/\b[a-z]/g, (m) => m.toUpperCase())
    .replace(/\bA4\b/gi, "A4")
    .replace(/\bA6\b/gi, "A6");

const toSlug = (file) =>
  file
    .replace(/\.pdf$/i, "")
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

const kebab = (file) =>
  file
    .replace(/\.pdf$/i, "")
    .replace(/[_\s]+/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase() + ".pdf";

const TEMPLATE = (title, file, excerpt) => `---
title: ${title}
author: Abraham of London
date: ${new Date().toISOString().slice(0,10)}
excerpt: ${excerpt}
pdfFileName: ${file}
coverImage: /assets/images/downloads/${file.replace(/\.pdf$/i,"")}.jpg
---

# ${title}

_Replace this scaffold with final copy. This source allows automated, branded PDF rendering via Puppeteer._
`;

const BAD_STYLE = (name) =>
  !/^([a-z0-9]+(?:-[a-z0-9]+)*)\.pdf$/.test(name) && // kebab-case
  !/^([A-Z][A-Za-z0-9]+)(?:_[A-Z][A-Za-z0-9]+)*\.pdf$/.test(name); // Title_Case_With_Underscores.pdf

async function main() {
  if (!fss.existsSync(PUB)) {
    console.log("No /public/downloads to scan.");
    return;
  }
  await fs.mkdir(OUT, { recursive: true });

  const files = (await fs.readdir(PUB)).filter((f) => /\.pdf$/i.test(f));
  const picks = [];
  for (const f of files) {
    const p = path.join(PUB, f);
    const stat = await fs.stat(p).catch(() => null);
    if (!stat) continue;
    const isSmall = stat.size < SMALL_BYTES;
    const styleBad = BAD_STYLE(f);
    if (isSmall || styleBad) picks.push({ name: f, size: stat.size, isSmall, styleBad });
  }

  if (picks.length === 0) {
    console.log("✅ No suspicious PDFs. Nothing to scaffold.");
    return;
  }

  for (const it of picks) {
    const slug = toSlug(it.name);
    const mdPath = path.join(OUT, `${slug}.md`);
    const prettyTitle = titleCase(slug);
    const suggested = kebab(it.name);
    const excerpt = `${prettyTitle} - a concise, practical resource.`;

    if (!FORCE && fss.existsSync(mdPath)) {
      console.log("• exists, skipping:", path.relative(ROOT, mdPath));
      continue;
    }

    await fs.writeFile(mdPath, TEMPLATE(prettyTitle, suggested, excerpt), "utf8");
    console.log("✍️  scaffolded:", path.relative(ROOT, mdPath));
  }

  // Optional: emit a manifest hash to track changes
  const manifest = JSON.stringify(picks, null, 2);
  const hash = crypto.createHash("sha1").update(manifest).digest("hex").slice(0, 8);
  await fs.writeFile(path.join(OUT, `.scaffold-manifest-${hash}.json`), manifest, "utf8");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
// Creates first-pass branded HTML sources for missing downloads.
// Re-run safely; existing files won't be overwritten.
import fs from "node:fs/promises";
import path from "path";

const ROOT = process.cwd();
const SRC_DIR = path.join(ROOT, "scripts", "pdfs", "static");
const OUT_DIR = path.join(ROOT, "public", "downloads");

// Map of pdf filename → { title, blurb }
const DOCS = {
  "Brotherhood_Leader_Guide_4_Weeks.pdf": {
    title: "Brotherhood Leader Guide - 4 Weeks",
    blurb:
      "A short cycle to set standards, build trust, and reduce drama. Designed for small brotherhood cohorts.",
  },
  "downloadsBoard_Update_OnePager.pdf": {
    title: "Board Update - One Pager",
    blurb:
      "A crisp template for high-signal board communication-clear decisions, risks, and next actions.",
  },
  "Fathering_Without_Fear_Teaser-Mobile.pdf": {
    title: "Fathering Without Fear - Mobile Teaser",
    blurb:
      "A mobile-formatted teaser-fatherhood reclaimed through clarity, conviction, and standards that endure.",
  },
  "Fathers_in_Family_Court_Practical_Pack.pdf": {
    title: "Fathers in Family Court - Practical Pack",
    blurb:
      "Straightforward guidance and scripts to help fathers navigate process, paperwork, and hearings.",
  },
  "The_Fiction_Adaptation_OnePager.pdf": {
    title: "The Fiction Adaptation - One Pager",
    blurb:
      "A cinematic précis: conviction dramatized. Vision, themes, and adaptation direction.",
  },
  "Family_Altar_Liturgy.pdf": {
    title: "Family Altar - Liturgy",
    blurb:
      "A simple household liturgy to re-center the week around Scripture, prayer, and gratitude.",
  },
  "Scripture_Track_John14.pdf": {
    title: "Scripture Track - John 14",
    blurb:
      "A focused Scripture track through John 14-readings, reflection prompts, and prayer notes.",
  },
  "Household_Rhythm_Starter.pdf": {
    title: "Household Rhythm - Starter",
    blurb:
      "A 30·60·90 rhythm to stabilize your household-weekly cadence, reviews, and decision hygiene.",
  },
  "Principles_for_My_Son.pdf": {
    title: "Principles for My Son",
    blurb:
      "A letter of standards-clarity, courage, craftsmanship, and stewardship for the long arc.",
  },
  "Principles_for_My_Son_Cue_Card.pdf": {
    title: "Principles for My Son - Cue Card",
    blurb:
      "A compact card of non-negotiables-calm prompts for high-pressure decisions.",
  },
  "brotherhood-covenant.pdf": {
    title: "Brotherhood Covenant",
    blurb:
      "A mutual covenant for brothers: honesty, accountability, and mission over noise.",
  },
  "brotherhood-cue-card.pdf": {
    title: "Brotherhood Cue Card",
    blurb:
      "A pocket guide for leaders: what to say when it matters-clear, brief, kind.",
  },
  "fathering-without-fear.pdf": {
    title: "Fathering Without Fear",
    blurb:
      "A bold memoir reclaiming fatherhood with standards that endure beyond our lifetime.",
  },
  "fathering-without-fear-mobile.pdf": {
    title: "Fathering Without Fear - Mobile Teaser",
    blurb:
      "Mobile-formatted sampler-fatherhood, courage, and the work of building a home.",
  },
  "standards-brief.pdf": {
    title: "Standards Brief",
    blurb:
      "A one-page brief on standards-how to set them, keep them, and teach them without theatrics.",
  },
  "Fatherhood_Guide.pdf": {
    title: "Fatherhood Guide",
    blurb:
      "Practical notes, scripts, and weekly rhythms for steadier fatherhood.",
  },
  "Fathering_Without_Fear_Teaser_A4.pdf": {
    title: "Fathering Without Fear - A4 Teaser",
    blurb:
      "A4 formatted teaser-clarity, discipline, and the calm resolve of fathers.",
  },
  "Fathering_Without_Fear_Teaser-A4.pdf": {
    title: "Fathering Without Fear - A4 Teaser (alt)",
    blurb:
      "Alias copy of the A4 teaser to satisfy legacy links. Content identical.",
  },
  "Fathering_Without_Fear_Teaser_Mobile.pdf": {
    title: "Fathering Without Fear - Mobile Teaser (alt)",
    blurb:
      "Alias copy of the mobile teaser to satisfy legacy links. Content identical.",
  },
  "leaders-cue-card.pdf": {
    title: "Leader's Cue Card",
    blurb:
      "A6 cue card for leaders-calm prompts and checklists for pressure moments.",
  },
  "Leaders_Cue_Card.pdf": {
    title: "Leader's Cue Card (Title Case)",
    blurb:
      "Alias PDF in Title_Case to satisfy legacy/bookmark variants.",
  }
};

const TEMPLATE = (title, blurb) => `<!doctype html>
<html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${title}</title>
<style>
:root{--brand:#1B4332;--ink:#111827;--muted:#6B7280;--gold:#D4AF37}
*{box-sizing:border-box} body{margin:0;color:var(--ink);font:14px/1.6 system-ui,-apple-system,Segoe UI,Roboto,Inter,ui-sans-serif}
.header{padding:18mm 16mm 0} .brand{letter-spacing:.08em;text-transform:uppercase;font-weight:700;color:var(--brand)}
.title{font:700 28px/1.2 Georgia,serif;margin:.25rem 0} .meta{color:var(--muted);font-size:12px}
.page{padding:0 16mm 16mm} .footer{position:fixed;bottom:10px;right:16mm;font-size:10px;color:#9CA3AF}
hr{border:0;border-top:1px solid #e5e7eb;margin:16px 0}
</style></head>
<body>
  <div class="header">
    <div class="brand">Abraham of London</div>
    <div class="title">${title}</div>
    <div class="meta">${blurb}</div>
    <hr/>
  </div>
  <div class="page">
    <p>${blurb}</p>
    <p style="color:#6B7280">Draft auto-generated. Replace this HTML with final copy when ready.</p>
  </div>
  <div class="footer">A/L - ${title}</div>
</body></html>`;

async function ensureDir(dir) { await fs.mkdir(dir, { recursive: true }); }

async function main() {
  await ensureDir(SRC_DIR);
  await ensureDir(OUT_DIR);

  for (const [pdfName, meta] of Object.entries(DOCS)) {
    // create an HTML twin to render
    const base = pdfName.replace(/\.pdf$/i, "");
    const htmlPath = path.join(SRC_DIR, `${base}.html`);
    try {
      await fs.stat(htmlPath);
      // exists - skip
    } catch {
      await fs.writeFile(htmlPath, TEMPLATE(meta.title, meta.blurb), "utf8");
      console.log("✍️  Scaffolded", path.relative(process.cwd(), htmlPath));
    }
  }

  console.log("\nNext: run `npm run pdfs` to render → public/downloads/*.pdf");
}

main().catch((e) => { console.error(e); process.exit(1); });
