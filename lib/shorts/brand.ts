// lib/shorts/brand.ts — SHORTS BRAND EQUITY ENGINE (Single Source of Truth)
// Purpose: brand voice + typographic doctrine + equity mechanics.
// This module exports COPY + TOKENS (classNames) + CLIENT-only mechanics.

export type TimeBucket = "morning" | "afternoon" | "evening" | "night";

export type Imprint = {
  slug: string;
  title: string;
  ts: number;
  expiresAt: number;
  _fadePercent?: number;
  _hoursRemaining?: number;
};

/* -----------------------------------------------------------------------------
  BRAND DOCTRINE
  - This is a luxury system: restraint > explanation.
----------------------------------------------------------------------------- */
export const SHORTS_BRAND = {
  // Naming (these are internal ritual names, not UI bloat)
  systemName: "Wellness Centre",
  protocolName: "Protocol",
  imprintName: "Aftercare",
  returnLoopName: "Return Loop",

  // Hero copy — one line only. No manifesto.
  eyebrow: "FIELD NOTES",
  heroLine: "Small doses. Clean alignment.",
  signature: "Take one. Leave. Return.",

  // Micro labels (never shouty)
  equity: {
    streakLabel: "Return",
    notesLabel: "Notes",
    visitLabel: "Visit",
  },

  // Voice rules: avoid “guru” phrasing
  voice: {
    banned: [
      "conditioning",
      "nervous system",
      "desperate",
      "binge",
      "oxygen",
      "protocol" /* overused word — keep it as a label, not a sermon */,
    ],
    preferredReplacements: {
      conditioning: "calibration",
      "nervous system": "baseline",
      desperate: "rushed",
      binge: "consume",
      oxygen: "clarity",
      protocol: "method",
    },
  },

  // Typography doctrine (Tailwind tokens). These should be used directly in the page.
  // IMPORTANT: these assume your tailwind.config sets fontFamily.serif/editorial/sans/mono.
  type: {
    // micro type: cold, engineered
    micro:
      "font-mono text-[10px] uppercase tracking-[0.55em] text-white/14",

    // micro stronger (for labels)
    microStrong:
      "font-mono text-[10px] uppercase tracking-[0.62em] text-white/20",

    // eyebrow: brand signature style (subtle amber)
    eyebrow:
      "font-mono text-[10px] uppercase tracking-[0.68em] text-amber-500/22",

    // hero title: editorial serif, tight, cathedral
    title:
      "font-editorial italic tracking-[-0.065em] text-white leading-[0.78] select-none",

    // hero dot / punctuation
    punct:
      "font-editorial italic tracking-[-0.06em] text-amber-500/10 select-none",

    // oath line: mono, hushed, balanced
    oath:
      "font-mono text-[10px] uppercase tracking-[0.58em] text-white/16",

    // whisper: ultra light, peripheral
    whisper:
      "font-mono text-[10px] uppercase tracking-[0.45em] text-white/12",

    whisperRare:
      "font-mono text-[10px] uppercase tracking-[0.45em] text-amber-500/18",

    // imprint ghost (desktop only usually)
    imprintGhost:
      "font-mono text-[9px] uppercase tracking-[0.45em] text-white/10",
  },

  // Layout doctrine: spacing scales used by Shorts
  layout: {
    heroPadTop: "pt-44",
    heroPadBottom: "pb-28",
    ribbonBottom: "bottom-8",
    maxHero: "max-w-6xl",
  },
} as const;

// Storage keys (internal only)
const SHORTS_KEYS = {
  IMPRINT_LAST: "aol_shorts_imprint_last",
  IMPRINT_HISTORY: "aol_shorts_imprint_history",
  BOOKMARKS: "aol_shorts_bookmarks",
  SEED: "aol_shorts_whisper_seed",
  STREAK: "aol_shorts_streak",
  VISITS: "aol_shorts_visits",
  LAST_SEEN: "aol_shorts_last_seen_session",
  LAST_VISIT_TS: "aol_shorts_last_timestamp",
} as const;

