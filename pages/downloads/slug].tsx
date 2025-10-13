*** Begin Patch
*** Update File: pages/downloads/[slug].tsx
@@
 type DownloadMeta = {
   slug: string;
   title: string;
   date?: string | null;
   excerpt?: string | null;
   coverImage?: string | null;
+  pdfPath?: string | null;
   author?: string | null;
   readTime?: string | null;
   category?: string | null;
   tags?: string[] | null;
   coverAspect?: "book" | "wide" | "square" | null;
@@
   const meta: DownloadMeta = {
     slug,
     title: data.title || slug,
     date: data.date ?? null,
     excerpt: data.excerpt ?? null,
     coverImage: data.coverImage ?? null,
+    pdfPath: data.pdfPath ?? null,
     author: data.author ?? "Abraham of London",
     readTime: data.readTime ?? null,
     category: data.category ?? null,
     tags: Array.isArray(data.tags) ? data.tags : null,
     coverAspect: data.coverAspect ?? null,
@@
-          {/* Direct download CTA */}
-          <div className="mt-10">
-            <Link
-              href={`/downloads/${slug.replace(/-/g, "_")}.pdf`.replace(
-                /^(.*)$/,
-                (m) => ({
-                  "leadership-playbook": "/downloads/Leadership_Playbook.pdf",
-                  "mentorship-starter-kit": "/downloads/Mentorship_Starter_Kit.pdf",
-                  "entrepreneur-operating-pack": "/downloads/Entrepreneur_Operating_Pack.pdf",
-                }[slug] || "/downloads")
-              )}
-              className="aol-btn"
-            >
-              Download PDF
-            </Link>
-          </div>
+          {meta.pdfPath && (
+            <div className="mt-10">
+              <Link href={meta.pdfPath} className="aol-btn">
+                Download PDF
+              </Link>
+            </div>
+          )}
*** End Patch
