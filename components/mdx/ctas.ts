// components/mdx/ctas.ts
export type CtaLink = Readonly<{ href: string; label: string; sub?: string }>;
export type CtaPreset = Readonly<{
  title: string;
  reads: ReadonlyArray<CtaLink>;
  downloads: ReadonlyArray<CtaLink>;
}>;

/**
 * All download links below currently exist:
 *   /downloads/Leadership_Playbook.pdf
 *   /downloads/Mentorship_Starter_Kit.pdf
 *   /downloads/Entrepreneur_Operating_Pack.pdf
 */
export const CTA_PRESETS = {
  default: {
    title: "Further Reading & Downloads",
    reads: [
      { href: "/blog/leadership-begins-at-home", label: "Leadership Begins at Home", sub: "Order over noise" },
      { href: "/blog/the-brotherhood-code", label: "The Brotherhood Code", sub: "Covenant of presence" },
      { href: "/blog/fathering-principles", label: "Fathering Principles", sub: "A blueprint for men" },
    ],
    downloads: [
      { href: "/downloads/Leadership_Playbook.pdf", label: "Leadership Playbook (30•60•90)" },
      { href: "/downloads/Mentorship_Starter_Kit.pdf", label: "Mentorship Starter Kit" },
      { href: "/downloads/Entrepreneur_Operating_Pack.pdf", label: "Entrepreneur Operating Pack" },
    ],
  },

  fatherhood: {
    title: "Keep Building — Reading & Tools",
    reads: [
      { href: "/blog/fathering-principles", label: "Fathering Principles", sub: "A blueprint for men" },
      { href: "/blog/leadership-begins-at-home", label: "Leadership Begins at Home", sub: "Lead from the inside out" },
      { href: "/blog/the-brotherhood-code", label: "The Brotherhood Code", sub: "Build your band of brothers" },
    ],
    downloads: [
      { href: "/downloads/Mentorship_Starter_Kit.pdf", label: "Mentorship Starter Kit" },
      { href: "/downloads/Leadership_Playbook.pdf", label: "Leadership Playbook (30•60•90)" },
      { href: "/downloads/Entrepreneur_Operating_Pack.pdf", label: "Entrepreneur Operating Pack" },
    ],
  },

  leadership: {
    title: "Lead from the Inside Out — Playbooks",
    reads: [
      { href: "/blog/leadership-begins-at-home", label: "Leadership Begins at Home", sub: "Govern self, then household" },
      { href: "/blog/principles-for-my-son", label: "Principles for My Son", sub: "Standards over slogans" },
      { href: "/blog/the-brotherhood-code", label: "The Brotherhood Code", sub: "Accountability that builds" },
    ],
    downloads: [
      { href: "/downloads/Leadership_Playbook.pdf", label: "Leadership Playbook (30•60•90)" },
      { href: "/downloads/Mentorship_Starter_Kit.pdf", label: "Mentorship Starter Kit" },
      { href: "/downloads/Entrepreneur_Operating_Pack.pdf", label: "Entrepreneur Operating Pack" },
    ],
  },

  entrepreneurship: {
    title: "Build with Integrity — Founder Tools",
    reads: [
      { href: "/blog/leadership-begins-at-home", label: "Leadership Begins at Home", sub: "Character fuels execution" },
      { href: "/blog/reclaiming-the-narrative", label: "Reclaiming the Narrative", sub: "Own the story under pressure" },
      { href: "/blog/fathering-principles", label: "Fathering Principles", sub: "Non-negotiables that scale" },
    ],
    downloads: [
      { href: "/downloads/Entrepreneur_Operating_Pack.pdf", label: "Entrepreneur Operating Pack" },
      { href: "/downloads/Leadership_Playbook.pdf", label: "Leadership Playbook (30•60•90)" },
      { href: "/downloads/Mentorship_Starter_Kit.pdf", label: "Mentorship Starter Kit" },
    ],
  },

  community: {
    title: "Strengthen the Brotherhood — Resources",
    reads: [
      { href: "/blog/the-brotherhood-code", label: "The Brotherhood Code", sub: "Covenant of presence" },
      { href: "/blog/principles-for-my-son", label: "Principles for My Son", sub: "Form the future" },
      { href: "/blog/leadership-begins-at-home", label: "Leadership Begins at Home", sub: "Order over noise" },
    ],
    downloads: [
      { href: "/downloads/Mentorship_Starter_Kit.pdf", label: "Mentorship Starter Kit" },
      { href: "/downloads/Leadership_Playbook.pdf", label: "Leadership Playbook (30•60•90)" },
      { href: "/downloads/Entrepreneur_Operating_Pack.pdf", label: "Entrepreneur Operating Pack" },
    ],
  },

  justice: {
    title: "Navigate Pressure with Clarity",
    reads: [
      { href: "/blog/reclaiming-the-narrative", label: "Reclaiming the Narrative", sub: "Court-season clarity" },
      { href: "/blog/when-the-system-breaks-you", label: "When the System Breaks You", sub: "Grief • Grit • Grace" },
      { href: "/blog/fathering-without-fear", label: "Fathering Without Fear — A Memoir", sub: "Movement, not just story" },
    ],
    downloads: [
      { href: "/downloads/Leadership_Playbook.pdf", label: "Leadership Playbook (30•60•90)" },
      { href: "/downloads/Mentorship_Starter_Kit.pdf", label: "Mentorship Starter Kit" },
      { href: "/downloads/Entrepreneur_Operating_Pack.pdf", label: "Entrepreneur Operating Pack" },
    ],
  },
} as const satisfies Record<string, CtaPreset>;

export type CtaPresetKey = keyof typeof CTA_PRESETS;

export function getCtaPreset(key?: string): CtaPreset {
  const k = (key ?? "default") as CtaPresetKey;
  return CTA_PRESETS[k] ?? CTA_PRESETS.default;
}
