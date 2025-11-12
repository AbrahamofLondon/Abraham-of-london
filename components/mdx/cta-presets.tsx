// components/mdx/cta-presets.ts

/* ---------- Types ---------- */
export type LinkItem = {
  href: string;
  label: string;
  sub?: string;
  icon?: string;
  badge?: "new" | "popular" | "featured" | "free";
  external?: boolean;
};

export type CTAPreset = {
  title: string;
  description?: string;
  reads?: LinkItem[];
  downloads?: LinkItem[];
  actions?: LinkItem[];
  related?: LinkItem[];
  theme?: "fatherhood" | "leadership" | "brotherhood" | "mentorship" | "default";
  featured?: LinkItem;
};

export type CTAKey =
  | "fatherhood"
  | "leadership"
  | "brotherhood"
  | "mentorship"
  | "free-resources"
  | "premium"
  | "community"
  | "newsletter";

/* ---------- Preset Configuration ---------- */
export const CTA_PRESETS: Record<CTAKey, CTAPreset> = {
  fatherhood: {
    title: "Explore Fatherhood Resources",
    description: "Transform your fatherhood journey with proven frameworks and brotherhood support",
    theme: "fatherhood",
    reads: [
      {
        href: "/blog/leadership-begins-at-home",
        label: "Leadership Begins at Home",
        sub: "Lead from the inside out",
        icon: "🏠",
        badge: "popular",
      },
      {
        href: "/blog/the-brotherhood-code",
        label: "The Brotherhood Code",
        sub: "Build your band of brothers",
        icon: "🤝",
        badge: "featured",
      },
      {
        href: "/blog/reclaiming-the-narrative",
        label: "Reclaiming the Narrative",
        sub: "Court-season clarity",
        icon: "✍️",
      },
    ],
    downloads: [
      {
        href: "/downloads/Fatherhood_Guide.pdf",
        label: "Fatherhood Guide",
        sub: "Complete framework for modern fathers",
        badge: "free",
      },
      {
        href: "/downloads/Mentorship_Starter_Kit.pdf",
        label: "Mentorship Starter Kit",
        sub: "Step-by-step mentorship framework",
      },
    ],
    actions: [
      {
        href: "/brotherhood",
        label: "Join Brotherhood",
        sub: "Exclusive community access",
        badge: "new",
      },
      {
        href: "/consultation",
        label: "Book Consultation",
        sub: "1-on-1 guidance session",
      },
    ],
    featured: {
      href: "/fatherhood-masterclass",
      label: "Fatherhood Masterclass",
      sub: "7-day transformative program",
    },
  },

  leadership: {
    title: "Leadership Development",
    description: "Cultivate authentic leadership that transforms teams and organizations",
    theme: "leadership",
    reads: [
      {
        href: "/blog/leading-with-purpose",
        label: "Leading with Purpose",
        sub: "Beyond profit and performance",
        icon: "🎯",
        badge: "featured",
      },
      {
        href: "/blog/decision-making-under-pressure",
        label: "Decision Making Under Pressure",
        sub: "Crisis leadership framework",
        icon: "⚡",
      },
      {
        href: "/blog/legacy-leadership",
        label: "Legacy Leadership",
        sub: "Building beyond your tenure",
        icon: "🌱",
      },
    ],
    downloads: [
      {
        href: "/downloads/Leadership_Playbook.pdf",
        label: "Leadership Playbook",
        sub: "Daily practices for effective leaders",
        badge: "free",
      },
      {
        href: "/downloads/Team_Building_Exercises.pdf",
        label: "Team Building Exercises",
        sub: "20+ proven activities",
      },
    ],
    actions: [
      {
        href: "/executive-coaching",
        label: "Executive Coaching",
        sub: "Personalized leadership development",
      },
      {
        href: "/workshops",
        label: "Leadership Workshops",
        sub: "Team transformation sessions",
      },
    ],
  },

  brotherhood: {
    title: "Brotherhood Community",
    description: "Join a band of brothers committed to growth, accountability, and legacy",
    theme: "brotherhood",
    reads: [
      {
        href: "/blog/what-is-brotherhood",
        label: "What is Brotherhood?",
        sub: "Beyond friendship and networking",
        icon: "👥",
        badge: "new",
      },
      {
        href: "/blog/accountability-partnerships",
        label: "Accountability Partnerships",
        sub: "Transform your growth trajectory",
        icon: "📊",
      },
    ],
    downloads: [
      {
        href: "/downloads/Brotherhood_Covenant.pdf",
        label: "Brotherhood Covenant",
        sub: "Framework for meaningful connections",
        badge: "free",
      },
    ],
    actions: [
      {
        href: "/brotherhood/apply",
        label: "Apply for Brotherhood",
        sub: "Join our exclusive community",
        badge: "featured",
      },
      {
        href: "/events",
        label: "Upcoming Events",
        sub: "Brotherhood gatherings and retreats",
      },
    ],
  },

  mentorship: {
    title: "Mentorship Framework",
    description: "Structured mentorship that accelerates growth and impact",
    theme: "mentorship",
    reads: [
      {
        href: "/blog/becoming-a-mentor",
        label: "Becoming a Mentor",
        sub: "The art of guiding others",
        icon: "🧭",
        badge: "popular",
      },
      {
        href: "/blog/finding-mentors",
        label: "Finding the Right Mentors",
        sub: "Building your personal board",
        icon: "🔍",
      },
    ],
    downloads: [
      {
        href: "/downloads/Mentorship_Agreement_Template.pdf",
        label: "Mentorship Agreement Template",
        sub: "Structure your mentorship relationships",
        badge: "free",
      },
      {
        href: "/downloads/Mentorship_Session_Planner.pdf",
        label: "Mentorship Session Planner",
        sub: "Make every session count",
      },
    ],
    actions: [
      {
        href: "/mentorship/program",
        label: "Join Mentorship Program",
        sub: "Structured 12-week journey",
      },
      {
        href: "/become-mentor",
        label: "Become a Mentor",
        sub: "Guide the next generation",
      },
    ],
  },

  "free-resources": {
    title: "Free Resources Library",
    description: "Access our complete collection of free guides, templates, and frameworks",
    theme: "default",
    downloads: [
      { href: "/downloads/Fatherhood_Principles_Checklist.pdf", label: "Fatherhood Principles Checklist", badge: "free" },
      { href: "/downloads/Daily_Leadership_Journal.pdf", label: "Daily Leadership Journal", badge: "free" },
      { href: "/downloads/Family_Meeting_Agenda.pdf", label: "Family Meeting Agenda", badge: "free" },
      { href: "/downloads/Personal_Growth_Assessment.pdf", label: "Personal Growth Assessment", badge: "free" },
    ],
    actions: [{ href: "/resources", label: "View All Resources", sub: "100+ free downloads available" }],
  },

  premium: {
    title: "Premium Programs",
    description: "Deep dive into transformative programs with personalized support",
    theme: "default",
    actions: [
      {
        href: "/programs/fatherhood-mastery",
        label: "Fatherhood Mastery Program",
        sub: "12-week intensive transformation",
        badge: "featured",
      },
      { href: "/programs/executive-leadership", label: "Executive Leadership Academy", sub: "For senior leaders and entrepreneurs" },
      { href: "/programs/legacy-building", label: "Legacy Building Intensive", sub: "Design your lasting impact" },
    ],
    related: [
      { href: "/testimonials", label: "Success Stories", sub: "See transformation in action" },
      { href: "/pricing", label: "Program Pricing", sub: "Investment details" },
    ],
  },

  community: {
    title: "Join Our Community",
    description: "Connect with like-minded men on the journey of growth and impact",
    theme: "brotherhood",
    actions: [
      { href: "/brotherhood", label: "Brotherhood Inner Circle", sub: "Exclusive membership community", badge: "featured" },
      { href: "/events", label: "Live Events & Retreats", sub: "In-person connection experiences" },
      { href: "https://discord.gg/abraham-london", label: "Discord Community", sub: "Daily conversations and support", external: true },
    ],
    related: [
      { href: "/community/guidelines", label: "Community Guidelines", sub: "Our commitment to each other" },
      { href: "/faq", label: "Community FAQ", sub: "Common questions answered" },
    ],
  },

  newsletter: {
    title: "Stay Connected",
    description: "Get weekly insights, resources, and updates delivered to your inbox",
    theme: "default",
    actions: [{ href: "/newsletter", label: "Join Newsletter", sub: "Weekly wisdom and updates", badge: "free" }],
    related: [
      { href: "/newsletter/archive", label: "Newsletter Archive", sub: "Browse past editions" },
      { href: "/privacy", label: "Privacy Promise", sub: "We respect your inbox" },
    ],
  },
} as const;

