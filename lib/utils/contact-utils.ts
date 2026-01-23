// lib/utils/contact-utils.ts
import { siteConfig } from "@/config/site";

export function getContactEmail(): string {
  // Try contact.email first, then author.email, then fallback
  return siteConfig.contact?.email || 
         siteConfig.author?.email || 
         "info@abrahamoflondon.org";
}

export function getContactPhone(): string {
  return siteConfig.contact?.phone || "+44 20 8622 5909";
}

export function getContactAddress(): string {
  return siteConfig.contact?.address || "Based in London, working globally";
}