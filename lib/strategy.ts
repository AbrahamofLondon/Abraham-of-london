// lib/strategy.ts
export type Strategy = {
  slug: string;
  title: string;
  excerpt?: string;
};

export async function getAll(): Promise<Strategy[]> {
  // TODO: replace with real data
  return [];
}

export async function findBySlug(slug: string): Promise<Strategy | null> {
  // TODO: replace with real data
  return null;
}
