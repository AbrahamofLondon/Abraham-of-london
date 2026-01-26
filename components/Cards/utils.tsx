// components/Cards/utils.ts

import React from 'react';
import { safeFirstChar, safeSlice, safeCapitalize } from "@/lib/utils/safe";


// =============================================================================
// TYPES
// =============================================================================

export type NormalizedAccessLevel =
  | "public"
  | "inner-circle"
  | "premium"
  | "private"
  | "unknown";

export type CardType =
  | "book"
  | "blog"
  | "canon"
  | "article"
  | "resource"
  | "unknown";

export type GradientPair = [string, string];
export type CardSize = 'small' | 'medium' | 'large';
export type CardVariant = 'default' | 'elevated' | 'outlined' | 'glass';

export interface AuthorBadge {
  text: string;
  icon: string;
  color: string;
  bgColor: string;
  className: string;
}

export interface AuthorDisplayOptions {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'elegant' | 'minimal' | 'ornate';
  showAvatar?: boolean;
  showName?: boolean;
  showRole?: boolean;
  showDivider?: boolean;
}

export interface AuthorDisplayResult {
  initials: string;
  avatarUrl: string;
  displayName: string;
  formattedName: string;
  gradient: string;
  shadow: string;
  fontSize: string;
  padding: string;
  border: string;
}

export interface CardConfig {
  size?: CardSize;
  variant?: CardVariant;
  gradient?: GradientPair;
  borderRadius?: number;
  padding?: number;
  shadow?: string;
}

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
// GRADIENT UTILITIES
// =============================================================================

/**
 * Generates a deterministic gradient pair based on a string input
 */
export function getGradientPair(input: string = ''): GradientPair {
  // Default gradient pair
  const defaultPair: GradientPair = ['#1a1a2e', '#16213e'];
  
  // If no input, return default
  if (!input.trim()) {
    return defaultPair;
  }
  
  // Create hash from input
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = input.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Array of luxury gradient pairs
  const gradientPairs: GradientPair[] = [
    // Gold & Charcoal gradients
    ['#d6b26a', '#15171c'], // Primary gold to charcoal
    ['#a8925e', '#0b0d10'], // Dark gold to deep charcoal
    ['#f2e0b0', '#1a1a2e'], // Light gold to navy
    
    // Earthy & Luxury gradients
    ['#0e3b33', '#15171c'], // Forest to charcoal
    ['#2c5530', '#1a1a2e'], // Deep green to navy
    ['#5d432c', '#2d2424'], // Brown to dark brown
    
    // Neutral & Modern gradients
    ['#4a5568', '#1a202c'], // Gray to dark gray
    ['#718096', '#2d3748'], // Light gray to gray
    ['#a0aec0', '#4a5568'], // Lighter gray to medium gray
    
    // Accent gradients
    ['#805ad5', '#553c9a'], // Purple to dark purple
    ['#d53f8c', '#97266d'], // Pink to dark pink
    ['#3182ce', '#2c5282'], // Blue to dark blue
    
    // Warm gradients
    ['#dd6b20', '#c05621'], // Orange to dark orange
    ['#e53e3e', '#c53030'], // Red to dark red
    ['#38a169', '#276749'], // Green to dark green
  ];
  
  // Ensure hash is positive for modulo operation
  const positiveHash = Math.abs(hash);
  const index = positiveHash % gradientPairs.length;
  
  // Return the gradient pair - guaranteed to exist since index is valid
  return gradientPairs[index]!;
}

/**
 * Creates a CSS gradient string from two colors
 */
export function createGradientCSS(color1: string, color2: string): string {
  return `linear-gradient(135deg, ${color1} 0%, ${color2} 100%)`;
}

/**
 * Generates a deterministic gradient CSS based on input
 */
export function getGradientCSS(input: string = ''): string {
  const [color1, color2] = getGradientPair(input);
  return createGradientCSS(color1, color2);
}

// =============================================================================
// AUTHOR UTILITIES
// =============================================================================

/**
 * Generate premium color gradient based on author name
 */
export function getAuthorGradient(name: string): string {
  if (!name) return "from-softGold to-amber-300";
  
  // Create a consistent color based on name hash
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const gradientPairs = [
    "from-softGold to-amber-300", // Gold/Amber
    "from-blue-400 to-cyan-300", // Blue/Cyan
    "from-purple-500 to-pink-400", // Purple/Pink
    "from-emerald-500 to-teal-300", // Green/Teal
    "from-rose-500 to-orange-300", // Rose/Orange
    "from-indigo-500 to-violet-300", // Indigo/Violet
  ];
  
  const positiveHash = Math.abs(hash);
  const index = positiveHash % gradientPairs.length;
  
  // Return the gradient at index, guaranteed to exist
  return gradientPairs[index]!;
}

/**
 * Gets the initials from a name
 */
