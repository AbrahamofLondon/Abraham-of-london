// components/mdx/cta-presets.ts

'use client';

export type LinkItem = { href: string; label: string; sub?: string };

export const CTA_PRESETS: Record<
  string,
  { title: string; reads?: LinkItem[]; downloads?: LinkItem[] }
> = {
  fatherhood: {
    title: "Explore Fatherhood Resources",
    reads: [
      { href: "/blog/leadership-begins-at-home", label: "Leadership Begins at Home", sub: "Lead from the inside out" },
      { href: "/blog/the-brotherhood-code", label: "The Brotherhood Code", sub: "Build your band of brothers" },
      { href: "/blog/reclaiming-the-narrative", label: "Reclaiming the Narrative", sub: "Court-season clarity" },
    ],
    downloads: [
      { href: "/downloads/Fatherhood_Guide.pdf", label: "Fatherhood Guide" },
      { href: "/downloads/Mentorship_Starter_Kit.pdf", label: "Mentorship Starter Kit" },
    ],
  },
  // add more presets as needed
};

export function getCtaPreset(key?: string) {
  if (!key) return null;
  const k = String(key).trim().toLowerCase();
  return CTA_PRESETS[k] ?? null;
}
