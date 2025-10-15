// lib/hero-banners.ts
export type VideoSource = { src: string; type: string };

export type BannerConfig = {
  id: string;
  poster: string;
  videoSources?: VideoSource[];
  /** ISO date/time in site timezone; inclusive start, exclusive end */
  activeFrom?: string; // "2025-11-01"
  activeUntil?: string; // "2025-12-31T23:59:59Z"
  /** Optional daily rotation weight among unscheduled banners */
  weight?: number;
  /** Optional simple overlay schema (rendered in page) */
  overlay?: {
    eyebrow?: string;
    title?: string;
    body?: string;
    cta?: { href: string; label: string };
  };
  mobileObjectPositionClass?: string;
  heightClassName?: string;
};

export const BANNERS: BannerConfig[] = [
  // Default brand reel (video + poster)
  {
    id: "brand",
    poster: "/assets/images/abraham-of-london-banner.webp",
    videoSources: [
      { src: "/assets/video/brand-reel.webm", type: "video/webm" },
      { src: "/assets/video/brand-reel.mp4", type: "video/mp4" },
    ],
    mobileObjectPositionClass: "object-[center_45%] md:object-center",
    weight: 3,
  },

  // Evergreen static option (lighter LCP)
  {
    id: "writing",
    poster: "/assets/images/writing-desk.webp",
    mobileObjectPositionClass: "object-[center_35%] md:object-center",
    heightClassName: "h-[48vh] sm:h-[56vh] md:h-[64vh] lg:h-[72vh] xl:h-[80vh]",
    weight: 2,
  },

  // Example seasonal overlay (dates are just examples; adjust freely)
  {
    id: "book-launch",
    poster: "/assets/images/fathering-without-fear.jpg",
    mobileObjectPositionClass: "object-[center_40%] md:object-center",
    activeFrom: "2025-11-01T00:00:00+00:00",
    activeUntil: "2026-01-15T00:00:00+00:00",
    overlay: {
      eyebrow: "Launch",
      title: "Fathering Without Fear",
      body: "A bold memoir reclaiming fatherhood—clarity, discipline, and standards that endure.",
      cta: { href: "/books/fathering-without-fear", label: "Discover the book" },
    },
  },
];

/**
 * Return the “active” banner. If one or more banners are in an active window,
 * pick the first (top priority). Otherwise rotate daily among unscheduled banners
 * (deterministic by day) using weights; falls back to the first entry.
 */
export function getActiveBanner(
  now = new Date(),
  timeZone: string = "Europe/London"
): BannerConfig {
  const isActiveWindow = (b: BannerConfig) => {
    if (!b.activeFrom && !b.activeUntil) return false;
    const fmt = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
    const mkKey = (d: Date) => fmt.format(d);
    const toDate = (iso?: string) => (iso ? new Date(iso) : undefined);

    const start = toDate(b.activeFrom);
    const end = toDate(b.activeUntil);
    const nowKey = +new Date(mkKey(now));
    const startKey = start ? +new Date(mkKey(start)) : -Infinity;
    const endKey = end ? +new Date(mkKey(end)) : Infinity;
    return nowKey >= startKey && nowKey < endKey;
  };

  const actives = BANNERS.filter(isActiveWindow);
  if (actives.length) return actives[0];

  const pool = BANNERS.filter((b) => !b.activeFrom && !b.activeUntil);
  if (!pool.length) return BANNERS[0];

  // Deterministic “day index” for rotation
  const pad = (n: number) => String(n).padStart(2, "0");
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" })
    .format(now)
    .split("-");
  const y = Number(parts[0]);
  const m = Number(parts[1]);
  const d = Number(parts[2]);
  const today = new Date(`${y}-${pad(m)}-${pad(d)}T00:00:00Z`);
  const startOfYear = new Date(`${y}-01-01T00:00:00Z`);
  const dayIndex = Math.floor((+today - +startOfYear) / 86_400_000);

  // Build weighted list
  const weighted: BannerConfig[] = [];
  pool.forEach((b) => {
    const w = Math.max(1, Math.floor(b.weight ?? 1));
    for (let i = 0; i < w; i++) weighted.push(b);
  });

  return weighted[dayIndex % weighted.length] ?? pool[0];
}
