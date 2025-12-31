// ============================================================================
// lib/print-utils.ts
// Production-safe utilities for prints - NO Contentlayer dependency.
// For now, uses MOCK_PRINTS as the single source of truth for print data.
// ============================================================================

export interface PrintDocument {
  _id: string;
  title: string;
  slug: string;
  date: string;
  url: string;
  excerpt?: string;
  tags?: string[];
  coverImage?: string;
  content?: string; // MDX/markdown string
  // Allow future-safe extension without breaking consumers
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// MOCK DATA (replace with filesystem/DB/Contentlayer source later)
// ---------------------------------------------------------------------------

const MOCK_PRINTS: PrintDocument[] = [
  {
    _id: "print-entrepreneur-operating-pack",
    title: "Entrepreneur Operating Pack",
    slug: "entrepreneur-operating-pack",
    date: "2025-11-12",
    url: "/prints/entrepreneur-operating-pack",
    excerpt:
      "A premium operating pack for founders who want to run their lives and ventures like a boardroom-not a battlefield.",
    tags: ["entrepreneurship", "systems", "execution"],
    coverImage: "/assets/images/prints/entrepreneur-operating-pack.jpg",
    content: `# Entrepreneur Operating Pack

A structured, high-trust operating system for founders and builders.

Use this printable pack to:

- Clarify your non-negotiables as a leader  
- Lock in weekly and monthly review rhythms  
- Align your calendar with your true priorities, not just emergencies  

It's designed to sit beside your laptop or on your desk as a **visual governance layer** for how you operate, decide, and execute.`,
  },
  {
    _id: "print-fatherhood-standards-card",
    title: "Fatherhood Standards Card",
    slug: "fatherhood-standards-card",
    date: "2025-11-12",
    url: "/prints/fatherhood-standards-card",
    excerpt:
      "A one-page standard card for fathers who refuse to parent on autopilot.",
    tags: ["fatherhood", "family", "standards"],
    coverImage: "/assets/images/prints/fatherhood-standards-card.jpg",
    content: `# Fatherhood Standards Card

This card is a **daily mirror** for fathers.

- Who am I becoming as a man?  
- What will my children say I normalised in our home?  
- Where am I drifting-and what will it cost them if I stay there?

Print it, keep it in your wallet, journal, or next to your bed.  
Review it often. Adjust your behaviour, not your standards.`,
  },
  {
    _id: "print-leadership-playbook",
    title: "Leadership Playbook",
    slug: "leadership-playbook",
    date: "2025-11-12",
    url: "/prints/leadership-playbook",
    excerpt:
      "A concise, battlefield-tested leadership playbook for fathers, founders, and marketplace leaders.",
    tags: ["leadership", "strategy", "playbook"],
    coverImage: "/assets/images/prints/leadership-playbook.jpg",
    content: `# Leadership Playbook

Leadership is not vibes. It is **clarity, courage, and consistency**.

This printable playbook gives you:

- Core convictions that anchor your decisions  
- A simple framework for handling conflict and pressure  
- Reflection prompts you can use with your team, your spouse, or your children  

Use it as a **live document** you revisit every quarter.`,
  },
  {
    _id: "print-mentorship-starter-kit",
    title: "Mentorship Starter Kit",
    slug: "mentorship-starter-kit",
    date: "2025-11-12",
    url: "/prints/mentorship-starter-kit",
    excerpt:
      "A structured starter kit to turn good intentions about mentoring into a repeatable, life-giving practice.",
    tags: ["mentorship", "discipleship", "legacy"],
    coverImage: "/assets/images/prints/mentorship-starter-kit.jpg",
    content: `# Mentorship Starter Kit

Mentorship is how we **transfer wisdom without losing time**.

Inside this kit:

- A simple agreement template to set expectations  
- Session structures you can repeat with every mentee  
- Questions that pull out purpose, not just performance  

This is for fathers, leaders, and older siblings who know someone is watching them-and want to be intentional about it.`,
  },
  {
    _id: "print-standards-brief",
    title: "Standards Brief",
    slug: "standards-brief",
    date: "2025-11-12",
    url: "/prints/standards-brief",
    excerpt:
      "A strategic one-pager to define the standards you will live by-and refuse to negotiate.",
    tags: ["standards", "identity", "clarity"],
    coverImage: "/assets/images/prints/standards-brief.jpg",
    content: `# Standards Brief

Before strategy, there must be **standards**.

This brief helps you:

- Define what is *never* acceptable in your life, home, and work  
- Translate values into observable behaviours  
- Create a reference point when pressure and emotion try to move the goalposts  

Treat this as your **personal constitution**.`,
  },
  {
    _id: "print-weekly-operating-rhythm",
    title: "Weekly Operating Rhythm",
    slug: "weekly-operating-rhythm",
    date: "2025-11-12",
    url: "/prints/weekly-operating-rhythm",
    excerpt:
      "A premium weekly rhythm sheet to align your energy, priorities, and commitments with what actually matters.",
    tags: ["rhythm", "productivity", "execution"],
    coverImage: "/assets/images/prints/weekly-operating-rhythm.jpg",
    content: `# Weekly Operating Rhythm

Your week is not neutral. It is **shaping your story**.

This layout guides you to:

- Anchor the week around worship, rest, and deep work  
- Block time for what builds legacy, not just income  
- Review what worked, what slipped, and what must change next week  

Print several copies. Use pen, not just intention.`,
  },
];

/* ────────────────────────────────────────────────────────────────────────── */
/* public API                                                                */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * Return all print documents.
 */
export function getAllPrintDocuments(): PrintDocument[] {
  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.warn("⚠️ Using mock print data - Contentlayer is disabled");
  }
  return [...MOCK_PRINTS]; // shallow copy
}

/**
 * Return all slugs for static path generation.
 */
export function getAllPrintSlugs(): string[] {
  return getAllPrintDocuments()
    .map((d) => d.slug)
    .filter((slug): slug is string => Boolean(slug && slug.trim()));
}

/**
 * Safely retrieve a single print document by slug (case-insensitive).
 */
export function getPrintDocumentBySlug(slug: string): PrintDocument | null {
  if (!slug) return null;

  const normalizedSlug = slug.toLowerCase().trim();

  const doc = getAllPrintDocuments().find((d) => {
    const candidate = (d.slug || "").toString().toLowerCase().trim();
    return candidate === normalizedSlug;
  });

  return doc ?? null;
}

/**
 * Helper for Next.js getStaticPaths.
 */
export function getPrintPaths(): { params: { slug: string } }[] {
  return getAllPrintSlugs().map((slug) => ({ params: { slug } }));
}