/* -----------------------------------------------------------------------------
  SLUG HYGIENE
----------------------------------------------------------------------------- */
export function cleanSlugForURL(slug: string): string {
  if (!slug) return "";
  return slug
    .replace(/^\/+|\/+$/g, "")
    .replace(/^shorts\//i, "")
    .replace(/\/+/g, "/")
    .trim();
}

/* -----------------------------------------------------------------------------
  WHISPERS — luxury restraint
  Notes:
  - No therapy-talk.
  - No “conditioning / nervous system” language.
  - Strong, clean, minimal.
----------------------------------------------------------------------------- */
export const WHISPERS = [
  "Stay. Something is settling.",
  "You don’t need all of it today.",
  "Most people rush past this part.",
  "Clarity accumulates quietly.",
  "One note. Then execution.",
  "Take one. Leave. Return.",
  "Close the tab. Let it work.",
  "Quiet first. Noise later.",
  "Read once. Move well.",
  "Revisit when you’re ready — not rushed.",
  "The gap between visits matters.",
  "Keep it clean. Keep moving.",
] as const;

export const TIME_WHISPERS: Record<TimeBucket, readonly string[]> = {
  morning: [
    "Start clean. Don’t negotiate with fog.",
    "One note — then order your day.",
    "Quiet first. Noise later.",
  ],
  afternoon: [
    "Re-centre. Then execute.",
    "If you feel scattered, return.",
    "You’re not behind — you’re recalibrating.",
  ],
  evening: [
    "Close the loop. Let today end well.",
    "Review without self-hate.",
    "Repair before rest.",
  ],
  night: [
    "Don’t spiral. Return to baseline.",
    "The mind lies at night. Simplify.",
    "Sleep is strategy. So is letting go.",
  ],
} as const;

export const RARE_LINES = [
  "Today you don’t have to be strong. Only honest.",
  "You have permission to begin again — properly.",
  "God is not rushed. Neither are you.",
  "This is a hinge-day. Do the next right thing.",
] as const;

export function getTimeBucket(d: Date): TimeBucket {
  const h = d.getHours();
  if (h >= 5 && h < 12) return "morning";
  if (h >= 12 && h < 17) return "afternoon";
  if (h >= 17 && h < 22) return "evening";
  return "night";
}

function dayOfYear(d: Date): number {
  const start = new Date(d.getFullYear(), 0, 0);
  return Math.floor((d.getTime() - start.getTime()) / 86_400_000);
}

function pick<T>(arr: readonly T[], seed: number): T {
  return arr[seed % arr.length];
}

export function computeWhisper(opts: {
  seed: number;
  visitCount: number;
  now: Date;
}): { text: string; isRare: boolean } {
  const { seed, visitCount, now } = opts;

  const rareDay = (seed % 365) + 1;
  const today = dayOfYear(now);
  const isRare = today === rareDay;

  if (isRare) {
    const bucket = getTimeBucket(now);
    const base = pick(RARE_LINES, seed + today);
    const timeNudge = pick(TIME_WHISPERS[bucket], seed + today + 77);
    return { text: seed % 2 === 0 ? base : timeNudge, isRare: true };
  }

  // rotate only after 3 visits (3,6,9…)
  const rotationIndex = Math.floor(Math.max(1, visitCount) / 3);
  const base = pick(WHISPERS, seed + rotationIndex);

  const bucket = getTimeBucket(now);
  const timeLine = pick(TIME_WHISPERS[bucket], seed + rotationIndex + 13);

  // ~25% time-based
  const chooseTime = (seed + rotationIndex) % 4 === 0;
  return { text: chooseTime ? timeLine : base, isRare: false };
}

/* -----------------------------------------------------------------------------
  IMPRINT + EQUITY MECHANICS (Client-only)
----------------------------------------------------------------------------- */
const HOURS_72 = 72 * 60 * 60 * 1000;

export function createImprint(slug: string, title: string): Imprint {
  const now = Date.now();
  return { slug: cleanSlugForURL(slug), title, ts: now, expiresAt: now + HOURS_72 };
}

export function readImprint(): Imprint | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SHORTS_KEYS.IMPRINT_LAST);
    if (!raw) return null;

    const imprint = JSON.parse(raw) as Imprint;
    const now = Date.now();

    if (
      imprint &&
      typeof imprint.slug === "string" &&
      typeof imprint.title === "string" &&
      typeof imprint.expiresAt === "number" &&
      now < imprint.expiresAt
    ) {
      const elapsed = now - imprint.ts;
      const fadePercent = Math.min(100, Math.floor((elapsed / HOURS_72) * 100));
      return {
        ...imprint,
        _fadePercent: fadePercent,
        _hoursRemaining: Math.max(0, Math.floor((imprint.expiresAt - now) / (60 * 60 * 1000))),
      };
    }

    localStorage.removeItem(SHORTS_KEYS.IMPRINT_LAST);
    return null;
  } catch {
    return null;
  }
}

