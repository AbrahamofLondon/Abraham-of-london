// config/nav.ts
// Global navigation model for Layout and header components.

export interface NavItem {
  label: string;
  href: string;
  description?: string;
  external?: boolean;
  children?: NavItem[];
}

export const NAV: NavItem[] = [
  {
    label: "Home",
    href: "/",
  },
  {
    label: "Fathering Without Fear",
    href: "/fathering-without-fear",
    description: "Memoir, principles, and the fatherhood blueprint.",
  },
  {
    label: "Strategy & Ventures",
    href: "/strategy",
    description: "Advisory, ventures, and market-facing work.",
  },
  {
    label: "Resources",
    href: "/resources",
    description: "Articles, tools, and frameworks.",
  },
  {
    label: "Downloads",
    href: "/downloads",
    description: "Guides, cue cards, and print-ready assets.",
  },
  {
    label: "About",
    href: "/about",
    description: "Who Abraham is and what Abraham of London stands for.",
  },
];

export default NAV;
