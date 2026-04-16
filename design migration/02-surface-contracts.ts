export type SurfaceDensity = "airy" | "balanced" | "compact";
export type SurfaceTone = "institutional" | "editorial" | "technical" | "restricted" | "kinetic";
export type HeroStyle = "stabilized" | "panel-led" | "cover-led" | "minimal" | "technical-frame";
export type MetadataEmphasis = "low" | "medium" | "high";
export type ReaderMode = "editorial" | "technical" | "library" | "shortform" | "restricted";
export type ImageRatio = "none" | "square" | "portrait" | "landscape" | "wide";
export type GradientRecipe = "none" | "ambient-radial" | "editorial-wash" | "technical-grid-wash" | "warm-restricted-wash";
export type ContrastTier = "strict" | "strong";

export type SurfaceContract = {
  id:
    | "home"
    | "canon"
    | "vault"
    | "vault-briefs"
    | "essays"
    | "shorts"
    | "books"
    | "library"
    | "downloads"
    | "resources"
    | "events"
    | "editorial"
    | "inner-circle";
  label: string;
  pathPrefix: string;
  tone: SurfaceTone;
  density: SurfaceDensity;
  heroStyle: HeroStyle;
  metadataEmphasis: MetadataEmphasis;
  readerMode: ReaderMode;
  defaultImageRatio: ImageRatio;
  gradientRecipe: GradientRecipe;
  textMaySitDirectlyOnGradient: boolean;
  requiresHeroScrim: boolean;
  maxGradientInfluencePercent: number;
  contrastTier: ContrastTier;
  semanticOverrides: Partial<Record<
    | "background"
    | "backgroundMuted"
    | "panel"
    | "panelAlt"
    | "border"
    | "borderStrong"
    | "text"
    | "textMuted"
    | "textSubtle"
    | "link"
    | "accent"
    | "accentSoft"
    | "heroWash"
    | "heroScrim"
    | "cardOverlay",
    string
  >>;
};

