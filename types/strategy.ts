// types/strategy.ts
// Minimal placeholders so imports compile. Flesh out when strategy content is wired.

export type StrategyDoc = {
  slug: string;
  title: string;
  date?: string;
  summary?: string;
  tags?: string[];
};

export type StrategyLink = {
  href: string;
  label: string;
  sub?: string;
};