export function writeImprint(slug: string, title: string) {
  if (typeof window === "undefined") return;
  try {
    const imprint = createImprint(slug, title);
    localStorage.setItem(SHORTS_KEYS.IMPRINT_LAST, JSON.stringify(imprint));

    // Maintain a short history (Return Loop)
    const historyKey = SHORTS_KEYS.IMPRINT_HISTORY;
    const existing = JSON.parse(localStorage.getItem(historyKey) || "[]") as Imprint[];
    const filtered = existing.filter((x) => x?.slug !== imprint.slug);
    const next = [imprint, ...filtered].slice(0, 5);
    localStorage.setItem(historyKey, JSON.stringify(next));
  } catch {
    // ignore
  }
}

export function getOrCreateSeed(): number {
  if (typeof window === "undefined") return 1337;
  let seed = Number(localStorage.getItem(SHORTS_KEYS.SEED));
  if (!Number.isFinite(seed)) {
    seed = Math.floor(Math.random() * 10_000);
    localStorage.setItem(SHORTS_KEYS.SEED, String(seed));
  }
  return seed;
}

export function updateStreak(): number {
  if (typeof window === "undefined") return 1;

  const now = Date.now();
  const lastVisit = Number(localStorage.getItem(SHORTS_KEYS.LAST_VISIT_TS) || "0");
  const currentStreak = Number(localStorage.getItem(SHORTS_KEYS.STREAK) || "1");
  const msInDay = 86_400_000;

  const sameDay =
    lastVisit > 0 &&
    new Date(lastVisit).getFullYear() === new Date(now).getFullYear() &&
    new Date(lastVisit).getMonth() === new Date(now).getMonth() &&
    new Date(lastVisit).getDate() === new Date(now).getDate();

  if (sameDay) return Math.max(1, currentStreak);

  const within48h = lastVisit > 0 && now - lastVisit < msInDay * 2;
  const next = within48h ? Math.max(1, currentStreak) + 1 : 1;

  localStorage.setItem(SHORTS_KEYS.STREAK, String(next));
  localStorage.setItem(SHORTS_KEYS.LAST_VISIT_TS, String(now));
  return next;
}

export function updateVisitCount(): number {
  if (typeof window === "undefined") return 1;

  const now = Date.now();
  const lastSeen = Number(localStorage.getItem(SHORTS_KEYS.LAST_SEEN) || "0");
  const NEW_VISIT_WINDOW = 45 * 60 * 1000;

  let visits = Number(localStorage.getItem(SHORTS_KEYS.VISITS) || "1");
  if (!Number.isFinite(visits) || visits < 1) visits = 1;

  const isNewVisit = !lastSeen || now - lastSeen > NEW_VISIT_WINDOW;
  if (isNewVisit) {
    visits += 1;
    localStorage.setItem(SHORTS_KEYS.VISITS, String(visits));
  }

  localStorage.setItem(SHORTS_KEYS.LAST_SEEN, String(now));
  return visits;
}