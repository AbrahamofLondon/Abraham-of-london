import matter from "gray-matter";
import fs from "fs";
import path from "path";

// Define the root directory for events
const eventsDir = path.join(process.cwd(), "content", "events");

// --- 1. Required by getStaticPaths in pages/events/[slug].tsx ---
export function getEventSlugs(): string[] {
  try {
    // Read all files in the events directory and extract slugs
    return fs.readdirSync(eventsDir)
      .filter((file) => file.endsWith(".mdx") || file.endsWith(".md"))
      .map((file) => file.replace(/\.(mdx|md)$/, ""));
  } catch (e) {
    console.warn("Could not read event slugs. Returning empty array.", e);
    return []; // Return empty array to allow build to continue (with no event pages)
  }
}

// --- 2. Required by getStaticProps in pages/events/[slug].tsx ---
export function getEventBySlug(slug: string, fields: string[] = []) {
  const fullPathMdx = path.join(eventsDir, `${slug}.mdx`);
  const fullPathMd = path.join(eventsDir, `${slug}.md`);

  const fullPath = fs.existsSync(fullPathMdx) ? fullPathMdx : fs.existsSync(fullPathMd) ? fullPathMd : null;

  if (!fullPath) {
    // Fallback if the file isn't found
    return { slug, title: "Event Not Found", content: "" };
  }

  const fileContents = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(fileContents);

  // Return only the requested fields (required by Next.js data fetching pattern)
  const items: Record<string, any> = { slug, content };
  fields.forEach((field) => {
    if (field === "slug") {
      items[field] = slug;
    } else if (data[field] !== undefined) {
      items[field] = data[field];
    }
  });

  return items;
}

// --- 3. Required by pages/index.tsx and pages/api/search-index.ts ---
export function getAllEvents(fields: string[] = []) {
  const slugs = getEventSlugs();
  const events = slugs
    .map((slug) => getEventBySlug(slug, fields))
    .sort((event1, event2) => (event1.date > event2.date ? -1 : 1));

  return events;
}

// --- 4. Required by pages/index.tsx and pages/api/search-index.ts (Placeholder) ---
// We must re-add this function definition to satisfy the import, even if it does nothing.
export function dedupeEventsByTitleAndDay<T extends { title: string; date: string }>(
  events: T[]
): T[] {
  // Replace this with your actual deduplication logic later if needed
  return events;
}

// --- 5. Your Existing Function ---

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