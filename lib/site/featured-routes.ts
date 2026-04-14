/* lib/site/featured-routes.ts */

export type FeaturedRoute = {
  title: string;
  href: string;
  eyebrow: string;
  description: string;
  group: "thought" | "applied" | "advisory" | "support";
  featured?: boolean;
};

export const FEATURED_ROUTES: FeaturedRoute[] = [
  {
    title: "Consulting",
    href: "/consulting",
    eyebrow: "Advisory",
    description: "Institutional-grade strategy, governance, and decision architecture.",
    group: "advisory",
    featured: true,
  },
  {
    title: "Canon",
    href: "/canon",
    eyebrow: "Doctrine",
    description: "The long-form architecture of purpose, leadership, governance, and legacy.",
    group: "thought",
    featured: true,
  },
  {
    title: "Editorials",
    href: "/editorials",
    eyebrow: "Publications",
    description: "Formal essays, position papers, and branded intellectual output.",
    group: "thought",
    featured: true,
  },
  {
    title: "Playbooks",
    href: "/playbooks",
    eyebrow: "Execution",
    description: "Practical operating frameworks for leaders, builders, and decision-makers.",
    group: "applied",
    featured: true,
  },
  {
    title: "Resources",
    href: "/resources",
    eyebrow: "Frameworks",
    description: "Structured tools, systems, and strategic reference assets.",
    group: "applied",
  },
  {
    title: "Books",
    href: "/books",
    eyebrow: "Volumes",
    description: "Long-form works, manifestos, and major written bodies of thought.",
    group: "thought",
  },
  {
    title: "Shorts",
    href: "/shorts",
    eyebrow: "Rapid Intel",
    description: "Sharp reflections, compact doctrine, and daily intellectual cadence.",
    group: "thought",
  },
  {
    title: "Events",
    href: "/events",
    eyebrow: "Engagement",
    description: "Gatherings, briefings, salons, and strategic public moments.",
    group: "advisory",
  },
  {
    title: "Vault Briefs",
    href: "/vault/briefs",
    eyebrow: "Intelligence",
    description: "Curated briefings and premium dossiers for serious readers.",
    group: "applied",
  },
  {
    title: "Library",
    href: "/library",
    eyebrow: "Archive",
    description: "Verified assets, PDF intelligence, and formal reference material.",
    group: "applied",
  },
  {
    title: "Downloads",
    href: "/downloads",
    eyebrow: "Assets",
    description: "Worksheets, packs, templates, and premium downloadable material.",
    group: "applied",
  },
  {
    title: "Inner Circle",
    href: "/inner-circle",
    eyebrow: "Membership",
    description: "Restricted access, premium content, and closer institutional proximity.",
    group: "advisory",
  },
  {
    title: "About",
    href: "/about",
    eyebrow: "Profile",
    description: "The mandate, biography, and frame behind the work.",
    group: "support",
  },
  {
    title: "Speaking",
    href: "/speaking",
    eyebrow: "Platform",
    description: "Keynotes, talks, interviews, and public voice.",
    group: "support",
  },
  {
    title: "Contact",
    href: "/contact",
    eyebrow: "Direct",
    description: "Enquiries, partnership, media, and strategic contact.",
    group: "support",
  },
];