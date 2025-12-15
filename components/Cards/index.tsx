// components/Cards/index.tsx
import * as React from "react";

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

// Define PostLike interface here
export interface PostLike {
  slug: string;
  title: string;
  subtitle?: string | null;
  excerpt?: string | null;
  description?: string | null;
  coverImage?: string | null;
  date?: string | null;
  tags?: string[];
  featured?: boolean;
  accessLevel?: string | null;
  lockMessage?: string | null;
  category?: string | null;
  readingTime?: string | null;
  isNew?: boolean;
  href?: string;
  author?: string | null;
  authorPicture?: string | null;
  volumeNumber?: string | null;
  downloadUrl?: string | null;
  fileSize?: string | null;
  price?: string | null;
  dimensions?: string | null;
  type?: string;
}

// =============================================================================
// COMPONENT EXPORTS
// =============================================================================

export { default as BaseCard } from "./BaseCard";
export { default as BookCard } from "./BookCard";
export { default as BlogPostCard } from "./BlogPostCard";
export { default as CanonResourceCard } from "./CanonResourceCard";
export { default as ArticleHero } from "./ArticleHero";
export { DocumentCard } from "./BaseCard";

// =============================================================================
// TYPE EXPORTS - FIXED
// =============================================================================

// Export PostLike (defined above) and other types from components
export type { 
  BaseCardProps,
  DocumentCardProps,
} from "./BaseCard";

export type { 
  BookCardProps 
} from "./BookCard";

export type { 
  BlogPostCardProps 
} from "./BlogPostCard";

export type { 
  CanonCardProps 
} from "./CanonResourceCard";

export type { 
  HeroCardProps 
} from "./ArticleHero";

// =============================================================================
// STYLE CONSTANTS
// =============================================================================

export const CARD_SIZES = {
  sm: "text-sm p-4",
  md: "text-base p-5",
  lg: "text-lg p-6",
  xl: "text-xl p-7",
} as const;

export const CARD_COLORS = {
  primary: "text-cream hover:text-softGold",
  secondary: "text-gray-300 hover:text-gray-100",
  accent: "text-softGold hover:text-amber-300",
  muted: "text-gray-400 hover:text-gray-300",
} as const;

export const CARD_ANIMATIONS = {
  hover: "transition-all duration-300 hover:-translate-y-1",
  focus:
    "focus:outline-none focus:ring-2 focus:ring-softGold/50 focus:ring-offset-1 focus:ring-offset-black",
  active: "active:scale-[0.98]",
} as const;

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

export function getCardFallbackConfig() {
  return {
    defaultImage: "/assets/images/writing-desk.webp",
    defaultTitle: "Untitled",
    defaultDescription: "No description available yet.",
    defaultTags: [] as string[],
    defaultAuthor: "Abraham of London",
    defaultAvatar: "/assets/images/profile-portrait.webp",
  };
}

export function getCardImage(
  image: string | null | undefined,
  fallback?: string,
): string {
  if (!image) return fallback || getCardFallbackConfig().defaultImage;
  return image;
}