export const SURFACE_CONTRACTS: Record<SurfaceContract["id"], SurfaceContract> = {
  home: {
    id: "home",
    label: "Home",
    pathPrefix: "/",
    tone: "institutional",
    density: "airy",
    heroStyle: "stabilized",
    metadataEmphasis: "medium",
    readerMode: "editorial",
    defaultImageRatio: "wide",
    gradientRecipe: "ambient-radial",
    textMaySitDirectlyOnGradient: false,
    requiresHeroScrim: true,
    maxGradientInfluencePercent: 10,
    contrastTier: "strict",
    semanticOverrides: {
      accent: "amber",
      heroWash: "hero-amber-radial",
      heroScrim: "hero-dark-scrim",
    },
  },
  canon: {
    id: "canon",
    label: "Canon",
    pathPrefix: "/canon",
    tone: "editorial",
    density: "airy",
    heroStyle: "panel-led",
    metadataEmphasis: "medium",
    readerMode: "editorial",
    defaultImageRatio: "portrait",
    gradientRecipe: "editorial-wash",
    textMaySitDirectlyOnGradient: false,
    requiresHeroScrim: true,
    maxGradientInfluencePercent: 8,
    contrastTier: "strict",
    semanticOverrides: {
      accent: "warm-amber",
      panel: "bone-panel",
      panelAlt: "bone-panel-alt",
      heroWash: "editorial-warm-wash",
      heroScrim: "editorial-soft-scrim",
    },
  },
  vault: {
    id: "vault",
    label: "Vault",
    pathPrefix: "/vault",
    tone: "technical",
    density: "compact",
    heroStyle: "technical-frame",
    metadataEmphasis: "high",
    readerMode: "technical",
    defaultImageRatio: "landscape",
    gradientRecipe: "technical-grid-wash",
    textMaySitDirectlyOnGradient: false,
    requiresHeroScrim: true,
    maxGradientInfluencePercent: 8,
    contrastTier: "strict",
    semanticOverrides: {
      accent: "steel-amber",
      panel: "vault-panel",
      panelAlt: "vault-panel-alt",
      heroWash: "vault-grid-wash",
      heroScrim: "vault-dark-scrim",
    },
  },
  "vault-briefs": {
    id: "vault-briefs",
    label: "Vault Briefs",
    pathPrefix: "/briefs",
    tone: "technical",
    density: "compact",
    heroStyle: "technical-frame",
    metadataEmphasis: "high",
    readerMode: "technical",
    defaultImageRatio: "landscape",
    gradientRecipe: "technical-grid-wash",
    textMaySitDirectlyOnGradient: false,
    requiresHeroScrim: true,
    maxGradientInfluencePercent: 8,
    contrastTier: "strict",
    semanticOverrides: {
      accent: "steel-amber",
      panel: "vault-panel",
      panelAlt: "vault-panel-alt",
      heroWash: "vault-grid-wash",
      heroScrim: "vault-dark-scrim",
    },
  },
  essays: {
    id: "essays",
    label: "Essays",
    pathPrefix: "/blog",
    tone: "editorial",
    density: "balanced",
    heroStyle: "panel-led",
    metadataEmphasis: "medium",
    readerMode: "editorial",
    defaultImageRatio: "landscape",
    gradientRecipe: "editorial-wash",
    textMaySitDirectlyOnGradient: false,
    requiresHeroScrim: true,
    maxGradientInfluencePercent: 8,
    contrastTier: "strict",
    semanticOverrides: {
      accent: "amber",
      panel: "essay-panel",
      panelAlt: "essay-panel-alt",
      heroWash: "essay-warm-wash",
      heroScrim: "essay-reading-scrim",
    },
  },
  shorts: {
    id: "shorts",
    label: "Shorts",
    pathPrefix: "/shorts",
    tone: "kinetic",
    density: "balanced",
    heroStyle: "minimal",
    metadataEmphasis: "low",
    readerMode: "shortform",
    defaultImageRatio: "square",
    gradientRecipe: "ambient-radial",
    textMaySitDirectlyOnGradient: false,
    requiresHeroScrim: true,
    maxGradientInfluencePercent: 10,
    contrastTier: "strict",
    semanticOverrides: {
      accent: "amber",
      heroWash: "shorts-radial-wash",
      heroScrim: "shorts-soft-scrim",
    },
  },
  books: {
    id: "books",
    label: "Books",
    pathPrefix: "/books",
    tone: "editorial",
    density: "balanced",
    heroStyle: "cover-led",
    metadataEmphasis: "medium",
    readerMode: "library",
    defaultImageRatio: "portrait",
    gradientRecipe: "editorial-wash",
    textMaySitDirectlyOnGradient: false,
    requiresHeroScrim: true,
    maxGradientInfluencePercent: 8,
    contrastTier: "strict",
    semanticOverrides: {
      accent: "amber",
      panel: "library-panel",
      panelAlt: "library-panel-alt",
      heroWash: "library-wash",
      heroScrim: "library-dark-scrim",
    },
  },
  library: {
    id: "library",
    label: "Library",
    pathPrefix: "/library",
    tone: "institutional",
    density: "balanced",
    heroStyle: "minimal",
    metadataEmphasis: "medium",
    readerMode: "library",
    defaultImageRatio: "portrait",
    gradientRecipe: "none",
    textMaySitDirectlyOnGradient: false,
    requiresHeroScrim: false,
    maxGradientInfluencePercent: 0,
    contrastTier: "strict",
    semanticOverrides: {
      panel: "library-panel",
      panelAlt: "library-panel-alt",
      accent: "amber",
    },
  },
  downloads: {
    id: "downloads",
    label: "Downloads",
    pathPrefix: "/downloads",
    tone: "technical",
    density: "compact",
    heroStyle: "minimal",
    metadataEmphasis: "high",
    readerMode: "technical",
    defaultImageRatio: "landscape",
    gradientRecipe: "none",
    textMaySitDirectlyOnGradient: false,
    requiresHeroScrim: false,
    maxGradientInfluencePercent: 0,
    contrastTier: "strict",
    semanticOverrides: {
      panel: "vault-panel",
      panelAlt: "vault-panel-alt",
      accent: "steel-amber",
    },
  },
  resources: {
    id: "resources",
    label: "Resources",
    pathPrefix: "/resources",
    tone: "institutional",
    density: "balanced",
    heroStyle: "minimal",
    metadataEmphasis: "medium",
    readerMode: "library",
    defaultImageRatio: "landscape",
    gradientRecipe: "none",
    textMaySitDirectlyOnGradient: false,
    requiresHeroScrim: false,
    maxGradientInfluencePercent: 0,
    contrastTier: "strict",
    semanticOverrides: {
      panel: "resource-panel",
      panelAlt: "resource-panel-alt",
      accent: "amber",
    },
  },
  events: {
    id: "events",
    label: "Events",
    pathPrefix: "/events",
    tone: "institutional",
    density: "balanced",
    heroStyle: "panel-led",
    metadataEmphasis: "high",
    readerMode: "library",
    defaultImageRatio: "landscape",
    gradientRecipe: "ambient-radial",
    textMaySitDirectlyOnGradient: false,
    requiresHeroScrim: true,
    maxGradientInfluencePercent: 8,
    contrastTier: "strict",
    semanticOverrides: {
      accent: "amber",
      heroWash: "event-radial-wash",
      heroScrim: "event-dark-scrim",
    },
  },
  editorial: {
    id: "editorial",
    label: "Editorial",
    pathPrefix: "/editorial",
    tone: "editorial",
    density: "balanced",
    heroStyle: "panel-led",
    metadataEmphasis: "medium",
    readerMode: "editorial",
    defaultImageRatio: "landscape",
    gradientRecipe: "editorial-wash",
    textMaySitDirectlyOnGradient: false,
    requiresHeroScrim: true,
    maxGradientInfluencePercent: 8,
    contrastTier: "strict",
    semanticOverrides: {
      accent: "warm-amber",
      heroWash: "editorial-warm-wash",
      heroScrim: "editorial-soft-scrim",
    },
  },
  "inner-circle": {
    id: "inner-circle",
    label: "Inner Circle",
    pathPrefix: "/inner-circle",
    tone: "restricted",
    density: "balanced",
    heroStyle: "panel-led",
    metadataEmphasis: "high",
    readerMode: "restricted",
    defaultImageRatio: "landscape",
    gradientRecipe: "warm-restricted-wash",
    textMaySitDirectlyOnGradient: false,
    requiresHeroScrim: true,
    maxGradientInfluencePercent: 8,
    contrastTier: "strict",
    semanticOverrides: {
      accent: "deep-amber",
      panel: "restricted-panel",
      panelAlt: "restricted-panel-alt",
      heroWash: "restricted-warm-wash",
      heroScrim: "restricted-deep-scrim",
    },
  },
};

export function getSurfaceContract(pathname: string): SurfaceContract {
  const ordered = Object.values(SURFACE_CONTRACTS).sort(
    (a, b) => b.pathPrefix.length - a.pathPrefix.length,
  );

  const match = ordered.find((surface) => {
    if (surface.pathPrefix === "/") return pathname === "/";
    return pathname === surface.pathPrefix || pathname.startsWith(`${surface.pathPrefix}/`);
  });

  return match ?? SURFACE_CONTRACTS.home;
}
