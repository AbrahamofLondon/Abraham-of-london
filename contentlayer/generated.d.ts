// contentlayer/generated.d.ts
declare module 'contentlayer/generated' {
  import type {
    Book,
    Canon,
    DocumentTypes,
    Download,
    Event,
    Playbook,
    Post,
    Print,
    Resource,
    Short,
    Strategy,
  } from '.contentlayer/generated/types';
  
  export const allDocuments: DocumentTypes[];
  export const allPosts: Post[];
  export const allBooks: Book[];
  export const allCanons: Canon[];
  export const allDownloads: Download[];
  export const allEvents: Event[];
  export const allPlaybooks: Playbook[];
  export const allPrints: Print[];
  export const allResources: Resource[];
  export const allShorts: Short[];
  export const allStrategies: Strategy[];

  export type { Playbook };
}
