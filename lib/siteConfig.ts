// lib/siteConfig.ts
export type SiteConfig = {
  title: string;
  author: string;
  description: string;
  siteUrl: string;
  socialLinks: SocialLink[];
  gaMeasurementId?: string | null;
  email: string;
  ogImage: string;
  twitterImage: string;
  /** NEW: site-wide fallback avatar (MUST be a local /public path) */
  authorImage: string;
};

const RAW = {
  title: "Abraham of London",
  author: "Abraham of London",
  description:
    "Official site of Abraham of London — author, strategist, and fatherhood advocate.",
  siteUrl:
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.URL ||
    process.env.DEPLOY_PRIME_URL ||
    "https://abraham-of-london.netlify.app",
  socialLinks: [
    { href: "mailto:info@abrahamoflondon.org", label: "Email",   icon: "/assets/images/social/email.svg" },
    { href: "tel:+442086225909",                label: "Phone",   icon: "/assets/images/social/phone.svg" },
    { href: "https://www.linkedin.com/in/abraham-adaramola-06630321/", label: "LinkedIn", icon: "/assets/images/social/linkedin.svg", external: true },
    { href: "https://x.com/AbrahamAda48634",    label: "X",       icon: "/assets/images/social/twitter.svg", external: true },
    { href: "https://www.facebook.com/share/1MRrKpUzMG/", label: "Facebook", icon: "/assets/images/social/facebook.svg", external: true },
    { href: "https://wa.me/447496334022",       label: "WhatsApp", icon: "/assets/images/social/whatsapp.svg", external: true },
  ] as SocialLink[],
  gaMeasurementId: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || null,
  email: "info@abrahamoflondon.org",
  ogImage: "/assets/images/social/og-image.jpg",
  twitterImage: "/assets/images/social/twitter-image.webp",
  /** NEW: make sure this file exists under /public */
  authorImage: "/assets/images/profile/abraham-of-london.jpg",
} satisfies Omit<SiteConfig,
  "siteUrl" | "socialLinks"
> & {
  siteUrl?: string;
  socialLinks: SocialLink[];
};
