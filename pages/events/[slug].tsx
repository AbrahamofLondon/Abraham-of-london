--- a/pages/events/[slug].tsx
+++ b/pages/events/[slug].tsx
@@
-import { MDXRemote } from "next-mdx-remote";
-import { getAllEvents, getEventBySlug } from "@/lib/events";
-import MDXComponents from "@/components/mdx-components";
+import { MDXRemote } from "next-mdx-remote";
+import { getAllEvents, getEventBySlug } from "@/lib/events";
+import { mdxToSource } from "@/lib/mdx";
+import MDXComponents from "@/components/mdx-components";
+import Image from "next/image";
 
 export async function getStaticPaths() {
-  const events = getAllEvents(["slug"]);
-  return { paths: events.map((e) => ({ params: { slug: e.slug } })), fallback: false };
+  const events = getAllEvents(["slug", "date", "published"]);
+  const visible = events.filter((e: any) => (e.published ?? true));
+  return { paths: visible.map((e: any) => ({ params: { slug: e.slug } })), fallback: "blocking" };
 }
 
 export async function getStaticProps({ params }: { params: { slug: string } }) {
-  const event = getEventBySlug(params.slug, ["title", "slug", "date", "content"]);
-  return { props: { event } };
+  const { content, ...event } = getEventBySlug(params.slug, [
+    "title",
+    "subtitle",
+    "slug",
+    "date",
+    "location",
+    "coverImage",
+    "tags",
+    "content",
+    "published",
+  ]);
+  const source = await mdxToSource(content, {
+    title: event.title,
+    subtitle: (event as any).subtitle ?? "",
+    date: event.date,
+    location: event.location ?? "",
+  });
+  return { props: { event, source }, revalidate: 60 };
 }
 
-export default function EventPage({ event }: any) {
-  return <article className="prose lg:prose-lg"><MDXRemote {...event.content} components={MDXComponents} /></article>;
+export default function EventPage({ event, source }: any) {
+  return (
+    <main>
+      <h1 className="text-3xl md:text-4xl font-semibold">{event.title}</h1>
+      {event.subtitle ? <p className="text-lg text-neutral-600 mt-1">{event.subtitle}</p> : null}
+      {event.coverImage ? (
+        <div className="relative w-full aspect-[16/9] mt-4 overflow-hidden rounded-xl">
+          <Image src={event.coverImage} alt={event.title} fill className="object-cover" priority />
+        </div>
+      ) : null}
+      <article className="prose lg:prose-lg max-w-none mt-6">
+        <MDXRemote {...source} components={MDXComponents as any} />
+      </article>
+    </main>
+  );
 }
