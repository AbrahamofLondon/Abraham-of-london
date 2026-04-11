/**
 * lib/design/tokens.ts
 *
 * Authoritative design system tokens for the Abraham of London platform.
 *
 * IMPORTANT — How to use this file:
 * - This is the REFERENCE SPEC, not a replacement for Tailwind classes.
 * - Use these values when writing inline styles, framer-motion variants,
 *   canvas drawing, PDF generation, or any context where Tailwind classes
 *   are unavailable.
 * - Do NOT replace working Tailwind classes with imports from this file
 *   unless you are explicitly migrating a component to inline-style architecture.
 * - All values here are the canonical source — if globals.css or
 *   tailwind.config.js disagree with this file, this file wins and the
 *   other two should be updated to match.
 *
 * GOLD NOTE:
 * The platform has two gold values with distinct roles:
 *   softGold  #C9A96E  — primary brand accent (Cormorant-era institutional gold)
 *   amber     #F59E0B  — high-emphasis accent (amber-500, used for CTAs and
 *                        interactive states that need maximum visibility)
 * Never substitute one for the other. softGold is the identity. amber is the action.
 */

// ─────────────────────────────────────────────────────────────────────────────
// COLOUR TOKENS
// ─────────────────────────────────────────────────────────────────────────────

export const colors = {
  // Background scale — darkest to most lifted
  bg: {
    /** #030305 — absolute void, hero backdrop, deepest sections */
    void:    "#030305",
    /** #060609 — canonical base, used everywhere as default background */
    base:    "#060609",
    /** #09090C — slightly lifted panels */
    lifted:  "#09090C",
    /** #0E0E12 — panel/card background */
    panel:   "#0E0E12",
    /** rgba overlay for glass panels */
    glass:   "rgba(0, 0, 0, 0.40)",
    /** rgba overlay for deep glass cards */
    deep:    "rgba(0, 0, 0, 0.55)",
    /** rgba overlay for subtle surface tints */
    surface: "rgba(255, 255, 255, 0.02)",
  },

  // Gold — the single brand accent, two roles
  gold: {
    /** #C9A96E — softGold, primary brand accent, identity-level use */
    soft:       "#C9A96E",
    /** #B89B6E — muted gold for low-emphasis use */
    muted:      "#B89B6E",
    /** #F59E0B — amber-500, high-emphasis CTAs and interactive states */
    strong:     "#F59E0B",
    /** #B45309 — amber-700, hover states on strong gold */
    strongDark: "#B45309",
  },

  // Text / ink
  text: {
    /** #FFFFFF — full white, primary text */
    primary: "#FFFFFF",
    /** rgba white at 85% — slightly warm, body copy */
    body:    "rgba(255, 255, 255, 0.85)",
    /** rgba white at 55% — secondary text, descriptions */
    muted:   "rgba(255, 255, 255, 0.55)",
    /** rgba white at 38% — tertiary text, captions */
    dim:     "rgba(255, 255, 255, 0.38)",
    /** rgba white at 22% — labels, eyebrow tags */
    faint:   "rgba(255, 255, 255, 0.22)",
  },

  // Borders
  border: {
    /** rgba white at 7% — default panel border */
    subtle:  "rgba(255, 255, 255, 0.07)",
    /** rgba white at 10% — standard border */
    default: "rgba(255, 255, 255, 0.10)",
    /** rgba white at 14% — hover/active border */
    strong:  "rgba(255, 255, 255, 0.14)",
    /** softGold at 18% — gold panel border */
    gold:    "rgba(201, 169, 110, 0.18)",
    /** softGold at 30% — gold rule/hairline */
    goldRule: "rgba(201, 169, 110, 0.30)",
    /** amber at 20% — action element border */
    amber:   "rgba(245, 158, 11, 0.20)",
    /** amber at 25% — hover amber border */
    amberStrong: "rgba(245, 158, 11, 0.25)",
  },

  // Status
  status: {
    danger:  "#EF4444",  // red-500
    success: "#22C55E",  // green-500
    warning: "#EAB308",  // yellow-500
    info:    "#3B82F6",  // blue-500
  },
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// TYPOGRAPHY TOKENS
// ─────────────────────────────────────────────────────────────────────────────

export const typography = {
  // Font families — must match tailwind.config.js fontFamily and _document.tsx
  fontFamily: {
    /** Cormorant Garamond — institutional serif, all headings */
    serif: "'Cormorant Garamond', Georgia, ui-serif, serif",
    /** JetBrains Mono — precision mono, all labels and data */
    mono:  "'JetBrains Mono', ui-monospace, SFMono-Regular, monospace",
    /** Inter — clean sans, body copy where needed */
    sans:  "Inter, ui-sans-serif, system-ui, sans-serif",
  },

  // Eyebrow label standard — used on every section header
  eyebrow: {
    fontSize:      "8.5px",
    letterSpacing: "0.40em",
    textTransform: "uppercase" as const,
    fontFamily:    "'JetBrains Mono', ui-monospace, monospace",
  },

  // Monospace label variants
  mono: {
    xs:  { fontSize: "7px",   letterSpacing: "0.40em" },
    sm:  { fontSize: "8px",   letterSpacing: "0.34em" },
    md:  { fontSize: "9px",   letterSpacing: "0.30em" },
    lg:  { fontSize: "10px",  letterSpacing: "0.26em" },
  },
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// ANIMATION TOKENS
// ─────────────────────────────────────────────────────────────────────────────

export const animation = {
  duration: {
    /** 0.35s — micro-interactions, hover states */
    fast:   0.35,
    /** 0.6s  — standard entrance animation */
    base:   0.60,
    /** 0.75s — primary heading entrance */
    medium: 0.75,
    /** 0.9s  — large hero text entrance */
    slow:   0.90,
    /** 1.05s — monumental wordmark entrance */
    epic:   1.05,
  },
  /** Standard easing — matches framer-motion easeOut */
  ease: "easeOut" as const,
  /** Cinematic ease for large text entrances */
  easeEpic: [0.22, 1, 0.36, 1] as [number, number, number, number],
  /** Institutional ease for panel reveals */
  easePanel: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
  /** Stagger delay between child elements */
  stagger: {
    tight:  0.06,
    base:   0.09,
    loose:  0.14,
  },
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// BORDER RADIUS TOKENS
// ─────────────────────────────────────────────────────────────────────────────

export const radii = {
  /** 2px — institutional panels, flagship cards. Sharp = confident. */
  panel:     "2px",
  /** 12px — chips, badges, small interactive elements */
  chip:      "12px",
  /** 16px — medium cards */
  cardSm:    "16px",
  /** 22px — standard cards, diagnostic panels */
  card:      "22px",
  /** 28px — large cards, section panels */
  cardLg:    "28px",
  /** 9999px — pills, rounded badges */
  pill:      "9999px",
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// SPACING TOKENS (Tailwind class strings)
// ─────────────────────────────────────────────────────────────────────────────

export const spacing = {
  section: {
    /** Standard section vertical padding */
    y:    "py-20 lg:py-28",
    /** Tighter section for bridge/connector sections */
    yTight: "py-12 lg:py-16",
  },
  hero: {
    /** Homepage hero padding */
    y:    "pb-20 pt-36 lg:pb-28 lg:pt-44",
    /** Interior page hero padding */
    yInner: "pb-20 pt-40 lg:pb-28 lg:pt-48",
  },
  container: {
    /** Max-width container with responsive horizontal padding */
    base: "mx-auto max-w-7xl px-6 sm:px-8 lg:px-12",
  },
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// SHADOW TOKENS
// ─────────────────────────────────────────────────────────────────────────────

export const shadows = {
  /** Standard panel shadow */
  panel:     "0 32px 100px -50px rgba(0, 0, 0, 0.98)",
  /** Gold-accented panel shadow */
  goldPanel: "0 0 90px -35px rgba(201, 169, 110, 0.18)",
  /** Card hover shadow */
  cardHover: "0 28px 80px -30px rgba(0, 0, 0, 0.82), inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 0 36px rgba(201, 169, 110, 0.06)",
  /** Terminal/deep surface shadow */
  terminal:  "0 28px 90px rgba(0, 0, 0, 0.46), inset 0 1px 0 rgba(255, 255, 255, 0.04)",
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// FRAMER-MOTION PRESETS
// Reusable motion variants for consistent page-load animations.
// Import these directly into components that use framer-motion.
// ─────────────────────────────────────────────────────────────────────────────

export const motionPresets = {
  /** Standard fade + rise entrance */
  fadeUp: {
    hidden: { opacity: 0, y: 22 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: animation.duration.medium,
        ease: animation.easePanel,
      },
    },
  },

  /** Pure fade — for overlays and backgrounds */
  fadeIn: {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { duration: animation.duration.base },
    },
  },

  /** Slide in from right — for sidebar/right-column reveals */
  slideRight: {
    hidden: { opacity: 0, x: 16 },
    show: {
      opacity: 1,
      x: 0,
      transition: {
        duration: animation.duration.medium,
        ease: animation.easePanel,
      },
    },
  },

  /** Stagger parent — wraps a set of fadeUp children */
  staggerTight: {
    hidden: {},
    show: { transition: { staggerChildren: animation.stagger.tight } },
  },
  staggerBase: {
    hidden: {},
    show: { transition: { staggerChildren: animation.stagger.base } },
  },
  staggerLoose: {
    hidden: {},
    show: { transition: { staggerChildren: animation.stagger.loose } },
  },

  /** Monumental wordmark entrance — for hero-scale typography */
  wordmark: {
    hidden: { opacity: 0, y: 32 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: animation.duration.epic,
        ease: animation.easeEpic,
      },
    },
  },
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// VIEWPORT THRESHOLDS
// Standard whileInView viewport margin values for scroll-triggered animations.
// ─────────────────────────────────────────────────────────────────────────────

export const viewport = {
  /** Standard — triggers slightly before element enters view */
  standard: { once: true, margin: "-60px" } as const,
  /** Early — triggers further before element enters view */
  early:    { once: true, margin: "-100px" } as const,
  /** Late  — waits until element is more visible */
  late:     { once: true, margin: "-20px" } as const,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// SHORTHAND EXPORT
// ─────────────────────────────────────────────────────────────────────────────

export const ds = {
  colors,
  typography,
  animation,
  radii,
  spacing,
  shadows,
  motionPresets,
  viewport,
} as const;

export default ds;