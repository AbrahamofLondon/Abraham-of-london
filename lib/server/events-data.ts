import matter from "gray-matter";
import fs from "fs";
import path from "path";

// …existing code for other functions (keep them here) …

/** Return a tiny resources summary (downloads + reads) from the event's front-matter, if present. */
export function getEventResourcesSummary(
  slug: string
): { downloads?: { href: string; label: string }[]; reads?: { href: string; label: string }[] } | null {
  const p =
    ((): string | null => {
      for (const ext of [".mdx", ".md"] as const) {
        const candidate = path.join(process.cwd(), "content", "events", `${slug}${ext}`);
        if (fs.existsSync(candidate)) return candidate;
      }
      return null;
    })();

  if (!p) return null;
  try {
    const raw = fs.readFileSync(p, "utf8");
    const parsed = matter(raw);
    const fm = (parsed.data || {}) as any;
    const res = fm?.resources;
    if (!res || typeof res !== "object") return null;

    const normList = (v: any): { href: string; label: string }[] =>
      Array.isArray(v)
        ? v
            .map((x) => (x && typeof x === "object" ? { href: String(x.href || ""), label: String(x.label || "") } : null))
            .filter((x) => x && x.href && x.label) as { href: string; label: string }[]
        : [];

    const out = {
      downloads: normList(res.downloads).slice(0, 4),
      reads: normList(res.reads).slice(0, 4),
    };
    if ((!out.downloads || out.downloads.length === 0) && (!out.reads || out.reads.length === 0)) return null;
    return out;
  } catch {
    return null;
  }
}

// REMOVED: export { dedupeEventsByTitleAndDay };