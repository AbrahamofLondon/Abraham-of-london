// ---------------------------------------------------------------------------------
// Lightweight transition typings (no framer-motion import needed)
// ---------------------------------------------------------------------------------
export type EasingName = "linear" | "easeIn" | "easeOut" | "easeInOut";
export type CubicBezier = readonly [number, number, number, number];

export type SpringConfig = {
  type: "spring";
  stiffness?: number;
  damping?: number;
  mass?: number;
  delay?: number;
};

export type DurationConfig = {
  duration: number;
  ease: EasingName | CubicBezier;
  delay?: number;
  repeat?: number | "Infinity";
};

export type TransitionLike = SpringConfig | DurationConfig;

// =============================================================================
// CORE TRANSITION PRESETS
// =============================================================================

/** Spring-based transitions (natural, physics-based) */
export const springTransition = {
  type: "spring",
  stiffness: 100,
  damping: 20,
  mass: 1,
} as const satisfies SpringConfig;

export const fastSpringTransition = {
  type: "spring",
  stiffness: 300,
  damping: 30,
  mass: 0.8,
} as const satisfies SpringConfig;

export const bouncySpringTransition = {
  type: "spring",
  stiffness: 200,
  damping: 15,
  mass: 1,
} as const satisfies SpringConfig;

export const gentleSpringTransition = {
  type: "spring",
  stiffness: 60,
  damping: 18,
  mass: 1.2,
} as const satisfies SpringConfig;

export const stiffSpringTransition = {
  type: "spring",
  stiffness: 500,
  damping: 40,
  mass: 0.5,
} as const satisfies SpringConfig;

/** Duration-based transitions (precise timing) */
export const instantTransition = {
  duration: 0.1,
  ease: "linear",
} as const satisfies DurationConfig;

export const microTransition = {
  duration: 0.15,
  ease: "easeOut",
} as const satisfies DurationConfig;

export const shortTransition = {
  duration: 0.3,
  ease: "easeOut",
} as const satisfies DurationConfig;

export const defaultTransition = {
  duration: 0.5,
  ease: "easeOut",
} as const satisfies DurationConfig;

export const longTransition = {
  duration: 0.8,
  ease: "easeOut",
} as const satisfies DurationConfig;

export const extraLongTransition = {
  duration: 1.2,
  ease: "easeOut",
} as const satisfies DurationConfig;

// =============================================================================
// EASING PRESETS
// =============================================================================

export const easeInOutTransition = {
  duration: 0.5,
  ease: [0.4, 0, 0.2, 1] as const, // Material Design standard
} as const satisfies DurationConfig;

export const easeInTransition = {
  duration: 0.5,
  ease: [0.4, 0, 1, 1] as const,
} as const satisfies DurationConfig;

export const easeOutTransition = {
  duration: 0.5,
  ease: [0, 0, 0.2, 1] as const,
} as const satisfies DurationConfig;

export const sharpTransition = {
  duration: 0.4,
  ease: [0.4, 0, 0.6, 1] as const,
} as const satisfies DurationConfig;

export const smoothTransition = {
  duration: 0.6,
  ease: [0.25, 0.46, 0.45, 0.94] as const, // easeOutQuad-like
} as const satisfies DurationConfig;

// =============================================================================
// SPECIALIZED TRANSITIONS
// =============================================================================

/** Page & overlay */
export const pageTransition = {
  duration: 0.4,
  ease: [0.25, 0.46, 0.45, 0.94] as const,
} as const satisfies DurationConfig;

export const modalTransition = {
  duration: 0.3,
  ease: [0.4, 0, 0.2, 1] as const,
} as const satisfies DurationConfig;

export const drawerTransition = {
  type: "spring",
  stiffness: 300,
  damping: 30,
} as const satisfies SpringConfig;

/** Loading & infinite */
export const loaderTransition = {
  repeat: Infinity as unknown as "Infinity", // keep type simple without framer types
  duration: 1.4,
  ease: "easeInOut",
} as const satisfies DurationConfig;

export const linearTransition = {
  repeat: Infinity as unknown as "Infinity",
  duration: 1.4,
  ease: "linear",
} as const satisfies DurationConfig;

export const pulseTransition = {
  repeat: Infinity as unknown as "Infinity",
  duration: 2,
  ease: "easeInOut",
} as const satisfies DurationConfig;

export const breatheTransition = {
  repeat: Infinity as unknown as "Infinity",
  duration: 3,
  ease: "easeInOut",
} as const satisfies DurationConfig;

// =============================================================================
// STAGGER UTILITIES
// =============================================================================

