// /types/nav.ts
export type SocialLink = { name: string; href: string; external?: boolean };
export type NavItem = { label: string; href: string; children?: NavItem[] };