/* ---------- Utilities ---------- */
export function getCtaPreset(key?: string): CTAPreset | null {
  if (!key) return null;
  const k = String(key).trim().toLowerCase() as CTAKey;
  return (CTA_PRESETS as Record<string, CTAPreset>)[k] ?? null;
}

export function getAllPresetKeys(): CTAKey[] {
  return Object.keys(CTA_PRESETS) as CTAKey[];
}

export function getPresetByTheme(theme: NonNullable<CTAPreset["theme"]>): CTAPreset[] {
  return Object.values(CTA_PRESETS).filter((p) => p.theme === theme);
}

export function validatePresetKey(key: string): key is CTAKey {
  return key in CTA_PRESETS;
}

export function getFeaturedItems(presetKey: CTAKey): LinkItem[] {
  const preset = CTA_PRESETS[presetKey];
  const featured: LinkItem[] = [];
  if (preset.featured) featured.push(preset.featured);

  (["reads", "downloads", "actions", "related"] as const).forEach((cat) => {
    const items = preset[cat];
    if (Array.isArray(items)) featured.push(...items.filter((i) => i.badge));
  });

  return featured.slice(0, 3);
}

export function getAllDownloads(): LinkItem[] {
  const out: LinkItem[] = [];
  Object.values(CTA_PRESETS).forEach((p) => {
    if (Array.isArray(p.downloads)) out.push(...p.downloads);
  });
  return out;
}

export function searchPresets(query: string): CTAPreset[] {
  const q = String(query || "").toLowerCase();
  return Object.values(CTA_PRESETS).filter((p) => {
    if (p.title.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q)) return true;
    for (const k of ["reads", "downloads", "actions", "related"] as const) {
      const arr = p[k];
      if (Array.isArray(arr) && arr.some((it) => it.label.toLowerCase().includes(q) || it.sub?.toLowerCase().includes(q))) {
        return true;
      }
    }
    return false;
  });
}

export function isCTAPreset(obj: unknown): obj is CTAPreset {
  return !!obj && typeof (obj as any).title === "string";
}
export function isLinkItem(obj: unknown): obj is LinkItem {
  return !!obj && typeof (obj as any).href === "string" && typeof (obj as any).label === "string";
}

/* ---------- Legacy default ---------- */
export default CTA_PRESETS;