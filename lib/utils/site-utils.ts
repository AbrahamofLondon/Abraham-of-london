// lib/utils/site-utils.ts
import { siteConfig } from "@/config/site";
import type { SocialPlatform } from "@/config/site";

/**
 * Get absolute URL for a given path
 */
export function absUrl(path: string = '/'): string {
  const base = siteConfig.url.replace(/\/$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${cleanPath}`;
}

/**
 * Check if URL is internal
 */
export function isInternalUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const baseUrl = new URL(siteConfig.url);
    return urlObj.origin === baseUrl.origin;
  } catch {
    return false;
  }
}

/**
 * Normalize path (remove duplicate slashes, trailing slashes)
 */
export function normalizePath(path: string): string {
  return path.replace(/\/+/g, '/').replace(/\/$/, '') || '/';
}

/**
 * Get social icon component name
 */
export function getSocialIcon(platform: SocialPlatform): string {
  const iconMap: Record<SocialPlatform, string> = {
    'x': 'Twitter',
    'twitter': 'Twitter',
    'linkedin': 'LinkedIn',
    'instagram': 'Instagram',
    'youtube': 'Youtube',
    'facebook': 'Facebook',
    'github': 'Github',
    'website': 'Globe',
    'email': 'Mail',
    'phone': 'Phone',
    'tiktok': 'MessageCircle',
    'whatsapp': 'MessageCircle',
  };
  return iconMap[platform] || 'Globe';
}

/**
 * Format phone number for display
 */
export function formatPhone(phone: string): string {
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  
  // UK number format
  if (cleaned.startsWith('44')) {
    const withoutCode = cleaned.slice(2);
    if (withoutCode.length === 10) {
      return `+44 ${withoutCode.slice(0, 4)} ${withoutCode.slice(4)}`;
    }
  }
  
  // Default: return as-is
  return phone;
}

/**
 * Create mailto link with subject
 */
export function createMailtoLink(
  email: string = siteConfig.contact.email || 'info@abrahamoflondon.org',
  subject?: string,
  body?: string
): string {
  let mailto = `mailto:${email}`;
  const params = new URLSearchParams();
  
  if (subject) params.append('subject', subject);
  if (body) params.append('body', body);
  
  if (params.toString()) {
    mailto += `?${params.toString()}`;
  }
  
  return mailto;
}

/**
 * Create tel link
 */
export function createTelLink(phone?: string): string {
  const tel = phone || siteConfig.contact.phone || '+442086225909';
  const cleaned = tel.replace(/\D/g, '');
  return `tel:+${cleaned}`;
}

/**
 * Get OG image URL
 */
export function getOgImageUrl(imagePath?: string): string {
  const base = siteConfig.url.replace(/\/$/, '');
  const image = imagePath || siteConfig.seo.openGraphImage || '/assets/images/social/og-image.jpg';
  
  if (image.startsWith('http')) {
    return image;
  }
  
  return `${base}${image.startsWith('/') ? image : `/${image}`}`;
}

/**
 * Generate structured data for organization
 */
export function generateOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": siteConfig.brand.name,
    "url": siteConfig.url,
    "logo": absUrl(siteConfig.brand.logo || '/assets/images/abraham-logo.jpg'),
    "description": siteConfig.seo.description,
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": siteConfig.contact.phone,
      "contactType": "customer service",
      "email": siteConfig.contact.email,
      "areaServed": "GB",
      "availableLanguage": "English"
    },
    "sameAs": siteConfig.socials
      .filter(s => ['x', 'linkedin', 'instagram', 'youtube', 'facebook'].includes(s.kind))
      .map(s => s.href)
  };
}

/**
 * Generate breadcrumb structured data
 */
export function generateBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": absUrl(item.url)
    }))
  };
}

/**
 * Check if feature is enabled
 */
export function isFeatureEnabled(feature: keyof NonNullable<typeof siteConfig.features>): boolean {
  return siteConfig.features?.[feature] || false;
}

/**
 * Get current year for copyright
 */
export function getCurrentYear(): string {
  return new Date().getFullYear().toString();
}