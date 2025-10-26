// config/site.ts
export type SiteConfig = {
  title: string;
  description: string;
  url: string;
  socialImage: string;
  twitterHandle?: string;
  author?: string;
  contactEmail?: string;
  telephone?: string;
  socials?: {
    twitter?: string;
    linkedin?: string;
    instagram?: string;
    facebook?: string;
    youtube?: string;
    github?: string;
  };
};

const ORIGIN =
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.SITE_URL ??
  process.env.URL ??
  "https://abrahamoflondon.org";

const siteConfig: SiteConfig = {
  title: "Abraham of London",
  description:
    "Abraham of London — strategist, father, builder. Writing on legacy, fatherhood, and principled work.",
  url: ORIGIN.replace(/\/$/, ""),
  socialImage: "/assets/images/social/og-image.jpg",
  twitterHandle: "@abrahamoflondon",
  author: "Abraham of London",
  contactEmail: "info@abrahamoflondon.org",
  telephone: "+44 20 8622 5909",
  socials: {
    twitter: "https://twitter.com/AbrahamAda48634",
    linkedin: "https://www.linkedin.com/in/abraham-adaramola-06630321/",
    instagram: "https://www.instagram.com/abraham_of_london",
    facebook: "https://www.facebook.com/share/p/156tQWm2mZ/",
  },
};

export default siteConfig;
