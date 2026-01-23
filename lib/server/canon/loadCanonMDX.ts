/* lib/server/canon/loadCanonMDX.ts */
import { getDocBySlug } from "@/lib/contentlayer-compat";

export async function loadCanonMDX(slug: string) {
  const doc = await getDocBySlug(`content/${slug}`);
  if (!doc) return null;

  return {
    mdx: doc.body.raw,
    access: (doc.accessLevel || "public") as "public" | "inner-circle" | "private",
  };
}