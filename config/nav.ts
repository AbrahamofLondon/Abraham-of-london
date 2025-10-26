// config/nav.ts
export type NavItem = { href: string; label: string };

export const NAV: NavItem[] = [
  { href: "/books", label: "Books" },
  { href: "/blog", label: "Insights" },
  { href: "/ventures", label: "Ventures" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];
