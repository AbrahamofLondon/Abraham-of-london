*** Begin Patch
*** Update File: pages/downloads/index.tsx
@@
-import Head from "next/head";
-import Image from "next/image";
-import Link from "next/link";
-import * as React from "react";
-
-type DownloadItem = {
-  slug: string;
-  title: string;
-  excerpt: string;
-  category: "Leadership" | "Entrepreneurship" | "Mentorship";
-  coverImage: string;
-  pdfPath: string;
-  mdxPath: string;
-};
-
-const items: DownloadItem[] = [
-  { ...hardcoded list... }
-];
+import Head from "next/head";
+import Image from "next/image";
+import Link from "next/link";
+import * as React from "react";
+import fs from "node:fs";
+import path from "node:path";
+import matter from "gray-matter";
+import type { GetStaticProps } from "next";
+
+type DownloadItem = {
+  slug: string;
+  title: string;
+  excerpt?: string | null;
+  category?: string | null;
+  coverImage?: string | null;
+  pdfPath?: string | null;
+};
+
+type Props = { items: DownloadItem[] };
+
+const ROOT = process.cwd();
+const CONTENT_DIR = path.join(ROOT, "content", "downloads");
+
+export const getStaticProps: GetStaticProps<Props> = async () => {
+  const files = fs.existsSync(CONTENT_DIR)
+    ? fs.readdirSync(CONTENT_DIR).filter((f) => /\.mdx?$/.test(f))
+    : [];
+  const items: DownloadItem[] = files.map((file) => {
+    const slug = file.replace(/\.mdx?$/, "");
+    const raw = fs.readFileSync(path.join(CONTENT_DIR, file), "utf-8");
+    const { data } = matter(raw);
+    return {
+      slug,
+      title: data.title || slug,
+      excerpt: data.excerpt ?? null,
+      category: data.category ?? null,
+      coverImage: data.coverImage ?? null,
+      pdfPath: data.pdfPath ?? null,
+    };
+  });
+  // Optional: order by title
+  items.sort((a, b) => a.title.localeCompare(b.title));
+  return { props: { items }, revalidate: 120 };
+};
@@
-export default function DownloadsIndex() {
+export default function DownloadsIndex({ items }: Props) {
   return (
     <>
       <Head>
         <title>Downloads — Playbooks & Packs</title>
@@
-        <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
-          {items.map((d) => (
+        <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
+          {items.map((d) => (
             <li key={d.slug} className="group overflow-hidden rounded-xl border border-lightGrey bg-warmWhite shadow-card transition hover:shadow-cardHover">
-              <Link href={d.mdxPath} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-forest">
+              <Link href={`/downloads/${d.slug}`} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-forest">
                 <div className="relative h-48 w-full overflow-hidden">
                   <Image
-                    src={d.coverImage}
+                    src={d.coverImage || "/assets/images/social/og-image.jpg"}
                     alt={d.title}
                     fill
                     sizes="(max-width: 768px) 100vw, 33vw"
                     className="object-cover transition duration-300 group-hover:scale-[1.03]"
                     priority={false}
                   />
                 </div>
               </Link>
@@
-                <h2 className="font-serif text-xl text-forest">
-                  <Link href={d.mdxPath} className="luxury-link">
+                <h2 className="font-serif text-xl text-forest">
+                  <Link href={`/downloads/${d.slug}`} className="luxury-link">
                     {d.title}
                   </Link>
                 </h2>
                 <p className="mt-2 line-clamp-3 text-sm text-deepCharcoal/80">{d.excerpt}</p>
@@
-                  <Link
-                    href={d.mdxPath}
-                    className="aol-btn rounded-full px-4 py-2 text-sm"
-                  >
+                  <Link href={`/downloads/${d.slug}`} className="aol-btn rounded-full px-4 py-2 text-sm">
                     Read online
                   </Link>
-                  <Link
-                    href={d.pdfPath}
-                    className="text-sm text-forest underline underline-offset-2 hover:text-softGold"
-                  >
-                    Download PDF →
-                  </Link>
+                  {d.pdfPath && (
+                    <Link
+                      href={d.pdfPath}
+                      className="text-sm text-forest underline underline-offset-2 hover:text-softGold"
+                    >
+                      Download PDF →
+                    </Link>
+                  )}
                 </div>
               </div>
             </li>
           ))}
         </ul>
*** End Patch
