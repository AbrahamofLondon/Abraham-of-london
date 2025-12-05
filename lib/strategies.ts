// lib/strategies.ts
export interface Strategy {
  slug: string;
  title: string;
  description?: string;
  content?: string;
  [key: string]: unknown;
}

export function getAllStrategies(): Strategy[] {
  return [];
}

export const allStrategies: Strategy[] = getAllStrategies();

export const components = {
  // MDX components placeholder
};
