// lib/seo.ts
import { absUrl } from "./siteConfig";
import type { Post } from "@/pages/index";
import type { Book } from "@/pages/index";

type BuildArgs = {
  siteConfig: {
    title: string;
    author: string;
    description: string;
  };
  posts: Post[];
  books: Book[];
  sameAsLinks: string[];
  baseUrl: string;
  assets: { logo: string; portrait: string };
};

export function buildWebsiteSchema(args: BuildArgs) {
  const { siteConfig, baseUrl } = args;
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.title,
    alternateName: `${siteConfig.author} - Official Website`,
    description: siteConfig.description,
    url: baseUrl,
    inLanguage: "en-GB",
    author: { "@type": "Person", name: siteConfig.author, url: baseUrl },
    publisher: { "@type": "Person", name: siteConfig.author, url: baseUrl },
  };
}

export function buildOrganizationSchema(args: BuildArgs) {
  const { siteConfig, baseUrl, assets, sameAsLinks } = args;
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${baseUrl}#organization`,
    name: siteConfig.title,
    url: baseUrl,
    logo: { "@type": "ImageObject", url: absUrl(assets.logo), width: 512, height: 512 },
    image: { "@type": "ImageObject", url: assets.portrait, width: 400, height: 400 },
    sameAs: sameAsLinks,
    address: { "@type": "PostalAddress", addressLocality: "London", addressCountry: "GB" },
  };
}

export function buildPostSchemas(args: BuildArgs) {
  const { posts, siteConfig, assets } = args;
  return posts.map((p) => ({
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: p.title,
    image: absUrl(p.coverImage),
    datePublished: p.date,
    dateModified: p.date,
    author: { "@type": "Person", name: p.author },
    publisher: {
      "@type": "Organization",
      name: siteConfig.title,
      logo: { "@type": "ImageObject", url: absUrl(assets.logo) },
    },
    description: p.excerpt,
    mainEntityOfPage: { "@type": "WebPage", "@id": absUrl(`/blog/${p.slug}`) },
  }));
}

export function buildBookSchemas(args: BuildArgs) {
  const { books, siteConfig } = args;
  return books.map((b) => ({
    "@context": "https://schema.org",
    "@type": "Book",
    name: b.title,
    author: { "@type": "Person", name: b.author },
    bookFormat: "https://schema.org/EBook",
    image: absUrl(b.coverImage),
    publisher: siteConfig.title,
    description: b.excerpt,
    inLanguage: "en-GB",
    url: absUrl(`/books/${b.slug}`),
    offers: { "@type": "Offer", url: b.buyLink },
  }));
}

/** Returns an array of JSON-LD blocks for the home page. */
export function buildHomeStructuredData(args: BuildArgs) {
  return [
    buildWebsiteSchema(args),
    buildOrganizationSchema(args),
    ...buildPostSchemas(args),
    ...buildBookSchemas(args),
  ];
}
