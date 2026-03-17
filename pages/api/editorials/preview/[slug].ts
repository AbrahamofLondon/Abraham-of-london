import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { marked } from "marked";

function abs(p: string): string {
  return path.isAbsolute(p) ? p : path.join(process.cwd(), p);
}

function safeSlug(value: unknown): string {
  return typeof value === "string" ? value.trim().replace(/^\/+|\/+$/g, "") : "";
}

function escapeHtml(input: string): string {
  return String(input || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function candidateSlugs(slug: string): string[] {
  const base = safeSlug(slug);
  if (!base) return [];

  const candidates = [
    base,
    `${base}-editorial`,
    base.replace(/-editorial$/i, ""),
  ];

  return Array.from(new Set(candidates.filter(Boolean)));
}

function findPreviewSource(slug: string): { slug: string; filePath: string } | null {
  for (const candidate of candidateSlugs(slug)) {
    const filePath = abs(`scripts/pdf/print-sources/${candidate}.print.md`);
    if (fs.existsSync(filePath)) {
      return { slug: candidate, filePath };
    }
  }
  return null;
}

marked.setOptions({
  gfm: true,
  breaks: false,
  pedantic: false,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const requestedSlug = safeSlug(req.query.slug);
  const resolved = findPreviewSource(requestedSlug);

  if (!requestedSlug || !resolved) {
    return res.status(404).send("Preview not found");
  }

  const raw = fs.readFileSync(resolved.filePath, "utf8");
  const parsed = matter(raw);
  const title =
    typeof parsed.data?.title === "string" && parsed.data.title.trim()
      ? parsed.data.title.trim()
      : resolved.slug;

  const subtitle =
    typeof parsed.data?.subtitle === "string" && parsed.data.subtitle.trim()
      ? parsed.data.subtitle.trim()
      : "";

  const html = await marked.parse(parsed.content);

  res.setHeader("Content-Type", "text/html; charset=utf-8");

  return res.status(200).send(`
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>${escapeHtml(title)}</title>
        <style>
          :root {
            --bg: #f8f5ee;
            --paper: #fffdf8;
            --ink: #111318;
            --muted: #5f6470;
            --rule: #e8dfcf;
            --gold: #b8923f;
            --navy: #0c1730;
          }

          * { box-sizing: border-box; }

          html, body {
            margin: 0;
            padding: 0;
            background: var(--bg);
            color: var(--ink);
            font-family: Georgia, "Times New Roman", serif;
          }

          body {
            line-height: 1.75;
          }

          .shell {
            max-width: 900px;
            margin: 48px auto;
            padding: 0 24px 64px;
          }

          .card {
            background: var(--paper);
            border: 1px solid rgba(17,19,24,0.06);
            box-shadow: 0 18px 60px rgba(0,0,0,0.06);
          }

          .hero {
            padding: 40px 40px 30px;
            border-bottom: 1px solid var(--rule);
            background:
              linear-gradient(180deg, rgba(184,146,63,0.04), rgba(184,146,63,0.01));
          }

          .eyebrow {
            font: 700 10px Arial, Helvetica, sans-serif;
            letter-spacing: 0.28em;
            text-transform: uppercase;
            color: var(--gold);
            margin-bottom: 18px;
          }

          .title {
            font-size: 48px;
            line-height: 1.03;
            letter-spacing: -0.03em;
            color: var(--navy);
            margin: 0 0 14px;
            max-width: 88%;
          }

          .subtitle {
            max-width: 70%;
            font-size: 18px;
            line-height: 1.6;
            color: var(--muted);
            margin: 0;
          }

          .content {
            padding: 34px 40px 40px;
          }

          .content h1,
          .content h2,
          .content h3 {
            line-height: 1.2;
            color: var(--navy);
          }

          .content h1 {
            font-size: 30px;
            margin: 34px 0 14px;
          }

          .content h2 {
            font-size: 24px;
            margin: 30px 0 12px;
          }

          .content h3 {
            font-size: 18px;
            margin: 24px 0 10px;
          }

          .content p {
            margin: 0 0 16px;
          }

          .content table {
            width: 100%;
            border-collapse: collapse;
            margin: 22px 0;
          }

          .content th,
          .content td {
            border: 1px solid var(--rule);
            padding: 10px 12px;
            text-align: left;
            vertical-align: top;
          }

          .content th {
            background: #f6f2ea;
          }

          .content blockquote {
            margin: 24px 0;
            padding: 14px 18px;
            border-left: 3px solid var(--gold);
            color: #444c59;
            background: linear-gradient(180deg, #faf7f1, transparent);
          }

          .content hr {
            border: 0;
            border-top: 1px solid var(--rule);
            margin: 28px 0;
          }

          .content code {
            background: #f2efe8;
            padding: 1px 5px;
            border-radius: 4px;
            font-family: "Courier New", monospace;
          }

          .meta {
            margin-top: 18px;
            font: 400 11px Arial, Helvetica, sans-serif;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            color: #8a8f99;
          }
        </style>
      </head>
      <body>
        <div class="shell">
          <div class="card">
            <header class="hero">
              <div class="eyebrow">Editorial Preview</div>
              <h1 class="title">${escapeHtml(title)}</h1>
              ${subtitle ? `<p class="subtitle">${escapeHtml(subtitle)}</p>` : ""}
              <div class="meta">Resolved slug: ${escapeHtml(resolved.slug)}</div>
            </header>

            <main class="content">
              ${html}
            </main>
          </div>
        </div>
      </body>
    </html>
  `);
}