export function formatCardDate(dateString: string | null | undefined): string {
  if (!dateString) return "";

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";
    return date.toLocaleDateString("en-GB", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

export function formatReadTime(wordCount: number | null | undefined): string {
  if (!wordCount || wordCount <= 0) return "";
  const minutes = Math.ceil(wordCount / 200);
  return `${minutes} min read`;
}

export function getAuthorName(author: unknown): string {
  if (!author) return getCardFallbackConfig().defaultAuthor;
  if (typeof author === "string") return author;
  if (typeof author === "object" && author !== null) {
    const authorObj = author as Record<string, unknown>;
    return String(
      authorObj.name ||
        authorObj.displayName ||
        getCardFallbackConfig().defaultAuthor,
    );
  }
  return getCardFallbackConfig().defaultAuthor;
}

export function getAuthorPicture(author: unknown): string {
  if (!author) return getCardFallbackConfig().defaultAvatar;
  if (typeof author === "object" && author !== null) {
    const authorObj = author as Record<string, unknown>;
    const picture = authorObj.picture || authorObj.avatar || authorObj.image;
    if (typeof picture === "string") return picture;
  }
  return getCardFallbackConfig().defaultAvatar;
}

export function getCardAriaLabel(title: string, type?: string): string {
  return type ? `${type}: ${title}` : title;
}

export function getCardAriaDescription(
  excerpt?: string | null,
  description?: string | null,
): string | undefined {
  return excerpt || description || undefined;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Creates a card class name string from various style options
 */
export function createCardClassName(
  baseClassName: string = "",
  options: {
    size?: keyof typeof CARD_SIZES;
    border?: boolean;
    shadow?: boolean;
    hover?: boolean;
  } = {},
): string {
  const { size = "md", border = true, shadow = true, hover = true } = options;

  const classes = [baseClassName, CARD_SIZES[size]];

  if (hover) {
    classes.push(
      CARD_ANIMATIONS.hover,
      CARD_ANIMATIONS.focus,
      CARD_ANIMATIONS.active,
    );
  }

  if (border) {
    classes.push("border border-white/10");
    if (hover) classes.push("hover:border-softGold/30");
  }

  if (shadow) {
    classes.push("shadow-lg");
    if (hover) classes.push("hover:shadow-xl hover:shadow-softGold/10");
  }

  if (hover) {
    classes.push("transition-all duration-300 hover:scale-[1.02]");
  }

  return classes.filter(Boolean).join(" ");
}

/**
 * Render card tags with proper formatting
 */
export function renderCardTags(
  tags: string[] = [],
  maxCount: number = 3,
): React.ReactNode {
  const displayTags = tags.slice(0, maxCount);

  return (
    <div className="flex flex-wrap gap-2">
      {displayTags.map((tag, idx) => (
        <span
          key={idx}
          className="rounded-full border border-softGold/20 bg-softGold/10 px-3 py-1 text-xs font-medium text-softGold/90"
        >
          {tag.charAt(0).toUpperCase() + tag.slice(1).toLowerCase()}
        </span>
      ))}
    </div>
  );
}

/**
 * Render card date with proper formatting
 */
export function renderCardDate(
  dateString?: string | null,
): React.ReactNode | null {
  if (!dateString) return null;

  return (
    <time className="text-xs text-gray-400">
      {(() => {
        try {
          const date = new Date(dateString);
          if (isNaN(date.getTime())) return "";
          return date.toLocaleDateString("en-GB", {
            year: "numeric",
            month: "long",
            day: "numeric",
          });
        } catch {
          return "";
        }
      })()}
    </time>
  );
}

// =============================================================================
// DOCUMENT CARD PROPS FUNCTION
// =============================================================================

/**
 * Get card props for any document type
 */
export function getCardPropsForDocument(doc: any): PostLike {
  // Helper function to get document href based on type
  const getDocHref = (doc: any): string => {
    const slug = doc.slug || '';
    const type = doc.type?.toLowerCase() || 'content';
    
    switch (type) {
      case 'post':
        return `/blog/${slug}`;
      case 'short':
        return `/shorts/${slug}`;
      case 'book':
        return `/books/${slug}`;
      case 'canon':
        return `/canon/${slug}`;
      case 'download':
        return `/downloads/${slug}`;
      case 'event':
        return `/events/${slug}`;
      case 'print':
        return `/prints/${slug}`;
      case 'resource':
        return `/resources/${slug}`;
      case 'strategy':
        return `/content/${slug}`;
      default:
        return `/content/${slug}`;
    }
  };

  return {
    slug: doc.slug || '',
    title: doc.title || 'Untitled',
    subtitle: doc.subtitle || null,
    excerpt: doc.excerpt || null,
    description: doc.description || null,
    coverImage: doc.coverImage || null,
    date: doc.date || null,
    tags: Array.isArray(doc.tags) ? doc.tags : [],
    featured: Boolean(doc.featured),
    accessLevel: doc.accessLevel || null,
    lockMessage: doc.lockMessage || null,
    category: doc.category || null,
    readingTime: doc.readTime || doc.readingTime || null,
    href: doc.url || getDocHref(doc),
    author: doc.author || null,
    volumeNumber: doc.volumeNumber || null,
    downloadUrl: doc.downloadUrl || doc.fileUrl || null,
    fileSize: doc.fileSize || null,
    price: doc.price || null,
    dimensions: doc.dimensions || null,
    type: doc.type || null,
  };
}