// app/__pdf/[slug]/page.tsx
// ABRAHAM OF LONDON — SSR PRINT ROUTE (MDX React Rendering)
// ---------------------------------------------------------
// Purpose: render real MDX + React components as HTML for Puppeteer printing.
// - No client JS required.
// - Uses your real components map (DownloadCard, Callout, Note).
// - Content source: Contentlayer first; fallback to reading content/*.mdx directly.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import fs from "fs/promises";
import path from "path";
import matter from "gray-matter";
import "@/app/__pdf/print.css";

// MDX RSC renderer
import { MDXRemote } from "next-mdx-remote/rsc";
import React from "react";

type Frontmatter = {
  type?: string;
  docKind?: string;
  title?: string;
  subtitle?: string;
  description?: string;
  excerpt?: string;
  author?: string;
  date?: string;
  tier?: string;
  accessLevel?: string;
  category?: string;
  tags?: string[];
};

type LoadedDoc = {
  fm: Frontmatter;
  content: string;
  sourcePath?: string;
};

function normalizeSlug(input: string) {
  return String(input || "")
    .trim()
    .replace(/^\/+/, "")
    .replace(/^downloads\//, "")
    .replace(/\.mdx$/i, "");
}

// Tier -> accent (matches your premium posture)
function tierAccent(tierRaw?: string) {
  const t = String(tierRaw || "").toLowerCase();
  if (t.includes("architect")) return "#C9A96A";
  if (t.includes("inner-circle")) return "#7C3AED";
  if (t.includes("member")) return "#2563EB";
  return "#111827";
}

async function tryLoadFromContentlayer(slug: string): Promise<LoadedDoc | null> {
  try {
    const mod: any = await import("contentlayer/generated");
    // Common patterns in Contentlayer:
    // - allDownloads
    // - allDocs
    // - allDocuments
    const candidates: any[] =
      mod?.allDownloads ||
      mod?.allDownload ||
      mod?.allDocuments ||
      mod?.allDocs ||
      [];

    if (!Array.isArray(candidates) || candidates.length === 0) return null;

    const hit = candidates.find((d) => {
      const s = normalizeSlug(d?.slug || d?._raw?.flattenedPath || d?._id || "");
      return s === slug;
    });

    if (!hit) return null;

    // Contentlayer often exposes body as .body.raw or .body.code
    const raw = hit?.body?.raw || hit?.body || hit?.raw || "";
    const fm: Frontmatter = {
      title: hit?.title,
      subtitle: hit?.subtitle,
      description: hit?.description,
      excerpt: hit?.excerpt,
      author: hit?.author,
      date: hit?.date,
      tier: hit?.tier || hit?.accessLevel,
      accessLevel: hit?.accessLevel,
      category: hit?.category,
      tags: hit?.tags,
      type: hit?.type,
      docKind: hit?.docKind,
    };

    // If raw is empty, we can’t trust this route; fallback to FS.
    if (!raw || typeof raw !== "string") return null;

    // If raw contains full MDX with frontmatter stripped already, fine.
    return { fm, content: raw, sourcePath: hit?._raw?.sourceFilePath };
  } catch {
    return null;
  }
}

async function tryLoadFromFilesystem(slug: string): Promise<LoadedDoc | null> {
  // Search these likely roots
  const roots = [
    path.join(process.cwd(), "content", "downloads"),
    path.join(process.cwd(), "content"),
  ];

  // Common patterns:
  // content/downloads/<slug>.mdx
  // content/downloads/<slug>.md
  // content/<type>/<slug>.mdx
  const candidates: string[] = [];
  for (const r of roots) {
    candidates.push(path.join(r, `${slug}.mdx`));
    candidates.push(path.join(r, `${slug}.md`));
  }

  // Also search recursively if direct hit fails (costly but acceptable for print route)
  async function walk(dir: string, out: string[]) {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const e of entries) {
        const abs = path.join(dir, e.name);
        if (e.isDirectory()) await walk(abs, out);
        else if (abs.toLowerCase().endsWith(".mdx") || abs.toLowerCase().endsWith(".md")) out.push(abs);
      }
    } catch {}
  }

  // First: direct candidates
  for (const p of candidates) {
    try {
      const raw = await fs.readFile(p, "utf8");
      const { data, content } = matter(raw);
      return { fm: (data || {}) as any, content, sourcePath: p };
    } catch {}
  }

  // Second: recursive search
  for (const r of roots) {
    const found: string[] = [];
    await walk(r, found);

    const hit = found.find((p) => normalizeSlug(path.basename(p).replace(/\.(mdx|md)$/i, "")) === slug);
    if (hit) {
      const raw = await fs.readFile(hit, "utf8");
      const { data, content } = matter(raw);
      return { fm: (data || {}) as any, content, sourcePath: hit };
    }
  }

  return null;
}

