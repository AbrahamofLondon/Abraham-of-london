// lib/siteConfig.ts
export type SocialLink = {
  href: string;          // "https://...", "mailto:..", "tel:..", or internal "/path"
  label: string;         // e.g., "LinkedIn"
  icon: string;          // path to SVG in /public (e.g., "/assets/images/social/linkedin.svg")
  external?: boolean;    // force external handling if needed
};

export type SiteConfig = {
  title: string;
  author: string;
  description: string;
  siteUrl: string;       // normalized, no trailing slash
  socialLinks: SocialLink[];
  gaMeasurementId?: string | null;
  email: string;
  ogImage: string;
  twitterImage: string;
};

const RAW: Omit<SiteConfig, 'siteUrl' | 'socialLinks'> & {
  siteUrl?: string;
  socialLinks: Array<Partial<SocialLink> & Pick<SocialLink, 'href' | 'label' | 'icon'>>;
} = {
  title: 'Abraham of London',
  author: 'Abraham of London',
  description:
    'Official site of Abraham of London – author, strategist, and fatherhood advocate.',
  siteUrl:
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.URL ||
    process.env.DEPLOY_PRIME_URL ||
    'https://abraham-of-london.netlify.app',
  socialLinks: [
    { href: 'mailto:info@abrahamoflondon.org', label: 'Email', icon: '/assets/images/social/email.svg' },
    { href: 'tel:+442086225909', label: 'Phone', icon: '/assets/images/social/phone.svg' },
    { href: 'https://www.linkedin.com/in/abraham-adaramola-06630321/', label: 'LinkedIn', icon: '/assets/images/social/linkedin.svg', external: true },
    { href: 'https://x.com/AbrahamAda48634?t=vXINB5EdYjhjr-eeb6tnjw&s=09', label: 'X', icon: '/assets/images/social/twitter.svg', external: true },
    { href: 'https://www.facebook.com/share/1MRrKpUzMG/', label: 'Facebook', icon: '/assets/images/social/facebook.svg', external: true },
    { href: 'https://wa.me/447496334022', label: 'WhatsApp', icon: '/assets/images/social/whatsapp.svg', external: true },
  ],
  gaMeasurementId: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || 'G-R2Y3YMY8F8',
  email: 'info@abrahamoflondon.org',
  ogImage: '/assets/images/social/og-image.jpg',
  twitterImage: '/assets/images/social/twitter-image.webp',
};

// -------------------- Normalizers --------------------

function stripTrailingSlash(u: string) {
  return u.replace(/\/+$/, '');
}

function ensureHttps(u: string) {
  if (/^(mailto:|tel:|#)/i.test(u)) return u;
  if (/^https?:\/\//i.test(u)) return u;
  return `https://${u.replace(/^\/+/, '')}`;
}

function isHttp(u: string) {
  return /^https?:\/\//i.test(u);
}

function normalizeSiteUrl(u?: string): string {
  if (!u) return '';
  return stripTrailingSlash(ensureHttps(u));
}

function normalizeLinks(arr: SiteConfig['socialLinks']): SiteConfig['socialLinks'] {
  return (arr || [])
    .filter(Boolean)
    .map((l) => {
      const href = (l.href || '').trim();
      const external =
        typeof l.external === 'boolean'
          ? l.external
          : isHttp(href); // default to external for HTTP(S)

      return {
        href: external && isHttp(href) ? ensureHttps(href) : href,
        label: l.label?.trim() || 'Link',
        icon: l.icon?.trim() || '/assets/images/social/link.svg',
        external,
      };
    });
}

// Absolute URL helper for meta tags / JSON-LD
export function absUrl(path: string, siteUrl = CONFIG.siteUrl): string {
  if (!path) return siteUrl;
  if (/^https?:\/\//i.test(path)) return path;
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return siteUrl ? new URL(normalized, siteUrl).toString() : normalized;
}

// -------------------- Final Config --------------------

export const CONFIG: SiteConfig = Object.freeze({
  title: RAW.title,
  author: RAW.author,
  description: RAW.description,
  siteUrl: normalizeSiteUrl(RAW.siteUrl),
  socialLinks: normalizeLinks(RAW.socialLinks as any),
  gaMeasurementId: RAW.gaMeasurementId || null,
  email: RAW.email,
  ogImage: RAW.ogImage,
  twitterImage: RAW.twitterImage,
});

export const siteConfig = CONFIG; // for compatibility with existing imports