export const staggeredTransition = (delay: number = 0.1) =>
  ({
    duration: 0.5,
    delay,
    ease: "easeOut",
  } as const satisfies DurationConfig);

export const staggeredSpringTransition = (delay: number = 0.1) =>
  ({
    ...springTransition,
    delay,
  } as const satisfies SpringConfig & { delay: number });

export const staggeredFastSpringTransition = (delay: number = 0.05) =>
  ({
    ...fastSpringTransition,
    delay,
  } as const satisfies SpringConfig & { delay: number });

// =============================================================================
// COMPOSITE TRANSITIONS
// =============================================================================

export const slideUpTransition = {
  ...defaultTransition,
  ease: "easeOut",
} as const satisfies DurationConfig;

export const slideDownTransition = {
  ...defaultTransition,
  ease: "easeOut",
} as const satisfies DurationConfig;

export const fadeInTransition = {
  ...longTransition,
  ease: "easeOut",
} as const satisfies DurationConfig;

export const scaleTransition = {
  ...fastSpringTransition,
} as const satisfies SpringConfig;

export const rotateTransition = {
  ...springTransition,
} as const satisfies SpringConfig;

// =============================================================================
// TRANSITION GENERATORS
// =============================================================================

export const createSpringTransition = (
  stiffness: number = 100,
  damping: number = 20,
  mass: number = 1,
  delay?: number,
): SpringConfig => ({
  type: "spring",
  stiffness,
  damping,
  mass,
  ...(typeof delay === "number" ? { delay } : {}),
});

export const createDurationTransition = (
  duration: number = 0.5,
  ease: EasingName | CubicBezier = "easeOut",
  delay?: number,
  repeat?: number | "Infinity",
): DurationConfig => ({
  duration,
  ease,
  ...(typeof delay === "number" ? { delay } : {}),
  ...(typeof repeat !== "undefined" ? { repeat } : {}),
});

export const createStaggeredTransition =
  <T extends TransitionLike>(base: T, staggerDelay: number = 0.1) =>
  (index: number): T & { delay: number } => ({
    ...base,
    delay: (base as any).delay ? (base as any).delay + index * staggerDelay : index * staggerDelay,
  });

// =============================================================================
// PRESET COLLECTIONS
// =============================================================================

export const TransitionPresets = {
  // UI
  button: fastSpringTransition,
  card: springTransition,
  input: microTransition,
  tooltip: shortTransition,

  // Navigation
  navbar: fastSpringTransition,
  sidebar: drawerTransition,
  dropdown: shortTransition,

  // Page Elements
  hero: longTransition,
  section: defaultTransition,
  footer: longTransition,

  // Interactive
  hover: microTransition,
  tap: instantTransition,
  focus: microTransition,
} as const;

export const EasingCurves = {
  standard: [0.4, 0, 0.2, 1] as const,
  enter: [0, 0, 0.2, 1] as const,
  exit: [0.4, 0, 1, 1] as const,
  sharp: [0.4, 0, 0.6, 1] as const,
  easeOut: [0, 0, 0.2, 1] as const,
  easeIn: [0.4, 0, 1, 1] as const,
  easeInOut: [0.4, 0, 0.2, 1] as const,
  bounce: [0.68, -0.55, 0.265, 1.55] as const,
} as const;

// =============================================================================
// TYPES
// =============================================================================

export type SpringTransition = typeof springTransition;
export type DurationTransition = typeof defaultTransition;
export type StaggeredTransition = ReturnType<typeof staggeredTransition>;
export type TransitionPreset = keyof typeof TransitionPresets;
export type TransitionConfig = TransitionLike;

// =============================================================================
// DEFAULT EXPORT
// =============================================================================

export default {
  // Core
  springTransition,
  fastSpringTransition,
  bouncySpringTransition,
  gentleSpringTransition,
  stiffSpringTransition,

  // Duration
  instantTransition,
  microTransition,
  shortTransition,
  defaultTransition,
  longTransition,
  extraLongTransition,

  // Easing
  easeInOutTransition,
  easeInTransition,
  easeOutTransition,
  sharpTransition,
  smoothTransition,

  // Specialized
  pageTransition,
  modalTransition,
  drawerTransition,
  loaderTransition,
  linearTransition,
  pulseTransition,
  breatheTransition,

  // Staggered
  staggeredTransition,
  staggeredSpringTransition,
  staggeredFastSpringTransition,

  // Composite
  slideUpTransition,
  slideDownTransition,
  fadeInTransition,
  scaleTransition,
  rotateTransition,

  // Presets & utilities
  TransitionPresets,
  EasingCurves,
  createSpringTransition,
  createDurationTransition,
  createStaggeredTransition,
};