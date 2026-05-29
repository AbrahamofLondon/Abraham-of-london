/* eslint-disable @typescript-eslint/no-explicit-any */
import type { GetServerSideProps } from "next";
import { normalizeSlug } from "@/lib/content/shared";

const DOMAIN = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org"
).replace(/\/+$/, "");

/**
 * Institutional Sitemap Generator
 * Resolves content via unified aggregator to prevent allDocuments import errors.
 */
function generateSiteMap(docs: any[], typeKey: string) {
  const typeSlug = String(typeKey || "blog").toLowerCase();

  return `<?xml version="1.0" encoding="UTF-8"?>
   <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
     <url>
       <loc>${DOMAIN}/${typeSlug}</loc>
       <changefreq>daily</changefreq>
       <priority>0.8</priority>
     </url>
     ${docs
       .map((doc) => {
         const rawSlug = normalizeSlug(doc.slug || doc._raw?.flattenedPath || "");
         
         // Ensure we don't double-prefix (e.g., prevent /briefs/briefs/slug)
         const cleanSlug = rawSlug.startsWith(`${typeSlug}/`) 
            ? rawSlug 
            : `${typeSlug}/${rawSlug}`;

         // XML safety: escape ampersands or special chars if necessary
         const loc = `${DOMAIN}/${cleanSlug}`.replace(/&/g, '&amp;');

         return `
       <url>
           <loc>${loc}</loc>
           <lastmod>${doc.date || new Date().toISOString().split("T")[0]}</lastmod>
           <changefreq>monthly</changefreq>
           <priority>0.7</priority>
       </url>
     `;
       })
       .join("")}
   </urlset>
 `;
}

export const getServerSideProps: GetServerSideProps = async ({
  res,
  resolvedUrl,
}) => {
  // Matches URLs like /briefs-sitemap.xml
  const typeMatch = resolvedUrl.match(/\/([a-z-]+)-sitemap/i);
  const rawTypeKey = typeMatch?.[1];
  const typeKey = String(rawTypeKey || "blog").toLowerCase();

  // Get SSOT data — getPublishedDocumentsByType applies isLiveDoc, excluding future-dated, draft, and unpublished content
  const { getPublishedDocumentsByType } = await import("@/lib/content/server");
  const filteredDocs = getPublishedDocumentsByType(typeKey);

  // If no documents found, we still return an empty sitemap rather than a 404
  const sitemap = generateSiteMap(filteredDocs, typeKey);

  res.setHeader("Content-Type", "text/xml");
  res.write(sitemap.trim());
  res.end();

  return { props: {} };

};

export default function SiteMap() {
  // Purely a server-side route
  return null;
}