async function loadDoc(slug: string): Promise<LoadedDoc> {
  const s = normalizeSlug(slug);

  // 1) Contentlayer
  const cl = await tryLoadFromContentlayer(s);
  if (cl) return cl;

  // 2) Filesystem
  const fsDoc = await tryLoadFromFilesystem(s);
  if (fsDoc) return fsDoc;

  throw new Error(`PDF print route: unable to load MDX for slug="${s}".`);
}

// --- Component map (REAL MDX React) ---
async function getMdxComponents() {
  // Use your real components if available.
  // If import fails, fallback to print-safe stubs (still renders, doesn’t crash).
  const fallback = {
    DownloadCard: (props: any) => (
      <div style={{ border: "1px solid rgba(2,6,23,0.12)", padding: 12, borderRadius: 10, margin: "14pt 0" }}>
        <div style={{ fontFamily: "ui-sans-serif", fontWeight: 700, marginBottom: 6 }}>
          {props?.title || "Download"}
        </div>
        <div style={{ fontFamily: "ui-sans-serif", color: "rgba(2,6,23,0.70)", marginBottom: 8 }}>
          {props?.children}
        </div>
        {props?.href ? (
          <div style={{ fontFamily: "ui-monospace", fontSize: 11, opacity: 0.75 }}>
            {String(props.href)}
          </div>
        ) : null}
      </div>
    ),
    Callout: (props: any) => (
      <blockquote>
        <strong style={{ fontFamily: "ui-sans-serif" }}>{props?.type ? String(props.type).toUpperCase() : "NOTE"}:</strong>{" "}
        {props?.children}
      </blockquote>
    ),
    Note: (props: any) => (
      <div style={{ borderLeft: "4px solid #c9a96a", background: "rgba(201,169,106,0.10)", padding: 12, margin: "14pt 0" }}>
        <div style={{ fontFamily: "ui-sans-serif", fontWeight: 700, marginBottom: 6 }}>
          {props?.title || "Note"}
        </div>
        <div>{props?.children}</div>
      </div>
    ),
  };

  try {
    const DownloadCardMod: any = await import("@/components/mdx/DownloadCard");
    const CalloutMod: any = await import("@/components/Callout");
    // Note may live in different places; try a couple
    let NoteComp: any = null;
    try {
      const NoteMod: any = await import("@/components/mdx/Note");
      NoteComp = NoteMod?.default || NoteMod?.Note || null;
    } catch {
      try {
        const NoteMod2: any = await import("@/components/Note");
        NoteComp = NoteMod2?.default || NoteMod2?.Note || null;
      } catch {
        NoteComp = null;
      }
    }

    return {
      DownloadCard: DownloadCardMod?.default || DownloadCardMod?.DownloadCard || fallback.DownloadCard,
      Callout: CalloutMod?.default || CalloutMod?.Callout || fallback.Callout,
      Note: NoteComp || fallback.Note,

      // Optional: if you use other MDX components, add them here.
    };
  } catch {
    return fallback;
  }
}

export default async function PDFPrintPage({ params, searchParams }: any) {
  const slug = normalizeSlug(params?.slug);

  const doc = await loadDoc(slug);
  const fm = doc.fm || {};

  const title = String(fm.title || slug).trim();
  const subtitle = String(fm.subtitle || "").trim();
  const description = String(fm.description || fm.excerpt || "").trim();
  const author = String(fm.author || "Abraham of London").trim();
  const date = String(fm.date || "").trim();

  // Tier signal from query OR frontmatter
  const tier = String(searchParams?.tier || fm.tier || fm.accessLevel || "free");
  const accent = tierAccent(tier);

  const components = await getMdxComponents();

  return (
    <div data-aol="shell" style={{ ["--accent" as any]: accent }}>
      {/* Cover */}
      <section data-aol="cover" style={{ ["--accent" as any]: accent } as any}>
        <div className="aol-cover-topbar" style={{ background: accent }} />
        <div>
          <div className="aol-cover-kicker">{String(tier || "public").toUpperCase()} • PRINT EDITION</div>
          <h1 className="aol-cover-title">{title}</h1>
          {subtitle ? <div className="aol-cover-subtitle">{subtitle}</div> : null}
          {description ? <div className="aol-cover-desc">{description}</div> : null}
          <div className="aol-cover-meta">
            <span>{author}</span>
            <span className="aol-dot" />
            <span>{date ? date : new Date().toISOString().slice(0, 10)}</span>
          </div>
        </div>
      </section>

      <div data-aol="page-break" />

      {/* Prose */}
      <main data-aol="prose">
        <MDXRemote source={doc.content} components={components as any} />
      </main>
    </div>
  );
}