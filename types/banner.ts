// type s/banner.ts
export type BannerOverlay = {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  ctaText?: string;
  ctaHref?: string;
};

export type BannerData = {
  posterSrc: string;
  video?: { mp4?: string; webm?: string } | null;
  overlay?: BannerOverlay | null;
};
