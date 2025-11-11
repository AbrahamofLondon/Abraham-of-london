lib/content-validators.ts
import * as fs from 'node:fs';
import * as path from 'node:path';
import matter from 'gray-matter';
import { z } from '...';

export const FrontmatterSchema = z.object({
  title: z.string().min(2),
  slug: z.string().min(1),
  date: z.string().optional(),
  coverImage: z.string().optional(),
  excerpt: z.string().optional(),
  tags: z.array(z.string()).optional(),
  // add fields per collection…
});

export function fileExists(p: string) {
  try { return fs.existsSync(p); } catch { return false; }
}

export function safeReadMdx(filePath: string) {
  if (!fileExists(filePath)) return { ok:false, reason:'missing-file' as const };
  const raw = fs.readFileSync(filePath, 'utf8');
  const { data, content } = matter(raw);
  try {
    const meta = FrontmatterSchema.parse(data);
    // trivial guards to catch common MDX breakages early
    if ((content.match(/{/g)?.length ?? 0) !== (content.match(/}/g)?.length ?? 0)) {
      return { ok:false, reason:'unbalanced-braces' as const };
    }
    return { ok:true, meta, content };
  } catch (e) {
    return { ok:false, reason:'schema-invalid' as const, error:e };
  }
}
