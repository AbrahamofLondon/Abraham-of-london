// types/config.ts
export interface SocialLink {
  href: string;
  label: string;
  external?: boolean;
  kind?:
    | "twitter"
    | "linkedin"
    | "github"
    | "instagram"
    | "youtube"
    | "website"
    | "tiktok"
    | "facebook"
    | "email"
    | "phone"
    | "whatsapp";
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  priority?: number;
}

export interface SiteConfig {
  title: string;
  description: string;
  email: string;
  socialLinks: SocialLink[];
  copyright?: string;
  companyNumber?: string;
  vatNumber?: string;
}

export const defaultSocialLinks: SocialLink[] = [
  {
    href: "https://tiktok.com/@abrahamoflondon",
    label: "TikTok",
    kind: "tiktok",
    external: true,
  },
  {
    href: "https://x.com/AbrahamAda48634",
    label: "X",
    kind: "twitter",
    external: true,
  },
  {
    href: "https://www.instagram.com/abraham_of_london_/",
    label: "Instagram",
    kind: "instagram",
    external: true,
  },
  {
    href: "https://www.facebook.com/share/16tvsnTgRG/",
    label: "Facebook",
    kind: "facebook",
    external: true,
  },
  {
    href: "https://www.linkedin.com/in/abraham-adaramola-06630321/",
    label: "LinkedIn",
    kind: "linkedin",
    external: true,
  },
  {
    href: "https://www.youtube.com/@abrahamoflondon",
    label: "YouTube",
    kind: "youtube",
    external: true,
  },
  {
    href: "mailto:info@abrahamoflondon.org",
    label: "Email",
    kind: "email",
    external: false,
  },
  {
    href: "https://wa.me/447496334022",
    label: "WhatsApp",
    kind: "whatsapp",
    external: true,
  },
  {
    href: "tel:+442086225909",
    label: "Landline",
    kind: "phone",
    external: false,
  },
];
