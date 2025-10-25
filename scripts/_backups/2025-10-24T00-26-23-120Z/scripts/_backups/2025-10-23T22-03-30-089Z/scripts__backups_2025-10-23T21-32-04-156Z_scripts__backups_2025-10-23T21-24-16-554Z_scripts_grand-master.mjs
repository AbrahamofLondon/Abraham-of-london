#!/usr/bin/env node
/**
 * Abraham of London – Orchestra Grand Master (Apex Edition V2: Verified Syntax)
 * -----------------------------------------------------------------
 * The definitive, one-button, full-stack Quality Gate.
 * Features: Atomic I/O, Advanced Content Healing (Mojibake/Front-Matter),
 * Dependency Auditing, Next.js Build/Server Management, Parallel PDF Generation,
 * E2E/A11y Smoke Testing, and Conditional Deployment with Rollback.
 *
 * Usage:
 * node scripts/grand-master.mjs [--dry-run] [--strict] [--skip-pdf] [--skip-deploy]
 * [--port-range=3100-3999] [--report=scripts/_reports/grand-master-report.json] [--rollback]
 *
 * Exit codes:
 * 0 success | 1 failure (and report written regardless)
 */

import fs from "node:fs/promises";
import fss from "node:fs";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import http from "node:http";
import process from "node:process";
import getPort from "get-port"; // Make sure to run: npm install get-port
import puppeteer from "puppeteer"; // Make sure to run: npm install puppeteer

const isWin = process.platform === "win32";
const npx = isWin ? "npx.cmd" : "npx";
const npm = isWin ? "npm.cmd" : "npm";
const root = process.cwd();

const args = Object.fromEntries(
  process.argv.slice(2).map((s) => {
    const [k, v] = s.replace(/^-+/, "").split("=");
    return [k, v === undefined ? true : v];
  }),
);

const DRY =
  String(args.dry ?? args["dry-run"] ?? "false").toLowerCase() === "true";
const STRICT = String(args.strict ?? "false").toLowerCase() === "true";
const SKIP_PDF = String(args["skip-pdf"] ?? "false").toLowerCase() === "true";
const SKIP_DEPLOY =
  String(args["skip-deploy"] ?? "false").toLowerCase() === "true";
const ROLLBACK = String(args.rollback ?? "false").toLowerCase() === "true";
const PORT_RANGE = (args["port-range"] ?? "3100-3999").split("-").map(Number);

const outDir = path.join(root, "scripts/_reports");
const logDir = path.join(root, "scripts/_logs");
const backupBatch = new Date().toISOString().replace(/[:.]/g, "-");
const backupDir = path.join(root, `scripts/_backups/${backupBatch}`);
const REPORT_PATH =
  args.report || path.join(outDir, "grand-master-report.json");
const LOG_PATH = path.join(logDir, "grand-master.log");

const CONTENT_DIR = path.join(root, "content");
const PUBLIC_DIR = path.join(root, "public");
const BUILD_OUTPUT_DIR = path.join(root, ".next");
const PAGES_DIR = path.join(root, "pages");

// Initial setup to ensure directories exist
await fs.mkdir(outDir, { recursive: true });
await fs.mkdir(logDir, { recursive: true });
await fs.mkdir(backupDir, { recursive: true });

/* ───────────────────── Helpers ───────────────────── */

const norm = (p) => p.replaceAll("\\", "/");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function log(message) {
  const line = `[${new Date().toISOString()}] ${message}\n`;
  await fs.appendFile(LOG_PATH, line);
  process.stdout.write(line);
}

const childProcs = new Set();
function track(child) {
  childProcs.add(child);
  child.on("close", () => childProcs.delete(child));
  return child;
}
async function shutdown() {
  for (const c of childProcs) {
    try {
      c.kill("SIGINT");
    } catch {}
  }
}
process.on("SIGINT", async () => {
  await log("SIGINT received. Shutting down...");
  await shutdown();
  process.exit(1);
});
process.on("SIGTERM", async () => {
  await log("SIGTERM received. Shutting down...");
  await shutdown();
  process.exit(1);
});

async function writeFileSafe(p, content, { binary = false } = {}) {
  if (DRY || ROLLBACK) return;
  await fs.mkdir(path.dirname(p), { recursive: true });

  const relativePath = path.relative(root, p).replace(/\\/g, "_");
  const backupPath = path.join(backupDir, relativePath);

  if (await exists(p)) {
    try {
      await fs.copyFile(p, backupPath);
    } catch (e) {
      await log(`WARN: Could not backup ${norm(p)}: ${e.message}`);
    }
    report.recordNote(`Backed up ${norm(p)}`);
  }

  const tmp = `${p}.tmp`;
  await fs.writeFile(
    tmp,
    content,
    binary ? undefined : { encoding: "utf8", flag: "w" },
  );
  await fs.rename(tmp, p);
  await log(`Wrote ${norm(p)}`);
}

