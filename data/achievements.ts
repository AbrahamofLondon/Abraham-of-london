// data/achievements.ts
export interface Achievement {
  title: string;
  description: string;
  year: number;
}

export const achievements: Achievement[] = [
  {
    title: "Self-advocate & Thought Leader",
    description: "Legal matters & civic engagement",
    year: 2010,
  },
  { title: "Featured", description: "Lonely Heroes initiative", year: 2025 },
  {
    title: "Best-Selling Author",
    description: "Wide international readership",
    year: 2025,
  },
  {
    title: "Global Leadership Award",
    description: "Recognized for innovative leadership",
    year: 2025,
  },
];
