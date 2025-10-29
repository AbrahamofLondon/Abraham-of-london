// lib/mdx-file.ts

import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { serialize } from "next-mdx-remote/serialize";

export type AnyFrontmatter = Record<string, unknown>;

export function listSlugs(dir: string, ext = ".mdx") {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.endsWith(ext)).map((f) => f.replace(ext, ""));
}

/**
 * Recursively replaces all 'undefined' values in an object with 'null'.
 * This is necessary because Next.js/JSON cannot serialize 'undefined'.
 */
function replaceUndefinedWithNull(obj: AnyFrontmatter): AnyFrontmatter {
  const cleanObj: AnyFrontmatter = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      if (typeof value === 'object' && value !== null) {
        // Recurse for nested objects (though frontmatter is usually flat)
        cleanObj[key] = replaceUndefinedWithNull(value as AnyFrontmatter);
      } else {
        // Replace undefined with null
        cleanObj[key] = value === undefined ? null : value;
      }
    }
  }
  return cleanObj;
}

export async function loadMdxBySlug<T extends AnyFrontmatter = AnyFrontmatter>(
  dir: string,
  slug: string,
) {
  const file = path.join(dir, `${slug}.mdx`);
  const raw = fs.readFileSync(file, "utf-8");
  const { data, content } = matter(raw);
  
  // FINAL FIX: Ensure all frontmatter properties are JSON serializable
  const cleanData = replaceUndefinedWithNull(data);
  
  // Use the cleaned data for serialization and return
  const mdxSource = await serialize(content, { scope: cleanData });
  
  return { frontmatter: cleanData as T, mdxSource };
}