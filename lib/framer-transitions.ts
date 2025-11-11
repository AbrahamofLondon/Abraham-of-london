// lib/framer-transitions.ts

// =============================================================================
// CORE TRANSITION PRESETS
// =============================================================================

/**
 * Spring-based transitions for natural, physics-based animations
 */
export const springTransition = {
  type: "spring" as const,
  stiffness: 100,
  damping: 20,
  mass: 1,
} as const;

export const fastSpringTransition = {
  type: "spring" as const,
  stiffness: 300,
  damping: 30,
  mass: 0.8,
} as const;

export const bouncySpringTransition = {
  type: "spring" as const,
  stiffness: 200,
  damping: 15,
  mass: 1,
} as const;

export const gentleSpringTransition = {
  type: "spring" as const,
  stiffness: 60,
  damping: 18,
  mass: 1.2,
} as const;

export const stiffSpringTransition = {
  type: "spring" as const,
  stiffness: 500,
  damping: 40,
  mass: 0.5,
} as const;

/**
 * Duration-based transitions for precise timing control
 */
export const instantTransition = {
  duration: 0.1,
  ease: "linear" as const,
} as const;

export const microTransition = {
  duration: 0.15,
  ease: "easeOut" as const,
} as const;

export const shortTransition = {
  duration: 0.3,
  ease: "easeOut" as const,
} as const;

export const defaultTransition = {
  duration: 0.5,
  ease: "easeOut" as const,
} as const;

export const longTransition = {
  duration: 0.8,
  ease: "easeOut" as const,
} as const;

export const extraLongTransition = {
  duration: 1.2,
  ease: "easeOut" as const,
} as const;

// =============================================================================
// EASING PRESETS
// =============================================================================

export const easeInOutTransition = {
  duration: 0.5,
  ease: [0.4, 0, 0.2, 1] as const, // Material Design ease
} as const;

export const easeInTransition = {
  duration: 0.5,
  ease: [0.4, 0, 1, 1] as const,
} as const;

export const easeOutTransition = {
  duration: 0.5,
  ease: [0, 0, 0.2, 1] as const,
} as const;

export const sharpTransition = {
  duration: 0.4,
  ease: [0.4, 0, 0.6, 1] as const,
} as const;

export const smoothTransition = {
  duration: 0.6,
  ease: [0.25, 0.46, 0.45, 0.94] as const, // easeOutQuad
} as const;

// =============================================================================
// SPECIALIZED TRANSITIONS
// =============================================================================

/**
 * Page transitions for route changes
 */
export const pageTransition = {
  duration: 0.4,
  ease: [0.25, 0.46, 0.45, 0.94] as const,
} as const;

export const modalTransition = {
  duration: 0.3,
  ease: [0.4, 0, 0.2, 1] as const,
} as const;

export const drawerTransition = {
  type: "spring" as const,
  stiffness: 300,
  damping: 30,
} as const;

/**
 * Loading and infinite animations
 */
export const loaderTransition = {
  repeat: Infinity,
  duration: 1.4,
  ease: "easeInOut" as const,
} as const;

export const linearTransition = {
  repeat: Infinity,
  duration: 1.4,
  ease: "linear" as const,
} as const;

export const pulseTransition = {
  repeat: Infinity,
  duration: 2,
  ease: "easeInOut" as const,
} as const;

export const breatheTransition = {
  repeat: Infinity,
  duration: 3,
  ease: "easeInOut" as const,
} as const;

// =============================================================================
// STAGGER UTILITIES
// =============================================================================

export const staggeredTransition = (delay: number = 0.1) =>
  ({
    duration: 0.5,
    delay,
    ease: "easeOut" as const,
  }) as const;

export const staggeredSpringTransition = (delay: number = 0.1) =>
  ({
    ...springTransition,
    delay,
  }) as const;

export const staggeredFastSpringTransition = (delay: number = 0.05) =>
  ({
    ...fastSpringTransition,
    delay,
  }) as const;

// =============================================================================
// COMPOSITE TRANSITIONS
// =============================================================================

/**
 * Combined transitions for complex animations
 */
export const slideUpTransition = {
  ...defaultTransition,
  ease: "easeOut" as const,
} as const;

export const slideDownTransition = {
  ...defaultTransition,
  ease: "easeOut" as const,
} as const;

export const fadeInTransition = {
  ...longTransition,
  ease: "easeOut" as const,
} as const;

export const scaleTransition = {
  ...fastSpringTransition,
} as const;

export const rotateTransition = {
  ...springTransition,
} as const;

// =============================================================================
// TRANSITION GENERATORS
// =============================================================================

/**
 * Generate custom transitions with parameters
 */
export const createSpringTransition = (
  stiffness: number = 100,
  damping: number = 20,
  mass: number = 1,
) => ({
  type: "spring" as const,
  stiffness,
  damping,
  mass,
});

export const createDurationTransition = (
  duration: number = 0.5,
  ease: string = "easeOut",
) => ({
  duration,
  ease: ease as const,
});

export const createStaggeredTransition =
  (baseTransition: unknown, staggerDelay: number = 0.1) =>
  (index: number) => ({
    ...baseTransition,
    delay: index * staggerDelay,
  });

// =============================================================================
// PRESET COLLECTIONS
// =============================================================================

/**
 * Pre-configured transition sets for common use cases
 */
export const TransitionPresets = {
  // UI Components
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

  // Interactive Elements
  hover: microTransition,
  tap: instantTransition,
  focus: microTransition,
} as const;

/**
 * Easing curves for advanced animations
 */
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
// TYPE DEFINITIONS
// =============================================================================

export type SpringTransition = typeof springTransition;
export type DurationTransition = typeof defaultTransition;
export type StaggeredTransition = ReturnType<typeof staggeredTransition>;
export type TransitionPreset = keyof typeof TransitionPresets;

/**
 * Utility type for transition props
 */
export type TransitionConfig =
  | SpringTransition
  | DurationTransition
  | { [key: string]: unknown };

// =============================================================================
// EXPORT ALL TRANSITIONS
// =============================================================================

export default {
  // Core
  springTransition,
  fastSpringTransition,
  bouncySpringTransition,
  gentleSpringTransition,
  stiffSpringTransition,

  // Duration-based
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

  // Presets & Utilities
  TransitionPresets,
  EasingCurves,
  createSpringTransition,
  createDurationTransition,
  createStaggeredTransition,
};
