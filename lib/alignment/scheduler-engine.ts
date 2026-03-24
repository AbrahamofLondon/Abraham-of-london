export type InterventionType = 'STRATEGIC_PULSE' | 'COHORT_SYNCHRONIZATION' | 'DIRECTIVE_REINFORCEMENT';

export interface ScheduledProtocol {
  id: string;
  teamName: string;
  type: InterventionType;
  startDate: Date;
  intensity: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'QUEUED' | 'ACTIVE' | 'COMPLETED';
}

export function suggestIntensity(delta: number, fragility: number): 'LOW' | 'MEDIUM' | 'HIGH' {
  const riskScore = delta + (fragility * 1.5);
  if (riskScore > 40) return 'HIGH';
  if (riskScore > 20) return 'MEDIUM';
  return 'LOW';
}