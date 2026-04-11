export function estimateSeriousness(input: {
  seriousnessScore: number;
  failureModeCount: number;
  failureModeSeverity: number;
  interventionReadiness: number;
  narrativeCoherence: number;
}): number {
  const penalty = input.failureModeCount * 8 + Math.max(0, 100 - input.interventionReadiness) * 0.2;
  return Math.min(100, Math.round(input.seriousnessScore + penalty * 0.3));
}

export function scoreSeriousness(text: string): number {
  const lower = text.toLowerCase();
  let score = 30; // base score

  if (/risk|loss|failure|collapse|crisis|threat/.test(lower)) score += 25;
  if (/board|ceo|investor|stakeholder|regulator/.test(lower)) score += 20;
  if (/revenue|cost|profit|capital|funding|valuation/.test(lower)) score += 22;
  if (/deadline|timeline|urgent|critical|immediate/.test(lower)) score += 18;
  if (text.length > 250) score += 15;

  return Math.min(100, score);
}