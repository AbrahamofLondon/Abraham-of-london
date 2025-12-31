// components/Cards/utils.ts

// =============================================================================
// FALLBACK CONFIG
// =============================================================================

export function getCardFallbackConfig() {
  return {
    defaultImage: "/assets/images/writing-desk.webp",
    defaultTitle: "Untitled",
    defaultDescription: "No description available yet.",
    defaultTags: [] as string[],
    defaultAuthor: "Abraham of London",
    defaultAvatar: "/assets/images/profile-portrait.webp",
    defaultBookImage: "/assets/images/default-book.jpg",
  };
}

// =============================================================================
// IMAGE UTILITIES
// =============================================================================

export function getCardImage(
  image: string | null | undefined,
  fallback?: string,
): string {
  if (!image) return fallback || getCardFallbackConfig().defaultImage;
  return image;
}

export function getCardImageAlt(title: string, type?: string): string {
  return type ? `${type} cover: ${title}` : `Cover image for ${title}`;
}

// =============================================================================
// DATE & TIME UTILITIES
// =============================================================================

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

export function formatShortDate(dateString: string | null | undefined): string {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";
    return date.toLocaleDateString("en-GB", {
      year: "numeric",
      month: "short",
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

// =============================================================================
// AUTHOR UTILITIES
// =============================================================================

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

export function getAuthorInitials(name: string): string {
  if (!name) return "U";
  const parts = name.split(" ");
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (
    parts[0].charAt(0) + parts[parts.length - 1].charAt(0)
  ).toUpperCase();
}

// =============================================================================
// ACCESSIBILITY UTILITIES
// =============================================================================

export function getCardAriaLabel(title: string, type?: string): string {
  return type ? `${type}: ${title}` : title;
}

export function getCardAriaDescription(
  excerpt?: string | null,
  description?: string | null,
): string | undefined {
  return excerpt || description || undefined;
}

export function getCardRole(
  type: "link" | "button" | "article" = "article",
): string {
  return type;
}

// =============================================================================
// ACCESS CONTROL UTILITIES (ROBUST)
// =============================================================================

export type NormalizedAccessLevel =
  | "public"
  | "inner-circle"
  | "premium"
  | "private"
  | "unknown";

export function normalizeAccessLevel(accessLevel?: string | null): NormalizedAccessLevel {
  if (!accessLevel) return "public";
  const v = String(accessLevel).trim().toLowerCase();

  if (v === "public" || v === "free") return "public";
  if (v === "inner-circle" || v === "innercircle" || v === "inner") return "inner-circle";
  if (v === "premium" || v === "paid" || v === "pro") return "premium";
  if (v === "private" || v === "restricted") return "private";

  return "unknown";
}

export function isContentLocked(accessLevel?: string | null): boolean {
  const level = normalizeAccessLevel(accessLevel);
  return level === "inner-circle" || level === "premium" || level === "private";
}

export function getAccessLevelBadge(accessLevel?: string | null): {
  text: string;
  color: string;
  bgColor: string;
  borderColor: string;
} {
  const level = normalizeAccessLevel(accessLevel);

  switch (level) {
    case "inner-circle":
      return {
        text: "Inner Circle",
        color: "text-amber-400/90",
        bgColor: "bg-amber-900/30",
        borderColor: "border-amber-700/40",
      };
    case "premium":
      return {
        text: "Premium",
        color: "text-purple-400/90",
        bgColor: "bg-purple-900/30",
        borderColor: "border-purple-700/40",
      };
    case "private":
      return {
        text: "Private",
        color: "text-red-300/90",
        bgColor: "bg-red-900/20",
        borderColor: "border-red-700/40",
      };
    case "unknown":
      return {
        text: "Restricted",
        color: "text-rose-300/90",
        bgColor: "bg-rose-900/20",
        borderColor: "border-rose-700/40",
      };
    default:
      return {
        text: "Free",
        color: "text-emerald-400/90",
        bgColor: "bg-emerald-900/30",
        borderColor: "border-emerald-700/40",
      };
  }
}

// =============================================================================
// TAG UTILITIES
// =============================================================================

export function truncateTags(tags: string[] = [], maxCount = 3): string[] {
  return tags.slice(0, maxCount);
}

export function formatTagText(tag: string): string {
  return tag.charAt(0).toUpperCase() + tag.slice(1).toLowerCase();
}

// =============================================================================
// TEXT UTILITIES
// =============================================================================

export function getDisplayText(
  excerpt?: string | null,
  description?: string | null,
  subtitle?: string | null,
): string {
  return excerpt || description || subtitle || "";
}

export function truncateText(text: string, maxLength = 150): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + "...";
}

// =============================================================================
// STYLE CONSTANTS
// =============================================================================

export const CARD_COLORS = {
  primary: "text-cream hover:text-softGold",
  secondary: "text-gray-300 hover:text-gray-100",
  accent: "text-softGold hover:text-amber-300",
  muted: "text-gray-400 hover:text-gray-300",
  danger: "text-red-400 hover:text-red-300",
  success: "text-emerald-400 hover:text-emerald-300",
} as const;

export const CARD_SIZES = {
  sm: "text-sm p-4",
  md: "text-base p-5",
  lg: "text-lg p-6",
  xl: "text-xl p-7",
} as const;

export const CARD_ANIMATIONS = {
  hover: "transition-all duration-300 hover:-translate-y-1",
  hoverScale: "transition-all duration-300 hover:scale-[1.02]",
  focus:
    "focus:outline-none focus:ring-2 focus:ring-softGold/50 focus:ring-offset-1 focus:ring-offset-black",
  active: "active:scale-[0.98]",
} as const;

export const CARD_SHADOWS = {
  default: "shadow-lg",
  hover: "hover:shadow-xl hover:shadow-softGold/10",
  glow: "shadow-[0_8px_30px_rgba(226,197,120,0.15)]",
  deep: "shadow-[0_20px_60px_rgba(226,197,120,0.2)]",
} as const;

export const CARD_BORDERS = {
  default: "border border-white/10",
  hover: "hover:border-softGold/30",
  accent: "border-softGold/20",
  muted: "border-gray-800",
} as const;

export const CARD_BACKGROUNDS = {
  default: "bg-black/40 backdrop-blur-sm",
  dark: "bg-gray-900/60 backdrop-blur-md",
  gradient: "bg-gradient-to-br from-black/60 via-[#020617]/80 to-black/60",
  light: "bg-white/5 backdrop-blur-sm",
} as const;

// =============================================================================
// CARD TYPE DETECTION
// =============================================================================

export type CardType =
  | "book"
  | "blog"
  | "canon"
  | "article"
  | "resource"
  | "unknown";

export function detectCardType(props: any): CardType {
  if (props.isbn || props.author) return "book";
  if (props.canon) return "canon";
  if (props.readTime || props.category) return "blog";
  if (props.featured && props.coverImage) return "article";
  if (props.resourceType) return "resource";
  return "unknown";
}

export function getCardIcon(type: CardType): string {
  switch (type) {
    case "book":
      return "📚";
    case "blog":
      return "✍️";
    case "canon":
      return "📜";
    case "article":
      return "📄";
    case "resource":
      return "📎";
    default:
      return "📋";
  }
}
