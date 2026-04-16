// Surface Contracts

export type SurfaceTone = 'warm' | 'neutral' | 'cool';
export type SurfaceDensity = 'spacious' | 'comfortable' | 'dense';
export type HeroStyle = 'minimal' | 'standard' | 'cinematic' | 'technical';
export type MetadataEmphasis = 'low' | 'medium' | 'high';
export type SpacingToken = '2' | '3' | '4' | '6' | '8' | '10' | '12';

export interface SurfaceContract {
  id: string;
  name: string;
  path: string;
  icon: string;
  tone: SurfaceTone;
  density: SurfaceDensity;
  heroStyle: HeroStyle;
  metadataEmphasis: MetadataEmphasis;
  contrastTier: 'AAA' | 'AA';
  cardRhythm: SpacingToken;
  imageRatio: 'square' | 'portrait' | 'video' | 'wide';
  readerMode: 'prose' | 'technical' | 'scan';
}

export const surfaces: Record<string, SurfaceContract> = {
  canon: {
    id: 'canon',
    name: 'Canon',
    path: '/canon',
    icon: 'BookOpen',
    tone: 'warm',
    density: 'spacious',
    heroStyle: 'standard',
    metadataEmphasis: 'high',
    contrastTier: 'AAA',
    cardRhythm: '10',
    imageRatio: 'square',
    readerMode: 'prose',
  },
  vault: {
    id: 'vault',
    name: 'Vault',
    path: '/vault',
    icon: 'Shield',
    tone: 'cool',
    density: 'dense',
    heroStyle: 'technical',
    metadataEmphasis: 'medium',
    contrastTier: 'AA',
    cardRhythm: '6',
    imageRatio: 'square',
    readerMode: 'technical',
  },
  essays: {
    id: 'essays',
    name: 'Essays',
    path: '/blog',
    icon: 'Feather',
    tone: 'warm',
    density: 'comfortable',
    heroStyle: 'standard',
    metadataEmphasis: 'medium',
    contrastTier: 'AAA',
    cardRhythm: '8',
    imageRatio: 'video',
    readerMode: 'prose',
  },
  shorts: {
    id: 'shorts',
    name: 'Shorts',
    path: '/shorts',
    icon: 'Zap',
    tone: 'neutral',
    density: 'dense',
    heroStyle: 'minimal',
    metadataEmphasis: 'low',
    contrastTier: 'AA',
    cardRhythm: '2',
    imageRatio: 'square',
    readerMode: 'scan',
  },
  books: {
    id: 'books',
    name: 'Books',
    path: '/books',
    icon: 'Library',
    tone: 'neutral',
    density: 'dense',
    heroStyle: 'standard',
    metadataEmphasis: 'medium',
    contrastTier: 'AA',
    cardRhythm: '6',
    imageRatio: 'portrait',
    readerMode: 'prose',
  },
  library: {
    id: 'library',
    name: 'Library',
    path: '/library',
    icon: 'Archive',
    tone: 'neutral',
    density: 'dense',
    heroStyle: 'minimal',
    metadataEmphasis: 'low',
    contrastTier: 'AA',
    cardRhythm: '4',
    imageRatio: 'square',
    readerMode: 'scan',
  },
  'inner-circle': {
    id: 'inner-circle',
    name: 'Inner Circle',
    path: '/inner-circle',
    icon: 'Lock',
    tone: 'warm',
    density: 'dense',
    heroStyle: 'minimal',
    metadataEmphasis: 'high',
    contrastTier: 'AA',
    cardRhythm: '4',
    imageRatio: 'square',
    readerMode: 'scan',
  },
  downloads: {
    id: 'downloads',
    name: 'Downloads',
    path: '/downloads',
    icon: 'Download',
    tone: 'neutral',
    density: 'dense',
    heroStyle: 'minimal',
    metadataEmphasis: 'medium',
    contrastTier: 'AA',
    cardRhythm: '3',
    imageRatio: 'square',
    readerMode: 'scan',
  },
  resources: {
    id: 'resources',
    name: 'Resources',
    path: '/resources',
    icon: 'Folder',
    tone: 'neutral',
    density: 'comfortable',
    heroStyle: 'minimal',
    metadataEmphasis: 'medium',
    contrastTier: 'AA',
    cardRhythm: '6',
    imageRatio: 'square',
    readerMode: 'scan',
  },
  events: {
    id: 'events',
    name: 'Events',
    path: '/events',
    icon: 'Calendar',
    tone: 'neutral',
    density: 'comfortable',
    heroStyle: 'standard',
    metadataEmphasis: 'high',
    contrastTier: 'AA',
    cardRhythm: '6',
    imageRatio: 'video',
    readerMode: 'scan',
  },
  editorial: {
    id: 'editorial',
    name: 'Editorial',
    path: '/editorial',
    icon: 'PenTool',
    tone: 'warm',
    density: 'comfortable',
    heroStyle: 'standard',
    metadataEmphasis: 'high',
    contrastTier: 'AAA',
    cardRhythm: '8',
    imageRatio: 'video',
    readerMode: 'prose',
  },
  'vault-briefs': {
    id: 'vault-briefs',
    name: 'Vault Briefs',
    path: '/vault/briefs',
    icon: 'FileText',
    tone: 'cool',
    density: 'dense',
    heroStyle: 'technical',
    metadataEmphasis: 'high',
    contrastTier: 'AA',
    cardRhythm: '3',
    imageRatio: 'square',
    readerMode: 'technical',
  },
};

export function getSurface(id: string): SurfaceContract | undefined {
  return surfaces[id];
}

export function getAllSurfaces(): SurfaceContract[] {
  return Object.values(surfaces);
}