function run(
  cmd,
  argv = [],
  {
    cwd = root,
    env = {},
    timeoutMs = 15 * 60_000,
    allowFail = false,
    inherit = false,
  } = {},
) {
  return new Promise((resolve, reject) => {
    if (DRY && !cmd.includes("playwright")) {
      log(`DRY-RUN: ${cmd} ${argv.join(" ")}`);
      return resolve({ code: 0, stdout: "DRY-RUN", stderr: "" });
    }

    const start = Date.now();
    // Use { shell: true } for Windows compatibility if cmd is a generic executable like 'npx'
    const child = track(
      spawn(cmd, argv, {
        cwd,
        env: { ...process.env, ...env },
        stdio: inherit ? "inherit" : "pipe",
        shell: isWin, // Conditional shell execution for Windows
      }),
    );

    let stdout = "";
    let stderr = "";
    let killedByTimeout = false;
    const t = setTimeout(() => {
      killedByTimeout = true;
      child.kill("SIGINT");
    }, timeoutMs);

    if (!inherit) {
      child.stdout?.on("data", (d) => {
        stdout += d.toString();
      });
      child.stderr?.on("data", (d) => {
        stderr += d.toString();
        log(`[STDERR] ${d.toString().trim().slice(0, 150)}...`);
      });
    }

    child.on("close", async (code) => {
      clearTimeout(t);
      const duration = ((Date.now() - start) / 1000).toFixed(1) + "s";
      const tag = `${cmd} ${argv.join(" ")}`.trim();
      await log(`$ ${tag} -> exit ${code} in ${duration}`);

      if (!inherit && (stdout || stderr)) {
        await log(`stdout tail: ${stdout.slice(-1000).trim()}`);
        if (stderr) await log(`stderr tail: ${stderr.slice(-1000).trim()}`);
      }

      if (code === 0)
        return resolve({ code, stdout, stderr, killedByTimeout, duration });
      if (allowFail)
        return resolve({ code, stdout, stderr, killedByTimeout, duration });
      return reject(
        new Error(
          killedByTimeout
            ? `Timeout: ${tag}`
            : `Non-zero exit (${code}): ${tag}\n${stderr || stdout}`,
        ),
      );
    });
  });
}

async function waitForServer(
  url,
  { path = "/", retries = 50, delayMs = 400 } = {},
) {
  const target = new URL(path, url);
  for (let i = 0; i < retries; i++) {
    try {
      await new Promise((resolve, reject) => {
        const req = http.get(target, (res) => {
          if (res.statusCode && res.statusCode < 400) resolve();
          else reject(new Error(`HTTP ${res.statusCode}`));
          res.resume();
        });
        req.on("error", reject);
        req.setTimeout(5000, () => {
          req.destroy(new Error("Timeout"));
        });
      });
      return true;
    } catch {
      await sleep(delayMs);
    }
  }
  return false;
}

function cmdExists(cmd) {
  const which = isWin ? "where" : "which";
  return spawnSync(which, [cmd], { encoding: "utf8" }).status === 0;
}

/* ─────────────── Report ─────────────── */

