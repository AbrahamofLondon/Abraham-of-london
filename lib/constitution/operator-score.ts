type OperatorScore = {
  operatorKey: string;
  score: number; // 0–100
  penalties: number;
  lastUpdated: string;
};

const operatorScores = new Map<string, OperatorScore>();

function now() {
  return new Date().toISOString();
}

export function getOperatorScore(operatorKey: string): OperatorScore {
  return (
    operatorScores.get(operatorKey) || {
      operatorKey,
      score: 75,
      penalties: 0,
      lastUpdated: now(),
    }
  );
}

export function applyOperatorPenalty(
  operatorKey: string,
  severity: number,
) {
  const existing = getOperatorScore(operatorKey);

  const penalty = Math.min(30, severity * 5);

  const updated: OperatorScore = {
    operatorKey,
    score: Math.max(0, existing.score - penalty),
    penalties: existing.penalties + 1,
    lastUpdated: now(),
  };

  operatorScores.set(operatorKey, updated);

  return updated;
}