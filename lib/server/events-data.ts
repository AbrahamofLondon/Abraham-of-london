// lib/server/events-data.ts
 export interface EventMeta {
   slug: string;
   title: string;
   date: string;
+  endDate?: string;
   location?: string;
   excerpt?: string;
   summary?: string;
   heroImage?: string;
   ctaHref?: string;
   ctaLabel?: string;
   tags?: string[];
   content?: string;
 }

@@
-type FieldKey = keyof EventMeta | "content";
+type FieldKey = keyof EventMeta | "content";

 const DEFAULT_FIELDS: FieldKey[] = [
   "slug",
   "title",
   "date",
+  "endDate",
   "location",
   "summary",
   "heroImage",
   "ctaHref",
   "ctaLabel",
   "tags",
 ];

@@
   for (const field of wanted) {
     if (field === "content") {
       item.content = content;
       continue;
     }

     const raw = fm[field as string];

-    if (field === "date") {
+    if (field === "date" || field === "endDate") {
       const iso = normalizeDate(raw);
-      if (iso) item.date = iso;
+      if (iso) (item as any)[field] = iso;
       continue;
     }

     if (field === "tags") {
       const tags = normalizeTags(raw);
       if (tags) item.tags = tags;
       continue;
     }
@@
-  if (wanted.includes("date") && !item.date) item.date = new Date().toISOString();
+  if (wanted.includes("date") && !item.date) item.date = new Date().toISOString();