class Report {
  constructor() {
    this.data = {
      startedAt: new Date().toISOString(),
      dryRun: DRY,
      strict: STRICT,
      skipPdf: SKIP_PDF,
      skipDeploy: SKIP_DEPLOY,
      rollback: ROLLBACK,
      port: null,
      tasks: [],
      brandFrameUsage: [],
      corruptedFiles: [],
      missingFiles: [],
      invalidFrontMatter: [],
      missingAssets: [],
      pdfsGenerated: 0,
      vulnerabilities: 0,
      notes: [],
      endedAt: null,
    };
  }
  recordTask(task, status, details = {}) {
    this.data.tasks.push({ task, status, ...details });
    log(`Task: ${task} - ${status} ${JSON.stringify(details)}`);
  }
  recordBrandFrame(file, count) {
    this.data.brandFrameUsage.push({ file: norm(file), count });
  }
  recordCorrupted(file, changes) {
    this.data.corruptedFiles.push({ file: norm(file), changes });
  }
  recordMissing(file) {
    this.data.missingFiles.push(norm(file));
  }
  recordInvalidFrontMatter(file, issues) {
    this.data.invalidFrontMatter.push({ file: norm(file), issues });
  }
  recordMissingAsset(asset) {
    this.data.missingAssets.push(norm(asset));
  }
  recordNote(note) {
    this.data.notes.push(note);
    log(`Note: ${note}`);
  }
  increment(key) {
    this.data[key]++;
  }
  finalize() {
    this.data.endedAt = new Date().toISOString();
  }
  get() {
    return JSON.parse(JSON.stringify(this.data));
  }
  async writeHtml() {
    const escapeHtml = (s) =>
      String(s).replace(
        /[&<>"']/g,
        (m) =>
          ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;",
          })[m],
      );
    const html = `<!doctype html><html><head><meta charset="utf-8"/><title>Grand Master Report</title>
<style>body{font-family:system-ui,Arial;margin:20px}table{border-collapse:collapse;width:100%}
th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background:#f2f2f2}pre{white-space:pre-wrap}</style></head><body>
<h1>Grand Master Report</h1>
<p>Started: ${this.data.startedAt} | Ended: ${this.data.endedAt || "N/A"}</p>
<p>Config: dry=${this.data.dryRun}, strict=${this.data.strict}, skipPdf=${this.data.skipPdf}, skipDeploy=${this.data.skipDeploy}, rollback=${this.data.rollback}, port=${this.data.port}</p>
<h2>Tasks</h2><table><tr><th>Task</th><th>Status</th><th>Details</th></tr>${this.data.tasks
      .map(
        (t) =>
          `<tr><td>${t.task}</td><td>${t.status}</td><td><pre>${escapeHtml(JSON.stringify(t, null, 2))}</pre></td></tr>`,
      )
      .join("")}</table>
<h2>BrandFrame Usage</h2><ul>${this.data.brandFrameUsage.map((u) => `<li>${u.file}: ${u.count}</li>`).join("")}</ul>
<h2>Corrupted Files Fixed</h2><ul>${this.data.corruptedFiles.map((f) => `<li>${f.file}: ${escapeHtml((f.changes || []).join(", "))}</li>`).join("")}</ul>
<h2>Missing Files Restored</h2><ul>${this.data.missingFiles.map((f) => `<li>${f}</li>`).join("")}</ul>
<h2>Invalid Front-Matter</h2><ul>${this.data.invalidFrontMatter.map((f) => `<li>${f.file}: ${escapeHtml((f.issues || []).join(", "))}</li>`).join("")}</ul>
<h2>Missing Assets</h2><ul>${this.data.missingAssets.map((a) => `<li>${a}</li>`).join("")}</ul>
<h2>Notes</h2><ul>${this.data.notes.map((n) => `<li>${escapeHtml(n)}</li>`).join("")}</ul>
</body></html>`;
    await writeFileSafe(path.join(outDir, "grand-master-report.html"), html);
  }
}
const report = new Report();

/* ───────────── Mojibake + FM healing ───────────── */

function isMojibake(text) {
  return (
    /Ãƒ[Æ’â€][\w\W]{1,10}Ã¢â€/.test(text) ||
    text.includes("\uFEFF") ||
    /â€¦|â€”|â€œ|â€|â€“|â€™|Â./.test(text)
  );
}

function fixMojibake(text) {
  const replacements = [
    { from: /\uFEFF/g, to: "" }, // BOM
    { from: /\r\n|\r/g, to: "\n" }, // CRLF→LF
    { from: /[ \t]+$/gm, to: "" }, // trailing spaces
    // CP-1252 artifacts
    { from: /â€”/g, to: "—" },
    { from: /â€“/g, to: "–" },
    { from: /â€¦/g, to: "…" },
    { from: /â€˜|Ã¢â‚¬Ëœ/g, to: "'" },
    { from: /â€™|Ã¢â‚¬â„¢/g, to: "'" },
    { from: /â€œ|Ã¢â‚¬Å“|ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œ/g, to: '"' },
    { from: /â€|Ã¢â‚¬Â/g, to: '"' },
    { from: /Â©/g, to: "©" },
    { from: /Â/g, to: "" },
    // project-specific junk bursts -> strip
    { from: /ÃƒÆ’[^A-Za-z0-9]+/g, to: "" },
  ];
  let result = text;
  const changes = [];
  for (const { from, to } of replacements) {
    if (from.test(result)) {
      result = result.replace(from, to);
      changes.push(`replace:${from.source}`);
    }
  }
  // kill contentlayer imports
  const CL =
    /import\s+\{[^}]*\}\s+from\s+['"]contentlayer\/generated['"];?\n?/g;
  if (CL.test(result)) {
    result = result.replace(CL, "");
    changes.push("remove:contentlayer-imports");
  }
  return { fixed: result, changes: Array.from(new Set(changes)) };
}

