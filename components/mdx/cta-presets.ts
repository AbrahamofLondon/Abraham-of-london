// components/mdx/cta-presets.ts

/** A single “read” item shown in the CTA preset */
export type CtaRead = {
  href: `/${string}`;        // internal route
  label: string;
  sub?: string;              // small sub label
};

/** A single download item shown in the CTA preset */
export type CtaDownload = {
  href: `/${string}`;        // internal route or /downloads/*.pdf
  label: string;
  sub?: string;
};

export type CtaPreset = {
  title: string;
  reads?: CtaRead[];
  downloads?: CtaDownload[];
  note?: string;             // optional small caption under title
};

export type CtaPresetKey =
  | "fatherhood"
  | "justice"
  | "resilience"
  | "entrepreneurship";

/**
 * Central registry of CTA presets used by <ResourcesCTA preset="…" /> in MDX.
 * Keep routes internal (leading slash). PDFs should live under /downloads.
 */
export const CTA_PRESETS: Record<CtaPresetKey, CtaPreset> = {
  fatherhood: {
    title: "Explore Fatherhood Resources",
    reads: [
      {
        href: "/blog/leadership-begins-at-home",
        label: "Leadership Begins at Home",
        sub: "Lead from the inside out",
      },
      {
        href: "/blog/the-brotherhood-code",
        label: "The Brotherhood Code",
        sub: "Build your band of brothers",
      },
      {
        href: "/blog/reclaiming-the-narrative",
        label: "Reclaiming the Narrative",
        sub: "Court-season clarity",
      },
    ],
    downloads: [
      { href: "/downloads/Fatherhood_Guide.pdf", label: "Fatherhood Guide" },
      {
        href: "/downloads/Mentorship_Starter_Kit.pdf",
        label: "Mentorship Starter Kit",
      },
    ],
  },

  justice: {
    title: "Walk Through the Fire—Wisely",
    reads: [
      {
        href: "/blog/christianity-not-extremism",
        label: "Christianity ≠ Extremism",
        sub: "What we are—and aren’t",
      },
      {
        href: "/blog/when-gods-sovereignty-collides-with-our-pain",
        label: "Sovereignty & Suffering",
        sub: "Holding both without breaking",
      },
      {
        href: "/blog/when-the-system-breaks-you",
        label: "When the System Breaks You",
        sub: "Grief → Grit → Grace",
      },
    ],
    downloads: [
      {
        href: "/downloads/Leadership_Playbook.pdf",
        label: "Leadership Playbook",
      },
      {
        href: "/downloads/Legal_Sanity_Log.pdf",
        label: "Legal Sanity Log",
        sub: "Daily facts, weekly review",
      },
    ],
  },

  resilience: {
    title: "Build a Durable Life",
    reads: [
      {
        href: "/blog/principles-for-my-son",
        label: "Principles for My Son",
        sub: "A father’s field notes",
      },
      {
        href: "/blog/fathering-without-fear",
        label: "Fathering Without Fear",
        sub: "Courage for ordinary days",
      },
      {
        href: "/blog/kingdom-strategies-for-a-loving-legacy",
        label: "Kingdom Strategies for a Loving Legacy",
      },
    ],
    downloads: [
      {
        href: "/downloads/Brotherhood_Cue_Card.pdf",
        label: "Brotherhood Cue Card",
      },
      {
        href: "/downloads/Brotherhood_Covenant.pdf",
        label: "Brotherhood Covenant",
      },
    ],
  },

  entrepreneurship: {
    title: "Build With Wisdom",
    reads: [
      {
        href: "/blog/fathering-principles",
        label: "Fathering Principles",
        sub: "Transferrable to teams",
      },
      {
        href: "/blog/leadership-begins-at-home",
        label: "Leadership Begins at Home",
        sub: "Character before scale",
      },
      {
        href: "/blog/the-brotherhood-code",
        label: "The Brotherhood Code",
        sub: "Trust, clarity, cadence",
      },
    ],
    downloads: [
      {
        href: "/downloads/Entrepreneur_Operating_Pack.pdf",
        label: "Entrepreneur Operating Pack",
      },
    ],
  },
};

/** Type guard for preset keys (useful when reading from MDX props) */
export function isCtaPresetKey(v: unknown): v is CtaPresetKey {
  return typeof v === "string" && v in CTA_PRESETS;
}

/** Safe fetch: returns a preset or `null` if not found */
export function getCtaPreset(key: string | undefined | null): CtaPreset | null {
  if (!key) return null;
  return isCtaPresetKey(key) ? CTA_PRESETS[key] : null;
}
