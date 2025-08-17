// lib/seo.ts

type PostLike = {
  slug?: string;
  title?: string;
  author?: string;
  coverImage?: string;
  date?: string;
  publishedAt?: string;
};

type BookLike = {
  slug?: string;
  title?: string;
  author?: string;
  coverImage?: string;
};

type BuildArgs = {
  siteUrl?: string;
  posts?: PostLike[];
  books?: BookLike[];
};

export function buildJsonLd({ siteUrl = "", posts = [], books = [] }: BuildArgs) {
  const base = (siteUrl || process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");

  const toAbs = (p?: string) => {
    const v = (p || "").trim();
    if (!v) return "";
    return /^https?:\/\//i.test(v) ? v : `${base}${v.startsWith("/") ? "" : "/"}${v}`;
  };

  const postList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: posts.map((p, i) => ({
      "@type": "BlogPosting",
      position: i + 1,
      headline: p.title || "",
      url: toAbs(`/blog/${p.slug}`),
      image: toAbs(p.coverImage || "/assets/images/blog/default-blog-cover.jpg"),
      author: { "@type": "Person", name: p.author || "Abraham of London" },
      datePublished: p.date || p.publishedAt || undefined,
    })),
  };

  const bookList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: books.map((b, i) => ({
      "@type": "Book",
      position: i + 1,
      name: b.title || "",
      url: toAbs(`/books/${b.slug}`),
      image: toAbs(b.coverImage || "/assets/images/default-book.jpg"),
      author: { "@type": "Person", name: b.author || "Abraham of London" },
    })),
  };

  return { postList, bookList };
}
