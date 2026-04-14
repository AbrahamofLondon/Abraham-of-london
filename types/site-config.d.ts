// types/site-config.d.ts
// Global augmentations for Site Config.
// The module's actual types live in `site-config.ts` — do not re-declare them
// here, or TypeScript will report duplicate identifiers.

export {};

declare global {
  interface Window {
    __SITE_CONFIG?: import("@/types/site-config").SiteConfig;
    __SITE_CONFIG_VALIDATION?: import("@/types/site-config").SiteConfigValidation;
  }
}
