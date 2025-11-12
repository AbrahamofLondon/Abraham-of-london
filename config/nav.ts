// config/nav.ts
// Primary and footer navigation with strong typing and small utilities.

export interface NavItem {
  title: string;
  href: string;
  external?: boolean;
  priority?: number;
  icon?: string; // optional lucide icon name or path
  children?: NavItem[];
}

export interface NavConfig {
  main: NavItem[];
  footer: NavItem[];
  utility?: NavItem[];
}

const isExternal = (href: string) =>
  /^https?:\/\//i.test(href) || href.startsWith("mailto:") || href.startsWith("tel:");

/** Normalize externals & sort by priority (asc) */
function normalize(items: NavItem[]): NavItem[] {
  return items
    .map((i) => ({
      ...i,
      external: typeof i.external === "boolean" ? i.external : isExternal(i.href),
      children: i.children ? normalize(i.children) : undefined,
    }))
    .sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999));
}

export const nav: NavConfig = {
  main: normalize([
    { title: "Home", href: "/", priority: 1 },
    { title: "Writing", href: "/blog", priority: 2 },
    { title: "Books", href: "/books", priority: 3 },
    { title: "Downloads", href: "/downloads", priority: 4 },
    { title: "Print", href: "/print", priority: 5 },
    { title: "About", href: "/about", priority: 6 },
    { title: "Contact", href: "/contact", priority: 7 },
  ]),

  footer: normalize([
    { title: "Privacy", href: "/privacy", priority: 1 },
    { title: "Terms", href: "/terms", priority: 2 },
    { title: "Sitemap", href: "/sitemap", priority: 3 },
    {
      title: "LinkedIn",
      href: "https://www.linkedin.com/in/abraham-adaramola-06630321/",
      priority: 10,
    },
  ]),

  utility: normalize([
    { title: "Search", href: "/search", priority: 1, icon: "Search" },
    { title: "Subscribe", href: "/newsletter", priority: 2, icon: "Mail" },
  ]),
};

// Selectors
export const mainNav = () => nav.main;
export const footerNav = () => nav.footer;
export const utilityNav = () => nav.utility ?? [];