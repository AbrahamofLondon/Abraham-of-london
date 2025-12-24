// types/ambient.d.ts

// ------------------------
// siteConfig augmentation
// ------------------------
declare module "@/lib/siteConfig" {
  export type SocialLink = { label: string; href: string; external?: boolean };

  export type SiteConfig = {
    siteUrl: string;
    title?: string;
    email?: string;
    author?: string;
    authorImage?: string; // <- for BlogPostCard fallback
    ogImage?: string;
    twitterImage?: string;
    socialLinks?: SocialLink[];
  };

  export const siteConfig: SiteConfig;
  export function absUrl(path: string): string;
  export function getPageTitle(pageTitle?: string): string;
}

// ------------------------
// Theme context (runtime module present at "@/lib/ThemeContext.tsx")
// ------------------------
declare module "@/lib/ThemeContext.tsx" {
  import * as React from "react";

  export type ThemeName = "light" | "dark";
  export function useTheme(): {
    theme: ThemeName;
    setTheme(t: ThemeName): void;
  };

  export const ThemeProvider: React.FC<
    React.PropsWithChildren<Record<string, never>>
  >;
  const _default: any;
  export default _default;
}

// ------------------------
// GA helpers
// ------------------------
declare module "@/lib/gtag.ts" {
  export const GA_TRACKING_ID: string;
  export function pageview(url: string): void;
  export function event(opts: {
    action: string;
    category?: string;
    label?: string;
    value?: number;
  }): void;
  const _default: any;
  export default _default;
}

// ------------------------
// Hooks
// ------------------------
declare module "@/lib/hooks/useDebounce.ts" {
  export default function useDebounce<T>(value: T, delay?: number): T;
}

// ------------------------
// Contentlayer generated types passthrough
// ------------------------

// ------------------------
// Lightweight component stubs used in MDX routes (resolved at build time)
// ------------------------
declare module "@/components/events/ChathamBadge.tsx" {
  const C: React.ComponentType<any>;
  export default C;
}
declare module "@/components/events/EventMeta.tsx" {
  const C: React.ComponentType<any>;
  export default C;
}

// ------------------------
// Event meta used in various places
// ------------------------
declare module "@/types/event.ts" {
  export type EventMeta = {
    slug: string;
    title?: string;
    date?: string;
    endDate?: string;
    location?: string | null;
    summary?: string | null;
    tags?: string[] | null;
    chatham?: boolean;
  };
}
