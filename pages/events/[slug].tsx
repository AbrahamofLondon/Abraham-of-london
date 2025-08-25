 import Head from "next/head";
 import { MDXRemote } from "next-mdx-remote";
 import { serialize } from "next-mdx-remote/serialize";
 // Server-only data accessors
 import { getEventBySlug, getEventSlugs } from "@/lib/server/events-data";
 import type { EventMeta } from "@/lib/events"; // types only
 
-// London-first pretty date; hides midnight
-function formatPretty(iso: string, tz = "Europe/London") {
-  const d = new Date(iso);
-  if (Number.isNaN(d.valueOf())) return iso;
-  const date = new Intl.DateTimeFormat("en-GB", {
-    timeZone: tz,
-    day: "2-digit",
-    month: "short",
-    year: "numeric",
-  }).format(d);
-  const hh = Number(
-    new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", hour12: false }).format(d)
-  );
-  const mm = Number(
-    new Intl.DateTimeFormat("en-GB", { timeZone: tz, minute: "2-digit" }).format(d)
-  );
-  if (hh === 0 && mm === 0) return date;
-  const time = new Intl.DateTimeFormat("en-GB", {
-    timeZone: tz,
-    hour: "2-digit",
-    minute: "2-digit",
-    hour12: false,
-  }).format(d);
-  return `${date}, ${time}`;
-}
+// London-first pretty date; if front matter is YYYY-MM-DD, show date only
+const isDateOnly = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s);
+function formatPretty(isoish: string, tz = "Europe/London") {
+  if (isDateOnly(isoish)) {
+    // Avoid the 00:00Z -> 01:00 BST artefact; render date only
+    const d = new Date(`${isoish}T00:00:00Z`);
+    return new Intl.DateTimeFormat("en-GB", {
+      timeZone: tz,
+      weekday: "short",
+      day: "2-digit",
+      month: "short",
+      year: "numeric",
+    }).format(d);
+  }
+  const d = new Date(isoish);
+  if (Number.isNaN(d.valueOf())) return isoish;
+  const date = new Intl.DateTimeFormat("en-GB", {
+    timeZone: tz,
+    weekday: "short",
+    day: "2-digit",
+    month: "short",
+    year: "numeric",
+  }).format(d);
+  const time = new Intl.DateTimeFormat("en-GB", {
+    timeZone: tz,
+    hour: "2-digit",
+    minute: "2-digit",
+    hour12: false,
+    timeZoneName: "short",
+  }).format(d);
+  return `${date}, ${time}`;
+}
 
-function EventPage({ event, contentSource }: { event: EventMeta; contentSource: any }) {
+function EventPage({ event, contentSource }: { event: EventMeta & { coverImage?: string }; contentSource: any }) {
   if (!event) return <div>Event not found.</div>;
 
   const prettyDate = formatPretty(event.date);
-  const jsonLd = {
+  const site = process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org";
+  const url  = `${site}/events/${event.slug}`;
+  const absImage = event.coverImage ? new URL(event.coverImage, site).toString() : undefined;
+  const jsonLd: Record<string, any> = {
     "@context": "https://schema.org",
     "@type": "Event",
     name: event.title,
-    startDate: event.date, // ISO with TZ in content
+    startDate: event.date, // supports YYYY-MM-DD or full ISO
     eventStatus: "https://schema.org/EventScheduled",
     eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
     location: {
       "@type": "Place",
       name: event.location || "London, UK",
       address: event.location || "London, UK",
     },
     organizer: {
       "@type": "Organization",
       name: "Abraham of London",
       url: "https://www.abrahamoflondon.org",
     },
-    image: (event as any).image || undefined,
+    ...(absImage ? { image: [absImage] } : {}),
     description: event.summary || "",
+    url,
   };
@@
 export async function getStaticProps({ params }: { params: { slug: string } }) {
   const { content, ...event } = getEventBySlug(params.slug, [
     "slug",
     "title",
     "date",
     "location",
     "summary",
+    "coverImage",
     "content", // Ensure content is fetched
   ]);
 
   const contentSource = await serialize(content || "");
   return { props: { event, contentSource } };
 }
