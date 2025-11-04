// Allow importing your siteConfig with richer fields
declare module "@/lib/siteConfig" {
  export type SocialLink = { label: string; href: string };
  export type SiteConfig = {
    siteUrl: string;
    title?: string;
    email?: string;
    author?: string;
    authorImage?: string;
    ogImage?: string;
    twitterImage?: string;
    socialLinks?: SocialLink[];
  };
  export const siteConfig: SiteConfig;
  export function absUrl(path: string): string;
  // Any other exports stay as-is; this augments types only.
}

// Mark these as modules for TS typing (uses whatever the runtime files export)
declare module "@/lib/ThemeContext.tsx" {
  import * as React from "react";
  export const ThemeProvider: React.FC<React.PropsWithChildren<{}>>;
  export function useTheme(): { theme: "light" | "dark"; setTheme(t: "light" | "dark"): void };
  const _default: any;
  export default _default;
}

declare module "@/lib/gtag.ts" {
  export const GA_TRACKING_ID: string;
  export function pageview(url: string): void;
  export function event(opts: { action: string; category?: string; label?: string; value?: number }): void;
  const _default: any;
  export default _default;
}

declare module "@/lib/hooks/useDebounce.ts" {
  export default function useDebounce<T>(value: T, delay?: number): T;
}

declare module "contentlayer/generated" {
  // Wire TypeScript to your generated runtime at .contentlayer/generated/index.ts
  export * from "../../.contentlayer/generated/index";
}

declare module "@/components/events/ChathamBadge.tsx" { const C: any; export default C; }
declare module "@/components/events/EventMeta.tsx" { const C: any; export default C; }

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

// MDXComponents casing aliases will import actual component at build time
