// /types/content.ts
export type ResourceLink = { label: string; href: string };

export type EventResources = {
  downloads: string[] | null;
  reads: string[] | null;
};

export type EventMeta = {
  slug: string;
  title: string | null;
  date: string | null;
  endDate?: string | null;
  location: string | null;
  summary: string | null;
  tags: string[] | null;
  heroImage?: string | null;
  resources?: EventResources | null;
};

export type DownloadItem = {
  slug: string;
  title: string;
  excerpt: string | null;
  coverImage: string | null;
  href: string; // canonical route to detail page, e.g. `/downloads/slug`
  fileHref: string | null; // direct file URL if present
  size?: string | null;
  modified?: string | null; // ISO, optional
};
