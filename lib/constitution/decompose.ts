export type NarrativeParts = {
  problem?: string;
  cause?: string;
  impact?: string;
  constraint?: string;
  outcome?: string;
};

export function decomposeNarrative(text: string): NarrativeParts {
  const lower = text.toLowerCase();

  const extract = (patterns: string[]): string | undefined => {
    for (const pattern of patterns) {
      const match = text.split(new RegExp(pattern, "i"))[1];
      if (match) return match.slice(0, 280).trim();
    }
    return undefined;
  };

  return {
    problem: extract(["problem is", "we are facing", "the issue is", "challenge is"]),
    cause: extract(["because", "due to", "caused by", "rooted in"]),
    impact: extract(["this leads to", "resulting in", "impact is", "consequence is"]),
    constraint: extract(["constraint is", "limited by", "blocked by", "but we can't"]),
    outcome: extract(["we need", "goal is", "desired outcome", "want to achieve"]),
  };
}