import fs from "fs";
import path from "path";
import matter from "gray-matter";

const downloadsDir = path.join(process.cwd(), "content", "downloads");

export type DownloadMeta = {
  slug: string;
  title?: string;
  excerpt?: string;
  coverImage?: string;
  file?: string;
  coverAspect?: string;
  coverFit?: string;
  coverPosition?: string;
};

const read = (slug: string) => {
  const real = slug.replace(/\.mdx?$/, "");
  const full = path.join(downloadsDir, `${real}.mdx`);
  const raw = fs.readFileSync(full, "utf8");
  return { real, ...matter(raw) };
};

export function getDownloadBySlug(slug: string, fields: string[] = []): DownloadMeta {
  const { real, data } = read(slug);
  const out: any = { slug: real };
  fields.forEach((f) => {
    if (f === "slug") out.slug = real;
    else if (typeof data[f] !== "undefined") out[f] = data[f];
  });
  return out as DownloadMeta;
}

export function getDownloadsBySlugs(
  slugs: string[],
  fields: string[] = ["slug", "title", "excerpt", "coverImage", "file", "coverAspect", "coverFit", "coverPosition"]
): DownloadMeta[] {
  return slugs.map((s) => getDownloadBySlug(s, fields));
}
