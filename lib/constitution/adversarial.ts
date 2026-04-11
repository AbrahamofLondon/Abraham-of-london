export function generateChallenges(input: {
  clarity: number;
  coherence: number;
  seriousness: number;
}): string[] {
  const challenges: string[] = [];

  if (input.clarity < 60) {
    challenges.push(
      "You may not fully understand the problem you are trying to solve.",
    );
  }

  if (input.coherence < 60) {
    challenges.push(
      "Your narrative lacks internal consistency. The strategy may be built on weak assumptions.",
    );
  }

  if (input.seriousness < 50) {
    challenges.push(
      "This may not be a decision of real consequence. Escalation could be premature.",
    );
  }

  challenges.push(
    "What evidence would prove your current thinking wrong?",
  );

  return challenges;
}