export function getAuthorInitials(name: string): string {
  if (!name || !name.trim()) return '??';
  
  const parts = name.trim().split(/\s+/).filter(p => p.length > 0);
  
  if (parts.length === 0) return '??';
  
  if (parts.length === 1) {
    // Single word - take first two characters
    const firstPart = parts[0];
    if (!firstPart || firstPart.length === 0) return '??';
    return safeSlice(firstPart, 0, 2).toUpperCase();
  }
  
  // Multiple words - take first letter of first two words
  const first = parts[0];
  const second = parts[1];
  
  if (!first || !second || first.length === 0 || second.length === 0) return '??';
  
  const firstChar = safeFirstChar(first);
  const secondChar = safeFirstChar(second);
  
  return (firstChar + secondChar).toUpperCase();
}

/**
 * Premium author name formatting with title case and smart truncation
 */
export function formatAuthorName(
  name: string, 
  variant: 'full' | 'short' | 'initials' = 'full'
): string {
  if (!name || !name.trim()) return "Abraham of London";
  
  const parts = name.split(" ").filter(part => part.trim() !== "");
  
  if (parts.length === 0) return "Abraham of London";
  
  switch (variant) {
    case 'initials':
      return getAuthorInitials(name);
      
    case 'short':
      if (parts.length <= 2) return name;
      const first = parts[0];
      const last = parts[parts.length - 1];
      if (!first || !last) return name;
      return `${first} ${last}`;
      
    case 'full':
    default:
      // Title case for premium appearance
      return parts
        .map(part => {
          if (!part || part.length === 0) return '';
          return safeCapitalize(part);
        })
        .filter(p => p.length > 0)
        .join(" ");
  }
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

/**
 * Premium author avatar generation with gradient backgrounds
 */
export function getAuthorAvatar(
  author: unknown,
  size: number = 40
): {
  url: string;
  initials: string;
  gradient: string;
  shadow: string;
  className: string;
} {
  const name = getAuthorName(author);
  const picture = getAuthorPicture(author);
  const initials = getAuthorInitials(name);
  const gradient = getAuthorGradient(name);
  
  const sizeClasses: Record<number, string> = {
    24: "h-6 w-6 text-xs",
    32: "h-8 w-8 text-sm",
    40: "h-10 w-10 text-base",
    48: "h-12 w-12 text-lg",
    56: "h-14 w-14 text-xl",
    64: "h-16 w-16 text-2xl",
  };
  
  const sizeClass = sizeClasses[size] || sizeClasses[40]!;
  
  return {
    url: picture,
    initials,
    gradient,
    shadow: "shadow-[0_4px_20px_rgba(0,0,0,0.3)]",
    className: `rounded-full ${sizeClass} flex items-center justify-center font-semibold text-white bg-gradient-to-br ${gradient} border-2 border-white/20`,
  };
}

/**
 * Complete premium author display component configuration
 */
export function getPremiumAuthorDisplay(
  author: unknown,
  options: AuthorDisplayOptions = {}
): AuthorDisplayResult {
  const {
    size = 'md',
    variant = 'elegant',
  } = options;
  
  const name = getAuthorName(author);
  const picture = getAuthorPicture(author);
  const initials = getAuthorInitials(name);
  const gradient = getAuthorGradient(name);
  const formattedName = formatAuthorName(name, 'full');
  
  // Size configurations
  const sizeConfigs: Record<string, { fontSize: string; padding: string; avatarSize: number }> = {
    sm: {
      fontSize: "text-xs",
      padding: "px-2 py-1",
      avatarSize: 24,
    },
    md: {
      fontSize: "text-sm",
      padding: "px-3 py-1.5",
      avatarSize: 32,
    },
    lg: {
      fontSize: "text-base",
      padding: "px-4 py-2",
      avatarSize: 40,
    },
    xl: {
      fontSize: "text-lg",
      padding: "px-5 py-2.5",
      avatarSize: 48,
    },
  };
  
  // Variant configurations
  const variantConfigs: Record<string, { shadow: string; border: string; bg: string }> = {
    default: {
      shadow: "shadow-sm",
      border: "border border-white/10",
      bg: "bg-white/5",
    },
    elegant: {
      shadow: "shadow-[0_8px_30px_rgba(0,0,0,0.25)]",
      border: "border border-white/20",
      bg: "bg-gradient-to-br from-white/5 to-white/10",
    },
    minimal: {
      shadow: "",
      border: "",
      bg: "",
    },
    ornate: {
      shadow: "shadow-[0_12px_40px_rgba(212,175,55,0.15)]",
      border: "border border-softGold/30",
      bg: "bg-gradient-to-br from-black/40 to-black/60",
    },
  };
  
  const sizeCfg = sizeConfigs[size]!;
  const variantCfg = variantConfigs[variant]!;
  
  return {
    initials,
    avatarUrl: picture,
    displayName: formattedName,
    formattedName,
    gradient,
    shadow: variantCfg.shadow,
    fontSize: sizeCfg.fontSize,
    padding: sizeCfg.padding,
    border: variantCfg.border,
  };
}

/**
 * Premium author byline with sophisticated typography
 */
export function getPremiumByline(
  author: unknown,
  date?: string | null,
  readTime?: string | null
): {
  html: string;
  className: string;
  elements: {
    author: string;
    date: string;
    readTime: string;
    divider: string;
  };
} {
  const name = getAuthorName(author);
  const formattedDate = date ? formatCardDate(date) : "";
  const formattedReadTime = readTime || "";
  
  const elements: string[] = [];
  if (name) elements.push(`<span class="font-semibold text-softGold">${name}</span>`);
  if (formattedDate) elements.push(`<time class="text-gray-400">${formattedDate}</time>`);
  if (formattedReadTime) elements.push(`<span class="text-gray-500 italic">${formattedReadTime}</span>`);
  
  const divider = `<span class="mx-2 text-gray-600">•</span>`;
  const html = elements.join(divider);
  
  return {
    html,
    className: "text-sm leading-relaxed",
    elements: {
      author: name,
      date: formattedDate,
      readTime: formattedReadTime,
      divider: "•",
    },
  };
}

/**
 * Premium author badge for verified/featured authors
 */
export function getAuthorBadge(author: unknown): AuthorBadge | null {
  const name = getAuthorName(author);
  
  // Special badges for specific authors
  if (name.includes("Abraham") || name.includes("of London")) {
    return {
      text: "Founder",
      icon: "👑",
      color: "text-amber-300",
      bgColor: "bg-amber-900/30",
      className: "border border-amber-700/40",
    };
  }
  
  return null;
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
// ACCESS CONTROL UTILITIES
// =============================================================================

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
  return safeSlice(tags, 0, maxCount);
}

export function formatTagText(tag: string): string {
  if (!tag || tag.length === 0) return '';
  return safeCapitalize(tag);
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
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + "...";
}

// =============================================================================
// CARD TYPE DETECTION
// =============================================================================

export function detectCardType(props: any): CardType {
  if (!props) return "unknown";
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

// =============================================================================
// ADDITIONAL UTILITY FUNCTIONS
// =============================================================================

/**
 * Formats a number as currency (GBP)
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Generates a random ID for components
 */
export function generateId(prefix: string = 'card'): string {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Clamps a number between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Capitalizes the first letter of each word
 */
export function capitalizeWords(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(' ')
    .map(word => {
      if (!word || word.length === 0) return '';
      return safeCapitalize(word);
    })
    .filter(w => w.length > 0)
    .join(' ');
}

/**
 * Validates an email address
 */
export function isValidEmail(email: string): boolean {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Generates a CSS class string from multiple classes
 */
export function classNames(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Downloads a file
 */
export function downloadFile(content: string, filename: string, type: string = 'text/plain'): void {
  if (typeof window === 'undefined') return; // SSR safety
  
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generates a unique hash for a string
 */
export function generateHash(str: string): number {
  let hash = 0;
  if (!str || str.length === 0) return hash;
  
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return Math.abs(hash);
}

// =============================================================================
// CARD CONFIGURATION
// =============================================================================

export const DEFAULT_CARD_CONFIG: CardConfig = {
  size: 'medium',
  variant: 'default',
  gradient: ['#d6b26a', '#15171c'],
  borderRadius: 16,
  padding: 24,
  shadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
};

/**
 * Gets CSS styles for a card based on configuration
 */
export function getCardStyles(config: CardConfig = {}): React.CSSProperties {
  const mergedConfig = { ...DEFAULT_CARD_CONFIG, ...config };
  
  const styles: React.CSSProperties = {
    borderRadius: mergedConfig.borderRadius,
    padding: mergedConfig.padding,
    boxShadow: mergedConfig.shadow,
  };
  
  if (mergedConfig.gradient) {
    styles.background = createGradientCSS(...mergedConfig.gradient);
  }
  
  switch (mergedConfig.variant) {
    case 'elevated':
      styles.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.4)';
      styles.transform = 'translateY(-2px)';
      break;
    case 'outlined':
      styles.border = '2px solid rgba(255, 255, 255, 0.1)';
      styles.boxShadow = 'none';
      break;
    case 'glass':
      styles.background = 'rgba(255, 255, 255, 0.05)';
      styles.backdropFilter = 'blur(10px)';
      styles.border = '1px solid rgba(255, 255, 255, 0.1)';
      break;
  }
  
  switch (mergedConfig.size) {
    case 'small':
      styles.padding = 16;
      styles.borderRadius = 12;
      break;
    case 'large':
      styles.padding = 32;
      styles.borderRadius = 24;
      break;
  }
  
  return styles;
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
