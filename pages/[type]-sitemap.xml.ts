/* eslint-disable @typescript-eslint/no-explicit-any */
import { GetServerSideProps } from 'next';
import { getAllCombinedDocs } from "@/lib/content/server";
import { normalizeSlug } from "@/lib/content/shared";

const DOMAIN = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.abrahamoflondon.org').replace(/\/+$/, '');

/**
 * Institutional Sitemap Generator
 * Resolves content via unified aggregator to prevent allDocuments import errors.
 */
function generateSiteMap(docs: any[], typeKey: string) {
  return `<?xml version="1.0" encoding="UTF-8"?>
   <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
     <url>
       <loc>${DOMAIN}/${typeKey.toLowerCase()}</loc>
       <changefreq>daily</changefreq>
       <priority>0.8</priority>
     </url>
     ${docs
       .map((doc) => {
         const slug = normalizeSlug(doc.slug || doc._raw?.flattenedPath || "");
         // Ensure pathing is correct (e.g., /blog/slug)
         const path = slug.startsWith(typeKey.toLowerCase()) ? slug : `${typeKey.toLowerCase()}/${slug}`;
         
         return `
       <url>
           <loc>${`${DOMAIN}/${path}`}</loc>
           <lastmod>${doc.date || new Date().toISOString().split('T')[0]}</lastmod>
           <changefreq>monthly</changefreq>
           <priority>0.7</priority>
       </url>
     `;
       })
       .join('')}
   </urlset>
 `;
}

export const getServerSideProps: GetServerSideProps = async ({ res, resolvedUrl }) => {
  // Determine type based on the filename (e.g., /blog-sitemap.xml -> Blog)
  const typeMatch = resolvedUrl.match(/\/([a-z-]+)-sitemap/i);
  const typeKey = typeMatch ? typeMatch[1] : 'blog';
  
  // ✅ THE FIX: Use your aggregator
  const allDocuments = getAllCombinedDocs();
  
  // Filter by Type or Kind (Institutional Authority)
  const filteredDocs = allDocuments.filter((d: any) => 
    (d.type?.toLowerCase() === typeKey.toLowerCase() || 
     d.docKind?.toLowerCase() === typeKey.toLowerCase() ||
     d.kind?.toLowerCase() === typeKey.toLowerCase()) && 
    !d.draft
  );

  const sitemap = generateSiteMap(filteredDocs, typeKey);

  res.setHeader('Content-Type', 'text/xml');
  res.write(sitemap);
  res.end();

  return { props: {} };
};

export default function SiteMap() {}