// types/linkitem-augment.d.ts

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/consistent-type-definitions */

declare global {
  /**
   * Augmented LinkItem interface for enhanced navigation
   * Extends basic link properties with additional metadata and functionality
   */
  interface LinkItem {
    // Core link properties
    href: string;
    label: string;

    // Enhanced metadata
    sub?: string; // Subtitle or description
    external?: boolean; // External link indicator
    icon?: string; // Icon name or component
    badge?: string; // Badge text (e.g., "New", "Updated")
    badgeVariant?:
      | "default"
      | "secondary"
      | "destructive"
      | "outline"
      | "success";

    // Navigation & UX
    disabled?: boolean; // Whether the link is disabled
    prefetch?: boolean; // Prefetch behavior
    scroll?: boolean; // Smooth scroll behavior

    // Visual & Theming
    variant?: "default" | "ghost" | "outline" | "secondary";
    size?: "sm" | "md" | "lg";
    className?: string; // Additional CSS classes

    // Organization & Structure
    group?: string; // Group/category for organization
    priority?: number; // Sort priority (lower = higher priority)
    children?: LinkItem[]; // Nested links for dropdowns

    // SEO & Analytics
    rel?: string; // Link relation
    title?: string; // Title attribute
    analyticsEvent?: string; // Analytics event name

    // Accessbility
    ariaLabel?: string; // ARIA label for accessibility
    role?: string; // ARIA role

    // State & Conditional
    condition?: () => boolean; // Conditional rendering
    authenticated?: boolean; // Auth requirement

    // Legacy/compatibility
    [key: string]: unknown; // Allow additional properties
  }

  /**
   * Augmented navigation group interface
   */
  interface NavGroup {
    title?: string;
    items: LinkItem[];
    collapsible?: boolean;
    defaultOpen?: boolean;
  }

  /**
   * Augmented navigation configuration
   */
  interface NavConfig {
    main: LinkItem[];
    sidebar?: NavGroup[];
    footer: {
      navigation: LinkItem[];
      social?: LinkItem[];
      legal?: LinkItem[];
    };
  }

  /**
   * Breadcrumb item extension
   */
  interface BreadcrumbItem extends LinkItem {
    current?: boolean;
    hide?: boolean;
  }

  /**
   * Pagination link extension
   */
  interface PaginationLink extends LinkItem {
    active?: boolean;
    gap?: boolean;
  }

  /**
   * Social link extension
   */
  interface SocialLink extends LinkItem {
    platform: string;
    handle?: string;
    shareUrl?: string;
  }

  /**
   * Enhanced window interface for navigation utilities
   */
  interface Window {
    __NAVIGATION?: {
      currentPath: string;
      previousPath: string;
      history: string[];
      trackNavigation?: (from: string, to: string) => void;
    };
  }
}

// Utility types for link operations
type LinkItemKeys = keyof LinkItem;

type PartialLinkItem = Partial<LinkItem> & {
  href: string;
  label: string;
};

type LinkItemWithoutChildren = Omit<LinkItem, "children">;

type ExternalLinkItem = LinkItem & {
  external: true;
  rel?: "noopener noreferrer";
};

type InternalLinkItem = LinkItem & {
  external?: false;
  prefetch?: true;
};

// Conditional type helpers
type LinkItemWithSub<T extends LinkItem> = T & {
  sub: string;
};

type LinkItemWithIcon<T extends LinkItem> = T & {
  icon: string;
};

type LinkItemWithBadge<T extends LinkItem> = T & {
  badge: string;
  badgeVariant?: NonNullable<LinkItem["badgeVariant"]>;
};

// This export is required for global type modifications
export {};