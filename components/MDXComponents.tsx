// components/mdx/ctas.ts
type LinkItem = { href: string; label: string; sub?: string };

export type CtaPreset = {
  title: string;
  reads: LinkItem[];
  downloads: LinkItem[];
};

/**
 * NOTE:
 * - Ensure these PDFs exist in /public/downloads:
 *   /downloads/Leadership_Playbook.pdf
 *   /downloads/Mentorship_Starter_Kit.pdf
 *   /downloads/Entrepreneur_Operating_Pack.pdf
 *   /downloads/Entrepreneur_Survival_Checklist.pdf
 *   /downloads/Weekly_Operating_Rhythm.pdf
 *   /downloads/Board_Update_OnePager.pdf
 *   /downloads/Evidence_Log_Template.pdf
 */
export const CTA_PRESETS: Record<string, CtaPreset> = {
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
      { href: "/downloads/Entrepreneur_Survival_Checklist.pdf", label: "Entrepreneur Survival Checklist" },
      { href: "/downloads/Weekly_Operating_Rhythm.pdf", label: "Weekly Operating Rhythm" },
      { href: "/downloads/Board_Update_OnePager.pdf", label: "Board / Investor One-Pager" },
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
      { href: "/downloads/Evidence_Log_Template.pdf", label: "Evidence Log Template" },
      { href: "/downloads/Leadership_Playbook.pdf", label: "Leadership Playbook (30•60•90)" },
      { href: "/downloads/Mentorship_Starter_Kit.pdf", label: "Mentorship Starter Kit" },
    ],
  },
};
