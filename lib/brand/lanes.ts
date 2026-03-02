export type EngagementLane = "media" | "education" | "private" | "institutional";

export const LANES = [
  {
    key: "media",
    title: "Media",
    href: "/media",
    description: "Public commentary, interviews, press assets, and high-signal briefs.",
    accessTier: "public",
  },
  {
    key: "education",
    title: "Education & Research",
    href: "/education-research",
    description: "Research notes, teaching editions, reading lists, workshops.",
    accessTier: "public",
  },
  {
    key: "private",
    title: "Private Clients",
    href: "/private-clients",
    description: "Private engagement pathways, retainers, advisory streams.",
    accessTier: "client",
  },
  {
    key: "institutional",
    title: "Institutional",
    href: "/institutional",
    description: "Boards, governance systems, and institutional design work.",
    accessTier: "architect",
  },
] as const;