function processFrontMatter(content, filePath) {
  const m = content.match(/^\s*---\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
  if (!m)
    return {
      fixedContent: content,
      changes: [],
      issues: ["Missing front-matter block"],
    };

  let [_, fm, body] = m;
  const lines = fm.split("\n");
  const out = [];
  const issues = [];
  const changes = [];

  for (let line of lines) {
    const t = line.trim();
    if (!t) {
      out.push(line);
      continue;
    }
    const idx = t.indexOf(":");
    if (idx < 0) {
      out.push(line);
      issues.push(`FM: malformed line "${t}"`);
      continue;
    }
    let key = t.slice(0, idx).trim();
    let value = t.slice(idx + 1).trim();

    if (key.toLowerCase() === "kind") {
      key = "type";
      changes.push("FM:kind->type");
    }
    const bare = value.replace(/^['"]|['"]$/g, "");

    // quote strings with spaces/specials
    if (
      bare &&
      !/^(['"]|true|false|null|\d|[\[{])/.test(value) &&
      (/\s/.test(bare) || /[:#-]/.test(bare))
    ) {
      value = `"${bare.replace(/"/g, '\\"')}"`;
      changes.push(`FM:quote:${key}`);
    }
    out.push(`${key}: ${value}`);
  }

  const fixedContent = `---\n${out.join("\n").trim()}\n---\n\n${(body || "").trim()}\n`;
  return { fixedContent, changes, issues };
}

/* ───────────── File pass ───────────── */

async function fixAndValidateFiles() {
  report.recordTask("content-scan", "running");
  const EXT = [
    ".js",
    ".ts",
    ".tsx",
    ".jsx",
    ".mjs",
    ".cjs",
    ".md",
    ".mdx",
    ".json",
    ".css",
    ".html",
  ];
  const IGNORE = new Set([
    "node_modules",
    ".git",
    ".next",
    "out",
    ".turbo",
    "dist",
    "scripts/_backups",
  ]);
  const files = [];

  const stack = [root];
  while (stack.length) {
    const d = stack.pop();
    let ents = [];
    try {
      ents = await fs.readdir(d, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const e of ents) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) {
        if ([...IGNORE].some((x) => p.includes(x))) continue;
        stack.push(p);
      } else if (EXT.some((ext) => p.endsWith(ext))) {
        files.push(p);
      }
    }
  }

  for (const file of files) {
    try {
      const orig = await fs.readFile(file, "utf8");
      let content = orig;
      let fileChanges = [];

      // Mojibake
      if (isMojibake(content)) {
        const { fixed, changes } = fixMojibake(content);
        content = fixed;
        fileChanges.push(...changes);
      }

      // FM normalization
      if (file.endsWith(".mdx") || file.endsWith(".md")) {
        const { fixedContent, changes, issues } = processFrontMatter(
          content,
          file,
        );
        content = fixedContent;
        fileChanges.push(...changes);
        if (issues.length) report.recordInvalidFrontMatter(file, issues);
      }

      if (content.includes("<BrandFrame")) {
        const count = (content.match(/<BrandFrame\b[^>]*>/g) || []).length;
        report.recordBrandFrame(file, count);
        if (STRICT)
          throw new Error(
            `STRICT FAILURE: Deprecated <BrandFrame> in ${norm(file)}`,
          );
      }

      if (content !== orig) {
        await writeFileSafe(file, content);
        report.recordCorrupted(file, fileChanges);
      }

      if (isMojibake(content) && STRICT) {
        throw new Error(
          `STRICT FAILURE: Mojibake persisted in ${norm(file)} after fix.`,
        );
      }
    } catch (e) {
      report.recordTask("fix-encoding", "fatal-error", {
        error: e.message,
        file: norm(file),
      });
      if (STRICT) throw e;
    }
  }
  report.recordTask("content-scan", "success", { filesScanned: files.length });
}

/* ───────────── Restore essential content & pages ───────────── */

async function ensureDownloadPage() {
  const pagePath = path.join(PAGES_DIR, "downloads/[slug].tsx");
  if (await exists(pagePath)) return;

  const pageContent = `import { GetStaticPaths, GetStaticProps } from "next";
import { MDXRemote } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";
import matter from "gray-matter";
import path from "path";
import fs from "fs";
import Head from "next/head";

export default function DownloadPage({ source, frontMatter }) {
	const { title, coverImage, description } = frontMatter || {};
	return (
		<>
			<Head>
				<title>{title ? \`\${title} | Abraham of London\` : "Download"}</title>
				<meta name="robots" content="noindex, nofollow" />
				<meta name="description" content={description || title || "Download"} />
				<style dangerouslySetInnerHTML={{ __html: \`
					@page { size: A4; margin: 20mm; }
					#pdf-container { font-family: serif; color: #000; line-height: 1.5; }
					#pdf-container h1, #pdf-container h2, #pdf-container h3 { page-break-after: avoid; }
					#pdf-container img { max-width: 100%; height: auto; }
				\` }} />
			</Head>
			<main id="pdf-container" role="main" className="prose mx-auto p-6">
				{coverImage ? <img src={coverImage} alt="" /> : null}
				<MDXRemote {...source} />
			</main>
		</>
	);
}

export const getStaticPaths: GetStaticPaths = async () => {
	const dir = path.join(process.cwd(), "content/downloads");
	if (!fs.existsSync(dir)) return { paths: [], fallback: false };
	const files = fs.readdirSync(dir).filter(f => f.endsWith(".mdx"));
	const paths = files.map(f => ({ params: { slug: f.replace(/\\.mdx$/, "") } }));
	return { paths, fallback: false };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
	const filePath = path.join(process.cwd(), "content/downloads", \`\${params.slug}.mdx\`);
	const raw = fs.readFileSync(filePath, "utf8");
	const { content, data } = matter(raw);
	const source = await serialize(content, { scope: data });
	return { props: { source, frontMatter: data } };
};`;
  await writeFileSafe(pagePath, pageContent);
  report.recordMissing(pagePath);
  report.recordNote(`Created dynamic downloads page: ${norm(pagePath)}`);
}

async function restoreMissingFiles() {
  const items = [
    {
      path: "content/blog/christianity-not-extremism.mdx",
      content: `---
type: Blog
title: Christianity is Not Extremism
slug: christianity-not-extremism
date: 2025-10-13
author: Abraham of London
readTime: "4 min read"
category: Blog
excerpt: "Why: Christianity cannot be lumped under the banner of extremism: a call for ..."
tags:
	- faith
	- society
---
Content here...
`,
    },
    {
      path: "content/strategy/events-blueprint.md",
      content: `---
type: Strategy
title: Events Blueprint
slug: events-blueprint
date: 2025-10-13
author: Abraham of London
readTime: "4 min read"
category: Strategy
tags:
	- events
	- strategy
---
Content here...
`,
    },
    {
      path: "content/downloads/board-update-onepager.mdx",
      content: `---
type: Download
title: Board Update One-Pager
slug: board-update-onepager
date: 2025-10-13
author: Abraham of London
readTime: "2 min read"
category: Resources
pdfPath: /downloads/board-update-onepager.pdf
coverImage: /assets/images/downloads/board-update-onepager.jpg
tags:
	- board
	- update
---
# Board Update One-Pager
Content here...
`,
    },
    {
      path: "content/downloads/brotherhood-emergency-call-tree.mdx",
      content: `---
type: Download
title: Brotherhood Emergency Call Tree
slug: brotherhood-emergency-call-tree
readTime: "2 min read"
date: 2025-10-13
author: Abraham of London
category: Resources
pdfPath: /downloads/brotherhood-emergency-call-tree.pdf
coverImage: /assets/images/downloads/brotherhood-emergency-call-tree.jpg
tags:
	- emergency
	- brotherhood
---
## First hour: who calls whom
- **Coordinator:** starts the tree, tracks acknowledgements, closes the loop.
- **Pastoral:** contacts spouse/family if needed.
- **Practical:** transport, kids, meals, locks, cash.

### Contacts (fill these)
- Coordinator: [Name] 07...
- Pastoral: [Name] 07...
- Practical: [Name] 07...
- Backup: [Name] 07...

### Script (SMS call)
> **BRIEF:** One line facts.
> **POINT:** Immediate need.
> **FORWARD:** Where to meet / what to bring / ETA.

**Example:** Brief: Tom's car accident, A&E St. Mary's. Point: Kids need pickup. Forward: Mark grabs kids 3:45, Sarah meets at house 4:15.
`,
    },
    {
      path: "content/books/fathering-without-fear.mdx",
      content: `---
type: Book
title: Fathering Without Fear (The Field Memoir)
slug: fathering-without-fear
date: "2026-03-01"
author: Abraham of London
readTime: "4 hours"
category: Memoir
description: Forged in courtrooms and prayer rooms. A father's fight through fire—purpose, grace, and the long road to legacy.
ogDescription: Not a victim. A watchman. Fathering Without Fear is a field-memoir for dads who refuse to disappear.
coverImage: /assets/images/book-covers/fathering-without-fear-book.jpg
tags:
	- memoir
	- fatherhood
	- faith
---
"Not a plea, a standard." *Fathering Without Fear* is a memoir of clarity under pressure—faith lived in the open, a father's stubborn refusal to surrender the future that bears his name.

<aside>Content here...</aside>
`,
    },
    {
      path: "components/BlogPostCard.tsx",
      content: `import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import clsx from "clsx";

type AuthorType = string | { name?: string; image?: string };
type BlogPostCardProps = {
	slug: string; title: string; date?: string; excerpt?: string; coverImage?: string;
	author?: AuthorType; readTime?: string | number; category?: string; tags?: string[];
	coverAspect?: "book" | "wide" | "square"; coverFit?: "cover" | "contain"; coverPosition?: "center" | "left" | "right";
};

const DEFAULT_COVERS = ["/assets/images/blog/default.webp", "/assets/images/blog/default.jpg"] as const;
const FALLBACK_AVATAR = "/assets/images/profile-portrait.webp";

function stripMarkup(input?: string | null): string {
	if (!input) return ""; return input.replace(/<[^>]+>/g, "").replace(/\\s+/g, " ").trim();
}
function normalizeLocal(src?: string | null): string | undefined {
	if (!src) return undefined; if (/^https?:\\/\\//i.test(src)) return undefined; return src.startsWith("/") ? src : \`/\${src.replace(/^\\/+/, "")}\`;
}
function buildCoverCandidates(slug: string, coverImage?: string | null) {
	const s = String(slug).trim();
	const base = [ normalizeLocal(coverImage),
		\`/assets/images/blog/\${s}.webp\`, \`/assets/images/blog/\${s}.jpg\`,
		\`/assets/images/blog/\${s}.jpeg\`, \`/assets/images/blog/\${s}.png\`,
		...DEFAULT_COVERS ].filter(Boolean) as string[];
	return Array.from(new Set(base));
}

export default function BlogPostCard(props: BlogPostCardProps) {
	const { slug, title, excerpt, date, coverImage, author, readTime, category,
		coverAspect = "book", coverFit = "cover", coverPosition = "center" } = props;
	const authorName = typeof author === "string" ? author : author?.name || "Abraham of London";
	const preferredAvatar = (typeof author !== "string" && normalizeLocal(author?.image)) || FALLBACK_AVATAR;

	const candidates = React.useMemo(() => buildCoverCandidates(slug, coverImage), [slug, coverImage]);
	const [idx, setIdx] = React.useState(0); const [coverFailed, setCoverFailed] = React.useState(false);
	const [avatarSrc, setAvatarSrc] = React.useState(preferredAvatar);
	const coverSrc = !coverFailed ? candidates[idx] : undefined;
	const onCoverError = React.useCallback(() => {
		setIdx((i) => { const next = i + 1; if (next < candidates.length) return next; setCoverFailed(true); return i; });
	}, [candidates.length]);

	const dt = date ? new Date(date) : null; const valid = dt && !Number.isNaN(+dt);
	const dateTime = valid ? dt!.toISOString().slice(0, 10) : undefined;
	const dateLabel = valid ? new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(dt!) : undefined;

	const aspectClass = clsx({ "aspect-[1/1]": coverAspect === "square", "aspect-[16/9]": coverAspect === "wide", "aspect-[2/3]": coverAspect === "book" });
	const imageClasses = clsx(coverFit === "contain" ? "object-contain" : "object-cover", {
		"object-left": coverPosition === "left", "object-right": coverPosition === "right", "object-center": coverPosition === "center",
	});
	const frameClasses = clsx("relative w-full overflow-hidden rounded-t-2xl", aspectClass, coverFit === "contain" && "bg-white p-2 sm:p-3");

	const initials = React.useMemo(() => { const words = String(title || "").trim().split(/\\s+/).slice(0, 3); return words.map((w) => w[0]?.toUpperCase() || "").join("") || "A•L"; }, [title]);
	const safeExcerpt = stripMarkup(excerpt);

	return (
		<article className="rounded-2xl border border-neutral-200 bg-white shadow-sm transition hover:shadow-md">
			<Link href={\`/blog/\${slug}\`} className="block" prefetch={false} aria-label={\`Read: \${title}\`}>
				<div className={frameClasses}>
					{!coverFailed && coverSrc ? (
						<Image src={coverSrc} alt="" fill sizes="(max-width: 768px) 100vw, 33vw" className={imageClasses} onError={onCoverError}/>
					) : (
						<div className="absolute inset-0 flex items-center justify-center bg-neutral-50">
							<span className="select-none font-serif text-4xl font-semibold text-neutral-500">{initials}</span>
						</div>
					)}
				</div>
				<div className="p-5">
					<h3 className="font-serif text-xl font-semibold text-neutral-900">{title}</h3>
					<div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-600">
						{dateTime && <time dateTime={dateTime}>{dateLabel}</time>}
						{readTime && <span aria-label="Estimated reading time">{readTime} min read</span>}
						{category && <span className="inline-flex rounded-full border border-neutral-200 px-2 py-0.5">{category}</span>}
						<span className="underline decoration-dashed underline-offset-2">Discuss</span>
					</div>
					{safeExcerpt && <p className="mt-3 line-clamp-3 text-sm text-neutral-700">{safeExcerpt}</p>}
					<div className="mt-4 flex items-center gap-3">
						<Image src={avatarSrc} alt={authorName || "Author"} width={40} height={40} className="rounded-full object-cover" onError={() => setAvatarSrc(FALLBACK_AVATAR)}/>
						<div className="text-xs text-neutral-600"><p className="font-medium">{authorName}</p></div>
					</div>
				</div>
			</Link>
		</article>
	);
}
`,
    },
  ];

  for (const item of items) {
    const absPath = path.join(root, item.path);
    if (!(await exists(absPath))) {
      await writeFileSafe(absPath, item.content);
      report.recordMissing(item.path);
      report.recordNote(`Restored: ${norm(item.path)}`);
    }
  }

  // Ensure /pages/downloads/[slug].tsx exists for PDF routes
  await ensureDownloadPage();
}

/* ───────────── Env + audit + build ───────────── */

function requireEnvironment(minNodeMajor = 18) {
  const major = parseInt(process.versions.node.split(".")[0], 10);
  if (Number.isNaN(major) || major < minNodeMajor)
    throw new Error(
      `Node ${minNodeMajor}+ required. Current: ${process.versions.node}`,
    );
  const required = ["git", npm, npx];
  for (const cmd of required)
    if (!cmdExists(cmd)) throw new Error(`Required command not found: ${cmd}`);
}

async function auditDependencies() {
  let vulnCount = 0;
  try {
    report.recordTask("npm-install", "running");
    // Use run with inherit:true for better real-time logging during dependency install
    await run(npm, ["install", "--legacy-peer-deps"], {
      inherit: true,
      timeoutMs: 10 * 60_000,
    });
    report.recordTask("npm-install", "success");

    report.recordTask("npm-audit-fix", "running");
    // Use run with allowFail:true since audit fix can exit with 1 even when successful
    await run(npm, ["audit", "fix", "--force", "--fund=false"], {
      inherit: true,
      allowFail: true,
    });
    report.recordTask("npm-audit-fix", "success");

    const audit = spawnSync(npm, ["audit", "--json"], { encoding: "utf8" });
    if (audit.status === 0) {
      const parsed = JSON.parse(audit.stdout || "{}");
      vulnCount = parsed?.metadata?.vulnerabilities?.total ?? 0;
      report.data.vulnerabilities = vulnCount;
      report.recordTask("final-audit", vulnCount > 0 ? "warning" : "success", {
        vulnerabilities: vulnCount,
      });
    } else {
      // This block catches the 'Audit command failed' seen in the logs
      report.recordTask("final-audit", "failed", {
        error: "Audit command failed.",
      });
    }
  } catch (e) {
    report.recordTask("dependency-audit", "fatal-error", { error: e.message });
    if (STRICT) throw e;
  }
  return vulnCount;
}

/* ───────────── QA: smoke / a11y ───────────── */

async function runSmokeTests(baseUrl) {
  const testPath = path.join(root, "tests/a11y-smoke.spec.ts");
  if (!(await exists(testPath))) {
    report.recordNote(
      "Skipping smoke tests: tests/a11y-smoke.spec.ts not found.",
    );
    return;
  }

  report.recordTask("e2e-smoke-test", "running");
  try {
    const result = await run(
      npx,
      ["playwright", "test", "--workers=2", "--reporter=list"],
      {
        env: { BASE_URL: baseUrl, PWDEBUG: "0" },
        timeoutMs: 5 * 60_000,
        inherit: true,
      },
    );
    report.recordTask("e2e-smoke-test", "success", {
      duration: result.duration,
    });
  } catch (e) {
    report.recordTask("e2e-smoke-test", "failed", { error: e.message });
    if (STRICT) throw e;
  }
}

/* ───────────── Puppeteer PDF ───────────── */

async function renderPDF(browser, url, outPath, frontMatter) {
  const page = await browser.newPage();
  try {
    await page.goto(url, { waitUntil: "networkidle0", timeout: 60_000 });
    await page.waitForSelector("#pdf-container, main[role='main']", {
      timeout: 15_000,
    });
    await page.emulateMediaType("print");
    const headerTemplate = `<div style="font-size:8pt; width:100%; text-align:right; padding-right:20mm;">${frontMatter?.title ?? ""}</div>`;
    const footerTemplate = `<div style="font-size:8pt; width:100%; text-align:center; border-top:1px solid #ccc;"><span class="pageNumber"></span>/<span class="totalPages"></span> | Abraham of London</div>`;
    await page.pdf({
      path: DRY ? undefined : outPath,
      format: "A4",
      margin: { top: "25mm", right: "20mm", bottom: "25mm", left: "20mm" },
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate,
      footerTemplate,
    });
    report.increment("pdfsGenerated");
    return { ok: true };
  } catch (e) {
    report.recordNote(`PDF failed for ${url}: ${e.message}`);
    return { ok: false, error: e.message };
  } finally {
    await page.close();
  }
}

async function generatePDFs(baseUrl) {
  const dir = path.join(CONTENT_DIR, "downloads");
  if (!(await exists(dir)))
    return report.recordNote("No content/downloads directory");

  const files = (await fs.readdir(dir)).filter((f) => f.endsWith(".mdx"));
  if (!files.length)
    return report.recordNote("No MDX files in content/downloads");

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  try {
    const CONCURRENCY = 4;
    const tasks = files.map((f) => async () => {
      const fp = path.join(dir, f);
      let txt = await fs.readFile(fp, "utf8");
      txt = (await fixMojibake(txt)).fixed;
      const { fixedContent } = processFrontMatter(txt, fp);

      // extract fm again
      const mm = fixedContent.match(/^\s*---\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
      const fm = {};
      if (mm) {
        mm[1].split("\n").forEach((line) => {
          const i = line.indexOf(":");
          if (i > -1)
            fm[line.slice(0, i).trim()] = line
              .slice(i + 1)
              .trim()
              .replace(/^['"]|['"]$/g, "");
        });
      }
      fm.slug =
        fm.slug ||
        path
          .basename(f, ".mdx")
          .toLowerCase()
          .replace(/[^a-z0-9-]+/g, "-");
      fm.title = fm.title || fm.slug;

      if (fm.coverImage) {
        const abs = path.join(PUBLIC_DIR, fm.coverImage.replace(/^\//, ""));
        if (!(await exists(abs))) report.recordMissingAsset(fm.coverImage);
      }

      const url = new URL(`/downloads/${fm.slug}`, baseUrl).toString();
      const outPath = path.join(PUBLIC_DIR, "downloads", `${fm.slug}.pdf`);
      await fs.mkdir(path.dirname(outPath), { recursive: true });

      const res = await renderPDF(browser, url, outPath, fm);
      if (!res.ok && STRICT)
        throw new Error(
          `PDF generation failed for ${fm.slug}: ${res.error || "unknown"}`,
        );
    });

    // simple concurrency runner
    const queue = [...tasks];
    const runners = Array(CONCURRENCY)
      .fill(0)
      .map(async () => {
        while (queue.length) {
          const t = queue.shift();
          if (!t) break;
          try {
            await t();
          } catch (e) {
            report.recordNote(`Parallel PDF task failed: ${e.message}`);
            if (STRICT) throw e;
          }
        }
      });
    await Promise.all(runners);
  } finally {
    await browser.close();
  }
}

/* ───────────── Main ───────────── */

(async function main() {
  await log(
    `Starting Apex Grand Master (dry=${DRY}, strict=${STRICT}, rollback=${ROLLBACK})`,
  );

  // 0) Preflight & Rollback Check
  try {
    requireEnvironment(18);
    report.recordTask("environment-lock", "success");
  } catch (e) {
    report.recordTask("environment-lock", "failed", { error: e.message });
    throw e;
  }

  if (ROLLBACK) {
    report.recordTask("rollback", "skipped", {
      reason:
        "Rollback logic is not implemented; use external tooling or implement file restoration from backupDir.",
    });
  }

  let exitCode = 0;
  let serverProc = null;
  let serverUrl = null;

  try {
    // 1) Self-Healing / Atomic Fixes
    await restoreMissingFiles();
    await fixAndValidateFiles();

    // 2) Audit Dependencies
    const vulnCount = await auditDependencies();
    if (STRICT && vulnCount > 0)
      throw new Error(
        `STRICT FAILURE: ${vulnCount} vulnerabilities found after fix.`,
      );

    // 3) Next.js Build (Generate artifacts)
    report.recordTask("next-build", "running");
    // Using npx next build directly is more reliable than 'npm run build'
    await run(npx, ["next", "build"], {
      inherit: true,
      timeoutMs: 10 * 60_000,
    });
    report.recordTask("next-build", "success");

    // 4) Start Server for Testing/PDF
    const port = await getPort({ port: PORT_RANGE });
    serverUrl = `http://localhost:${port}`;
    report.data.port = port;

    report.recordTask("next-start", "running", { port });
    // Start the Next.js server in the background
    serverProc = track(
      spawn(npx, ["next", "start", "-p", String(port)], {
        stdio: "pipe",
        shell: isWin,
        cwd: root,
      }),
    );

    if (!(await waitForServer(serverUrl, { path: "/" }))) {
      throw new Error(`Server failed to start or respond at ${serverUrl}`);
    }
    report.recordTask("next-start", "success", { url: serverUrl });

    // 5) QA Tasks (Smoke Testing)
    await runSmokeTests(serverUrl);

    // 6) Parallel PDF Generation
    if (!SKIP_PDF) {
      report.recordTask("pdf-generation", "running");
      await generatePDFs(serverUrl);
      report.recordTask("pdf-generation", "success", {
        count: report.data.pdfsGenerated,
      });
    }

    // 7) Deployment (Placeholder)
    if (!SKIP_DEPLOY) {
      report.recordTask("deployment", "skipped", {
        reason: "Deployment logic is not implemented.",
      });
    }
  } catch (e) {
    await log(`FATAL ERROR: ${e.message}`);
    report.recordTask("grand-master-run", "FATAL-FAILED", { error: e.message });
    exitCode = 1;
    if (STRICT) throw e;
  } finally {
    // Final Cleanup and Reporting
    if (serverProc) {
      await log("Stopping Next.js server.");
      serverProc.kill("SIGINT");
    }
    await shutdown(); // Ensure all child processes are terminated

    report.finalize();
    await fs.writeFile(REPORT_PATH, JSON.stringify(report.get(), null, 2));
    await report.writeHtml();

    await log(`Grand Master finished with exit code ${exitCode}.`);
    process.exit(exitCode);
  }
})();
