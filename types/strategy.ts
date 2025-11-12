<<<<<<< HEAD
export interface Strategy {
  slug: string;
  title: string;
  description?: string;
  ogDescription?: string;
  author?: string;
  date?: string;
  body?: { code: string };
}
=======
export interface StrategyMeta {
  slug: string;
  title: string;
  type: string;
  description?: string;
  ogTitle?: string;
  ogDescription?: string;
  socialCaption?: string;
  date?: string;
  author?: string;
  excerpt?: string;
  readTime?: string;
  category?: string;
  tags?: string[];
  coverImage?: string;
  coverAspect?: string;
  coverFit?: string;
  coverPosition?: string;
  draft?: boolean;
}
>>>>>>> test-netlify-fix
