// lib/siteConfig.ts
export type SocialLink = {
  href: string;
  label: string;
  icon?: string;
  kind?: "x" | "instagram" | "facebook" | "linkedin" | "youtube" | "whatsapp" | "mail" | "phone";
  external?: boolean;
};

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
  authorImage: string;
};

export const siteConfig: SiteConfig = {
  title: "Abraham of London",
  author: "Abraham of London",
  description:
    "Official site of Abraham of London — author, strategist, and fatherhood advocate.",
  siteUrl:
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.URL ||
    process.env.DEPLOY_PRIME_URL ||
    "https://www.abrahamoflondon.org",
  socialLinks: [
    { href: "mailto:info@abrahamoflondon.org", label: "Email",   kind: "mail",    icon: "/assets/images/social/email.svg" },
    { href: "tel:+442086225909",               label: "Phone",   kind: "phone",   icon: "/assets/images/social/phone.svg" },
    { href: "https://x.com/AbrahamAda48634",   label: "X",       kind: "x",       icon: "/assets/images/social/twitter.svg", external: true },
    { href: "https://www.instagram.com/abraham_of_london_/", label: "Instagram", kind: "instagram", icon: "/assets/images/social/link.svg", external: true },
    { href: "https://www.facebook.com/share/16tvsnTgRG/", label: "Facebook", kind: "facebook", icon: "/assets/images/social/facebook.svg", external: true },
    { href: "https://www.linkedin.com/in/abraham-adaramola-06630321/", label: "LinkedIn", kind: "linkedin", icon: "/assets/images/social/linkedin.svg", external: true },
    { href: "https://www.youtube.com/@abrahamoflondon", label: "YouTube", kind: "youtube", icon: "/assets/images/social/link.svg", external: true },
    { href: "https://wa.me/447496334022", label: "WhatsApp", kind: "whatsapp", icon: "/assets/images/social/whatsapp.svg", external: true },
  ],
  gaMeasurementId: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || null,
  email: "info@abrahamoflondon.org",
  ogImage: "/assets/images/social/og-image.jpg",
  twitterImage: "/assets/images/social/twitter-image.webp",
  authorImage: "/assets/images/profile-portrait.webp",
};

export const absUrl = (path: string) =>
  `${siteConfig.siteUrl}${path.startsWith("/") ? "" : "/"}${path}`;
