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