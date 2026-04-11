export function createStrategySession(input: {
  caseKey: string;
  operatorKey?: string;
  source: string;
  trigger?: string;
}) {
  // later → DB-backed
  return {
    sessionId: `str_${Math.random().toString(36).slice(2)}`,
    createdAt: new Date().toISOString(),
    ...input,
  };
}