export interface Strategy {
  slug: string;
  title: string;
  description?: string;
  ogDescription?: string;
  author?: string;
  date?: string;
  body?: { code: string };
}
