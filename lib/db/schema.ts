// lib/db/schema.ts

export interface ShortInteraction {
  id: number;
  slug: string;
  sessionId: string;
  liked: boolean;
  saved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ShortInteractionSummary {
  slug: string;
  likes: number;
  saves: number;
}

export interface ShortInteractionState {
  slug: string;
  sessionId: string;
  liked: boolean;
  saved: boolean;
}
